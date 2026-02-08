import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import envConfig from '../config';
import { TokenService } from '../services/token.service';

@Injectable()
export class APIKeyGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const xAPIKey = request.headers['x-api-key'];

    if (xAPIKey !== envConfig.SECRET_KEY) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
