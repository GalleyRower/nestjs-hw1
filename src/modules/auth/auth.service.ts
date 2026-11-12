import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HashService } from '../security/hash.service.js';
import type { TokenPair } from '../security/token.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UsersRepository } from '../users/users.repository.js';
import { AUTH_ERROR_MESSAGES } from './auth.messages.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly hashes: HashService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: CreateUserDto): Promise<TokenPair> {
    const passwordHash = await this.hashes.hashPassword(dto.password);
    return this.dataSource.transaction(async (manager) => {
      const user = await this.users.create(
        {
          login: dto.login,
          email: dto.email,
          passwordHash,
          age: dto.age,
          description: dto.description ?? null,
        },
        manager,
      );
      return this.sessions.open(user.id, manager);
    });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.users.findCredentialsByLogin(dto.login);
    const isPasswordValid =
      user !== null &&
      (await this.hashes.verifyPassword(dto.password, user.passwordHash));
    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.wrongCredentials);
    }
    return this.sessions.open(user.id);
  }
}
