import { Body, Controller, Post } from '@nestjs/common';

import { ZodSerializerDto } from 'nestjs-zod';
import { RegisterBodyDTO, RegisterResponseDTO } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResponseDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }
}
