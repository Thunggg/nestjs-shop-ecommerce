import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShareUserRepository } from './repositories/share-user.repo';
import { EmailService } from './services/email.service';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';
import { TokenService } from './services/token.service';

const sharedServices = [
  PrismaService,
  HashingService,
  ShareUserRepository,
  EmailService,
  TokenService,
  JwtService,
];

@Global()
@Module({
  providers: [...sharedServices],

  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
