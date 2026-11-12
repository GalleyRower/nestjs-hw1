import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity.js';

export interface CreateUserData {
  login: string;
  email: string;
  passwordHash: string;
  age: number;
  description: string | null;
}

export interface UserCredentials {
  id: string;
  passwordHash: string;
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

  existsById(id: string): Promise<boolean> {
    return this.repository.existsBy({ id });
  }

  findCredentialsByLogin(login: string): Promise<UserCredentials | null> {
    return this.repository.findOne({
      where: { login },
      select: { id: true, passwordHash: true },
    });
  }
}
