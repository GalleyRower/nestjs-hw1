import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import type { TokenPair } from '../security/token.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { AuthService } from './auth.service.js';
import { AccessTokenResponse } from './dto/access-token.response.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshCookie } from './refresh-cookie.js';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    return this.respond(response, await this.auth.register(dto));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    return this.respond(response, await this.auth.login(dto));
  }

  // TODO: refresh и logout

  private respond(response: Response, pair: TokenPair): AccessTokenResponse {
    this.refreshCookie.set(response, pair);
    return { access_token: pair.accessToken };
  }
}
