import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenGuard } from './guards/access-token.guard';
import { APIKeyGuard } from './guards/api-key.guard';
import { AuthenticationGuard } from './guards/authentication.guard';
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
  APIKeyGuard,
  AccessTokenGuard,
];

@Global()
@Module({
  providers: [
    ...sharedServices,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],

  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
