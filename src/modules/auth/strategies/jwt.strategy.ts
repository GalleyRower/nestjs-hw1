import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../../common/decorators/current-user-id.decorator.js';
import { jwtConfig } from '../../../config/jwt.config.js';
import { JWT_ALGORITHM } from '../../security/security.constants.js';
import { SECURITY_ERROR_MESSAGES } from '../../security/security.messages.js';
import { accessPayloadSchema } from '../../security/token-payload.js';
import { UsersRepository } from '../../users/users.repository.js';
import { JWT_STRATEGY_NAME } from '../auth.constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    @Inject(jwtConfig.KEY) config: ConfigType<typeof jwtConfig>,
    private readonly users: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.accessSecret,
      algorithms: [JWT_ALGORITHM],
      ignoreExpiration: false,
    });
  }

  async validate(payload: unknown): Promise<AuthenticatedUser> {
    const result = accessPayloadSchema.safeParse(payload);
    if (!result.success || !(await this.users.existsById(result.data.sub))) {
      throw new UnauthorizedException(SECURITY_ERROR_MESSAGES.unauthorized);
    }
    return { id: result.data.sub };
  }
}
