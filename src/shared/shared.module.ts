import { Global, Module } from '@nestjs/common';
import { ShareUserRepository } from './repositories/share-user.repo';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

const sharedServices = [PrismaService, HashingService, ShareUserRepository];

@Global()
@Module({
  providers: [...sharedServices],

  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
