import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { cookieConfig } from '../../config/cookie.config.js';
import type { TokenPair } from '../security/token.service.js';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from './auth.constants.js';

@Injectable()
export class RefreshCookie {
  private readonly options: CookieOptions;

  constructor(
    @Inject(cookieConfig.KEY) config: ConfigType<typeof cookieConfig>,
  ) {
    this.options = {
      httpOnly: true,
      secure: config.secure,
      sameSite: config.sameSite,
      path: REFRESH_COOKIE_PATH,
    };
  }

  set(response: Response, pair: TokenPair): void {
    response.cookie(REFRESH_COOKIE_NAME, pair.refreshToken, {
      ...this.options,
      expires: pair.refreshExpiresAt,
    });
  }
}
