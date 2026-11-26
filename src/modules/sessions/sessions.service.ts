import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { HashService } from '../security/hash.service.js';
import { type TokenPair, TokenService } from '../security/token.service.js';
import { SessionsRepository } from './sessions.repository.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly tokens: TokenService,
    private readonly hashes: HashService,
  ) {}

  async open(userId: string, manager?: EntityManager): Promise<TokenPair> {
    const pair = await this.tokens.issuePair(userId);
    await this.sessions.create(
      {
        userId,
        tokenHash: this.hashes.hashToken(pair.refreshToken),
        expiresAt: pair.refreshExpiresAt,
      },
      manager,
    );
    return pair;
  }

  consume(
    userId: string,
    refreshToken: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.sessions.consume(
      userId,
      this.hashes.hashToken(refreshToken),
      manager,
    );
  }

  close(refreshToken: string): Promise<void> {
    return this.sessions.deleteByTokenHash(this.hashes.hashToken(refreshToken));
  }

  closeAll(userId: string, manager?: EntityManager): Promise<void> {
    return this.sessions.deleteByUserId(userId, manager);
  }
}
