import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { REFRESH_COOKIE_NAME } from '../auth.constants.js';

interface RequestWithCookies {
  cookies: Record<string, unknown>;
}

export const RefreshToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = request.cookies[REFRESH_COOKIE_NAME];
    return typeof token === 'string' ? token : undefined;
  },
);
