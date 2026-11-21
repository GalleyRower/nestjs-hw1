import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, IsNull, Like, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity.js';

export interface CreateUserData {
  login: string;
  email: string;
  passwordHash: string;
  age: number;
  description: string | null;
}

export interface UpdateUserData {
  login?: string;
  email?: string;
  age?: number;
  description?: string | null;
}

export interface UserCredentials {
  id: string;
  passwordHash: string;
}

export interface FindPageParams {
  page: number;
  limit: number;
  login?: string;
}

export interface UsersPage {
  items: UserEntity[];
  total: number;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  private repo(manager?: EntityManager): Repository<UserEntity> {
    return manager?.getRepository(UserEntity) ?? this.repository;
  }

  create(data: CreateUserData, manager?: EntityManager): Promise<UserEntity> {
    const repository = this.repo(manager);
    return repository.save(
      repository.create({
        login: data.login,
        email: data.email,
        passwordHash: data.passwordHash,
        age: data.age,
        description: data.description,
      }),
    );
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repository.findOneBy({ id });
  }

  existsById(id: string): Promise<boolean> {
    return this.repository.existsBy({ id });
  }

  findCredentialsByLogin(login: string): Promise<UserCredentials | null> {
    return this.repository.findOne({
      where: { login },
      select: { id: true, passwordHash: true },
    });
  }

  findCredentialsById(id: string): Promise<UserCredentials | null> {
    return this.repository.findOne({
      where: { id },
      select: { id: true, passwordHash: true },
    });
  }

  async findPage(params: FindPageParams): Promise<UsersPage> {
    const [items, total] = await this.repository.findAndCount({
      where: params.login
        ? { login: Like(`%${escapeLike(params.login)}%`) }
        : {},
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
    return { items, total };
  }

  async update(id: string, data: UpdateUserData): Promise<boolean> {
    const result = await this.repository.update(
      { id, deletedAt: IsNull() },
      {
        login: data.login,
        email: data.email,
        age: data.age,
        description: data.description,
      },
    );
    return result.affected === 1;
  }

  async updatePasswordHash(
    id: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.repo(manager).update(
      { id, deletedAt: IsNull() },
      { passwordHash },
    );
    return result.affected === 1;
  }

  async softDelete(id: string, manager?: EntityManager): Promise<boolean> {
    const result = await this.repo(manager).softDelete({
      id,
      deletedAt: IsNull(),
    });
    return result.affected === 1;
  }
}
