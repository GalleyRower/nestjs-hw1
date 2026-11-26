import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiErrors } from '../../common/decorators/api-errors.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { TokenPair } from '../security/token.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { REFRESH_COOKIE_NAME } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { RefreshToken } from './decorators/refresh-token.decorator.js';
import { AccessTokenResponse } from './dto/access-token.response.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshCookie } from './refresh-cookie.js';

const REFRESH_IN_COOKIE = 'refresh_token приходит в HttpOnly cookie';

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Post('register')
  @ApiCreatedResponse({
    type: AccessTokenResponse,
    description: REFRESH_IN_COOKIE,
  })
  @ApiErrors(400, 409)
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    return this.respond(response, await this.auth.register(dto));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AccessTokenResponse,
    description: REFRESH_IN_COOKIE,
  })
  @ApiErrors(400, 401)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    return this.respond(response, await this.auth.login(dto));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiOkResponse({
    type: AccessTokenResponse,
    description: 'Новый refresh_token в cookie, старый больше не работает',
  })
  @ApiErrors(401)
  async refresh(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    return this.respond(response, await this.auth.refresh(refreshToken));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE_NAME)
  @ApiNoContentResponse({ description: 'Сессия завершена' })
  async logout(
    @RefreshToken() refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(refreshToken);
    this.refreshCookie.clear(response);
  }

  private respond(response: Response, pair: TokenPair): AccessTokenResponse {
    this.refreshCookie.set(response, pair);
    return { access_token: pair.accessToken };
  }
}
