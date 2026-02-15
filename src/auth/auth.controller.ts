import { Body, Controller, Get, Ip, Post, Query, Res } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from 'src/shared/decorators/auth.decorator';
import { UserAgent } from 'src/shared/decorators/user-agent.decorator';
import { MessageResDTO } from 'src/shared/dtos/response.dto';
import {
  GetAuthorizationUrlResDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResponseDTO,
  SendOTPBodyDTO,
} from './auth.dto';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { Response } from 'express';
import envConfig from 'src/shared/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResponseDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  async login(
    @Body() body: LoginBodyDTO & { userAgent: string; ip: string },
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip,
    });
  }

  @Post('refresh-token')
  @IsPublic()
  @ZodSerializerDto(RefreshTokenResDTO)
  async refreshToken(
    @Body() body: RefreshTokenBodyDTO & { userAgent: string; ip: string },
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    return await this.authService.refreshToken({
      ...body,
      userAgent,
      ip,
    });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('google-link')
  @ZodSerializerDto(GetAuthorizationUrlResDTO)
  @IsPublic()
  getGoogleLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getAuthorizationUrl({ userAgent, ip });
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.googleService.googleCallback(code, state);
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Has error when login with google';
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${message}`,
      );
    }
  }
}
