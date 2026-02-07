import { Injectable } from '@nestjs/common';
import { VerificationCodeType } from 'generated/prisma/enums';
import { PrismaService } from 'src/shared/services/prisma.service';
import { RegisterBodyType, UserType, VerifyCationCodeType } from './auth.model';

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(
    user: Omit<RegisterBodyType, 'confirmPassword' | 'code'> &
      Pick<UserType, 'roleId'>,
  ) {
    return await this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
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
}
