import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import { addMilliseconds } from 'date-fns';
import ms from 'ms';
import envConfig from 'src/shared/config';
import { generateOTP } from 'src/shared/helper';
import { ShareUserRepository } from 'src/shared/repositories/share-user.repo';
import { HashingService } from 'src/shared/services/hashing.service';
import { RegisterBodyType, SendOTPBodyType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { RoleService } from './roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly roleService: RoleService,
    private readonly authRepository: AuthRepository,
    private readonly shareUserRepository: ShareUserRepository,
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
        throw new UnprocessableEntityException('Email is exist');
      }
      console.log(error);

      throw new InternalServerErrorException('Register failed');
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    try {
      const user = await this.shareUserRepository.findUnique({
        email: body.email,
      });

      if (user) {
        throw new UnprocessableEntityException({
          message: 'Email is exist!',
          path: 'email',
        });
      }

      const code = generateOTP();
      const res = await this.authRepository.createVerifycationCode({
        email: body.email,
        code,
        type: body.type,
        expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
      });

      return res;
    } catch (error) {
      if (error instanceof PrismaClientValidationError) {
        throw new ConflictException('The field not be empty');
      } else if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException('Email is not exist');
      }
      console.log(error);

      throw new InternalServerErrorException('Register failed');
    }
  }
}
