import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, MoreThan, Repository } from 'typeorm';
import { RefreshSessionEntity } from './entities/refresh-session.entity.js';

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(RefreshSessionEntity)
    private readonly repository: Repository<RefreshSessionEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<RefreshSessionEntity> {
    return manager?.getRepository(RefreshSessionEntity) ?? this.repository;
  }

  async create(
    data: CreateSessionData,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).insert({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
  }

  // один DELETE, поэтому из двух параллельных refresh пройдет только один
  async consume(
    userId: string,
    tokenHash: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.repo(manager).delete({
      userId,
      tokenHash,
      expiresAt: MoreThan(new Date()),
    });
    return result.affected === 1;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.repository.delete({ tokenHash });
  }

  async deleteByUserId(userId: string, manager?: EntityManager): Promise<void> {
    await this.repo(manager).delete({ userId });
  }
}
