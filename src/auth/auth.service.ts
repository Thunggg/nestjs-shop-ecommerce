import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import { addMilliseconds } from 'date-fns';
import type { StringValue } from 'ms';
import ms from 'ms';
import envConfig from 'src/shared/config';
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant';
import { generateOTP } from 'src/shared/helper';
import { ShareUserRepository } from 'src/shared/repositories/share-user.repo';
import { EmailService } from 'src/shared/services/email.service';
import { HashingService } from 'src/shared/services/hashing.service';
import { TokenService } from 'src/shared/services/token.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import {
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model';
import { AuthRepository } from './auth.repo';
import { RoleService } from './roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
    private readonly emailService: EmailService,
    private readonly authRepository: AuthRepository,
    private readonly shareUserRepository: ShareUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const verifycationOTP =
        await this.authRepository.findUniqueVerifycationCode({
          code: body.code,
          email: body.email,
          type: TypeOfVerificationCode.REGISTER,
        });

      if (!verifycationOTP) {
        throw new UnprocessableEntityException({
          message: 'OTP is not valid',
          path: 'code',
        });
      }

      if (verifycationOTP.expiresAt < new Date()) {
        throw new UnprocessableEntityException({
          message: 'OTP is expired',
          path: 'code',
        });
      }

      const hashPassword = await this.hashingService.hash(body.password);
      const clientRole = await this.roleService.getClientRoleId();

      const user = await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        password: hashPassword,
        phoneNumber: body.phoneNumber,
        roleId: clientRole,
      });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new ConflictException('The field not be empty');
      } else if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException('Email is exist');
      }
      console.log(error);

      throw error;
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    try {
      const user = await this.shareUserRepository.findUnique({
        email: body.email,
      });

      if (user) {
        throw new UnprocessableEntityException({
          message: 'Email is exist!',
          path: 'email',
        });
      }

      const code = generateOTP();
      const res = await this.authRepository.createVerifycationCode({
        email: body.email,
        code,
        type: body.type,
        expiresAt: addMilliseconds(
          new Date(),
          ms(envConfig.OTP_EXPIRES_IN as StringValue),
        ),
      });

      const { error } = await this.emailService.sendOTP({
        code: code,
        email: body.email,
      });

      if (error) {
        throw new UnprocessableEntityException({
          message: 'Send otp unsuccess',
          path: 'code',
        });
      }

      return res;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new ConflictException('The field not be empty');
      } else if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException('Email is not exist');
      }
      console.log(error);

      throw error;
    }
  }

  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });

    if (!user) {
      throw new UnprocessableEntityException({
        message: 'Email is not exist!',
        path: 'email',
      });
    }

    const isPasswordMatch = await this.hashingService.verify(
      body.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnprocessableEntityException({
        message: 'password is not match!',
        path: 'password',
      });
    }

    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    });

    const tokens = await this.generateToken({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name,
      deviceId: device.id,
    });

    return tokens;
  }

  async generateToken(payload: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId: payload.userId,
        deviceId: payload.deviceId,
        roleId: payload.roleId,
        roleName: payload.roleName,
      }),
      this.tokenService.signRefreshToken(payload),
    ]);

    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);
    await this.authRepository.createRefreshToken({
      deviceId: payload.deviceId,
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    body: RefreshTokenBodyType & { userAgent: string; ip: string },
  ) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(
        body.refreshToken,
      );

      // 2. kiểm tra refreshtoken có tồn tại trong db hay ko
      const refreshTokenIndb =
        await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
          token: body.refreshToken,
        });

      if (!refreshTokenIndb) {
        // trường hợp đã refresh rồi thì thống báo cho user biết
        // refresh token bị đánh cắp
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const {
        deviceId,
        user: { roleId, name: roleName },
      } = refreshTokenIndb;

      // 3. cập nhật device
      // 4. xóa refreshToken cũ
      // 5. tạo accessToken và refreshToken mới
      const [, , tokens] = await Promise.all([
        this.authRepository.updateDevice(deviceId, {
          ip: body.ip,
          userAgent: body.userAgent,
        }),

        this.authRepository.deleteRefreshToken({
          token: body.refreshToken,
        }),

        this.generateToken({
          userId,
          roleId,
          roleName,
          deviceId,
        }),
      ]);

      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. kiểm tra refreshToken có hợp lệ hay không
      await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. Xóa refreshToken trong database
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });

      console.log(deletedRefreshToken);

      // 3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      });

      return { message: 'logout successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UnauthorizedException('Refresh token has been revoke');
      }

      throw new UnauthorizedException();
    }
  }
}
