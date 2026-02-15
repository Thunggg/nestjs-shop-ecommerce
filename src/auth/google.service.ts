import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import envConfig from 'src/shared/config';
import { GoogleAuthStateType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { HashingService } from 'src/shared/services/hashing.service';
import { RoleService } from './roles.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client;
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    );
  }

  getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const stateString = Buffer.from(
      JSON.stringify({
        userAgent,
        ip,
      }),
    ).toString('base64');

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    });

    return {
      url,
    };
  }

  async googleCallback(code: string, state: string) {
    try {
      let userAgent = 'Unknown';
      let ip = 'Unknown';

      // 1. Lấy thông tin từ state
      try {
        if (state) {
          const clientInfo = JSON.parse(
            Buffer.from(state, 'base64').toString(),
          ) as GoogleAuthStateType;

          userAgent = clientInfo.userAgent;
          ip = clientInfo.ip;
        }
      } catch (error: unknown) {
        console.log(error);
      }

      // 2. dùng code để lấy token
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // 3. lấy thông tin user
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });

      const { data } = await oauth2.userinfo.get();

      if (!data.email) {
        throw new Error('Email is required');
      }

      let user = await this.authRepository.findUniqueUserIncludeRole({
        email: data.email,
      });

      // 4. Nếu user không tồn tại, tạo user mới
      if (!user) {
        const clientRole = await this.roleService.getClientRoleId();
        const randomPassword = uuidv4();
        const hashedPassword = await this.hashingService.hash(randomPassword);

        user = await this.authRepository.createUserIncludRole({
          email: data.email,
          name: data.name ?? '',
          phoneNumber: '',
          roleId: clientRole,
          password: hashedPassword,
          avatar: data.picture ?? null,
        });
      }

      const device = await this.authRepository.createDevice({
        userId: user?.id as number,
        userAgent: userAgent,
        ip: ip,
      });

      const authTokens = await this.authService.generateToken({
        userId: user?.id as number,
        roleId: user?.roleId as number,
        roleName: user?.role.name as string,
        deviceId: device.id,
      });

      return authTokens;
    } catch (error: unknown) {
      console.log(error);
      throw error;
    }
  }
}
