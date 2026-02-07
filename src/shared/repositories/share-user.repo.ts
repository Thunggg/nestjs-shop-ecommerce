import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/shared/services/prisma.service';
import { UserType } from '../models/shared-user.model';

@Injectable()
export class ShareUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where,
    });
  }
}
