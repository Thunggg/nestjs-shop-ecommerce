import { Injectable } from '@nestjs/common';
import { VerificationCodeType } from 'generated/prisma/enums';
import { PrismaService } from 'src/shared/services/prisma.service';
import {
  DeviceType,
  RefreshTokenType,
  RegisterBodyType,
  RoleType,
  UserType,
  VerifyCationCodeType,
} from './auth.model';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Pick<
      UserType,
      'roleId' | 'email' | 'name' | 'password' | 'phoneNumber'
    >,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return await this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    });
  }

  async createUserIncludRole(
    user: Pick<
      UserType,
      'roleId' | 'email' | 'name' | 'password' | 'phoneNumber' | 'avatar'
    >,
  ): Promise<(UserType & { role: RoleType }) | null> {
    return await this.prismaService.user.create({
      data: user,
      include: {
        role: true,
      },
    });
  }

  async createVerifycationCode(
    value: Pick<VerifyCationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>,
  ): Promise<VerifyCationCodeType | null> {
    return await this.prismaService.verificationCode.upsert({
      where: {
        email_code_type: {
          code: value.code,
          email: value.email,
          type: value.type,
        },
      },
      create: {
        email: value.email,
        type: value.type,
        code: value.code,
        expiresAt: value.expiresAt,
      },
      update: {
        code: value.code,
        expiresAt: value.expiresAt,
      },
    });
  }

  async findUniqueVerifycationCode(uniqueValue: {
    email: string;
    code: string;
    type: VerificationCodeType;
  }) {
    return this.prismaService.verificationCode.findUnique({
      where: {
        email_code_type: uniqueValue,
      },
    });
  }

  async createRefreshToken(value: {
    token: string;
    userId: number;
    deviceId: number;
    expiresAt: Date;
  }) {
    return this.prismaService.refreshToken.create({
      data: {
        userId: value.userId,
        deviceId: value.deviceId,
        expiresAt: value.expiresAt,
        token: value.token,
      },
    });
  }

  async createDevice(
    value: Pick<
      DeviceType,
      | 'userId'
      | 'userAgent'
      | 'ip'
      | ('isActive' & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>)
    >,
  ) {
    return await this.prismaService.device.create({
      data: value,
    });
  }

  async findUniqueUserIncludeRole(
    value: { email: string } | { id: number },
  ): Promise<(UserType & { role: RoleType }) | null> {
    return this.prismaService.user.findUnique({
      where: value,
      include: {
        role: true,
      },
    });
  }

  async findUniqueRefreshTokenIncludeUserRole(uniqueObject: {
    token: string;
  }): Promise<
    (RefreshTokenType & { user: UserType & { role: RoleType } }) | null
  > {
    return this.prismaService.refreshToken.findUnique({
      where: uniqueObject,
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async updateDevice(deviceId: number, data: Partial<DeviceType>) {
    return await this.prismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    });
  }

  async deleteRefreshToken(uniqueObject: {
    token: string;
  }): Promise<RefreshTokenType> {
    return this.prismaService.refreshToken.delete({
      where: uniqueObject,
    });
  }
}
