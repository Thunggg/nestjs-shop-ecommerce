import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import envConfig from '../config';
import {
  AccessTokenPayload,
  AccessTokenPayloadCreate,
  RefreshTokenPayload,
  RefreshTokenPayloadCreate,
} from '../types/jwt.type';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  async signAccessToken(payload: AccessTokenPayloadCreate): Promise<string> {
    return await this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: envConfig.ACCESS_TOKEN_SECRET,
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
      },
    );
  }

  async signRefreshToken(payload: RefreshTokenPayloadCreate): Promise<string> {
    return await this.jwtService.signAsync(
      { ...payload, uuid: uuidv4() },
      {
        secret: envConfig.REFRESH_TOKEN_SECRET,
        expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: envConfig.ACCESS_TOKEN_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: envConfig.REFRESH_TOKEN_SECRET,
    });
  }
}
