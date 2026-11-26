import {
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';
import { SECURITY_ERROR_MESSAGES } from '../../security/security.messages.js';
import { JWT_STRATEGY_NAME } from '../auth.constants.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    return isPublic ? true : super.canActivate(context);
  }

  handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error) {
      throw error;
    }
    if (!user) {
      throw new UnauthorizedException(SECURITY_ERROR_MESSAGES.unauthorized);
    }
    return user;
  }
}
