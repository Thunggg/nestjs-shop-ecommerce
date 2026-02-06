import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repo';
import { AuthService } from './auth.service';
import { RoleService } from './roles.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RoleService, AuthRepository],
})
export class AuthModule {}
