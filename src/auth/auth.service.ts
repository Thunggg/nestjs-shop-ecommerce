import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import { HashingService } from 'src/shared/services/hashing.service';
import { RegisterBodyType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { RoleService } from './roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const hashPassword = await this.hashingService.hash(body.password);
      const clientRole = await this.roleService.getClientRoleId();

      const user = await this.authRepository.createUser({
        email: body.email,
        name: body.name,
        password: hashPassword,
        phoneNumber: body.phoneNumber,
        roleId: clientRole,
      });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new ConflictException('The field not be empty');
      } else if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is exist');
      }

      throw new InternalServerErrorException('Register failed');
    }
  }
}
