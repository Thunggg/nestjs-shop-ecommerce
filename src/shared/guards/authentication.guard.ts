import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthType, ConditionGuard } from '../constants/auth.constant';
import {
  AUTH_TYPE_KEY,
  AuthTypeDecoratorPayload,
} from '../decorators/auth.decorator';
import { AccessTokenGuard } from './access-token.guard';
import { APIKeyGuard } from './api-key.guard';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: APIKeyGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.APIKey]: this.apiKeyGuard,
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.reflector.getAllAndOverride<
      AuthTypeDecoratorPayload | undefined
    >(AUTH_TYPE_KEY, [context.getHandler(), context.getClass()]) ?? {
      authTypes: [AuthType.Bearer],
      options: { condition: ConditionGuard.Or },
    };

    const guards = authTypeValue.authTypes.map(
      (item) => this.authTypeGuardMap[item],
    );
    let error = new UnauthorizedException();

    if (authTypeValue.options.condition === ConditionGuard.Or) {
      for (const instance of guards) {
        const canActivate = await Promise.resolve(
          instance.canActivate(context),
        ).catch((err) => {
          error = err;
          return false;
        });

        if (canActivate) {
          return true;
        }
      }

      throw error;
    } else {
      for (const instance of guards) {
        const canActivate = await instance.canActivate(context);

        if (!canActivate) {
          throw new UnauthorizedException();
        }
      }
    }

    return true;
  }
}
