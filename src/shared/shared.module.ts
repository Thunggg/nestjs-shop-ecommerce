import { Global, Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

const sharedServices = [PrismaService, HashingService];

@Global()
@Module({
  providers: [...sharedServices],

  exports: [...sharedServices],
  imports: [],
})
export class SharedModule {}
