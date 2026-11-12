import { randomUUID } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config.js';
import {
  ACCESS_TOKEN_TYPE,
  JWT_ALGORITHM,
  REFRESH_TOKEN_TYPE,
} from './security.constants.js';
import { SECURITY_ERROR_MESSAGES } from './security.messages.js';
import {
  type AccessPayload,
  type RefreshPayload,
  refreshPayloadSchema,
} from './token-payload.js';

const MS_IN_SECOND = 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async issuePair(userId: string): Promise<TokenPair> {
    const access: AccessPayload = { sub: userId, type: ACCESS_TOKEN_TYPE };
    // без jti два токена из одной секунды совпадут
    const refresh: RefreshPayload = {
      sub: userId,
      type: REFRESH_TOKEN_TYPE,
      jti: randomUUID(),
    };
    const refreshExpiresAt = new Date(
      Date.now() + this.config.refreshTtlSeconds * MS_IN_SECOND,
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access, {
        secret: this.config.accessSecret,
        expiresIn: this.config.accessTtlSeconds,
        algorithm: JWT_ALGORITHM,
      }),
      this.jwt.signAsync(refresh, {
        secret: this.config.refreshSecret,
        expiresIn: this.config.refreshTtlSeconds,
        algorithm: JWT_ALGORITHM,
      }),
    ]);
    return { accessToken, refreshToken, refreshExpiresAt };
  }

  async verifyRefresh(token: string): Promise<RefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        { secret: this.config.refreshSecret, algorithms: [JWT_ALGORITHM] },
      );
      return refreshPayloadSchema.parse(payload);
    } catch {
      throw new UnauthorizedException(SECURITY_ERROR_MESSAGES.sessionExpired);
    }
  }
}
