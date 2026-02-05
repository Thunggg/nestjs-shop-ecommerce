import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoleService } from './roles.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RoleService],
})
export class AuthModule {}
