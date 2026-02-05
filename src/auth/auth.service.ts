import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime/client';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { RoleService } from './roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
  ) {}

  async register(body: any) {
    try {
      const hashPassword = await this.hashingService.hash(body.password);
      const clientRole = await this.roleService.getClientRoleId();

      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: clientRole,
        },
        omit: {
          password: true,
          totpSecret: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new ConflictException('The field not be empty');
      }

      throw new InternalServerErrorException('Register failed');
    }
  }
}
