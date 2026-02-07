import { Global, Module } from '@nestjs/common';
import { ShareUserRepository } from './repositories/share-user.repo';
import { EmailService } from './services/email.service';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

const sharedServices = [
  PrismaService,
  HashingService,
  ShareUserRepository,
  EmailService,
];

@Global()
@Module({
  providers: [...sharedServices],

  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
