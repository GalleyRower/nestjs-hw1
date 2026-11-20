import type { UserEntity } from '../entities/user.entity.js';

export class ProfileResponse {
  id: string;
  login: string;
  email: string;
  age: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  static from(user: UserEntity): ProfileResponse {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      age: user.age,
      description: user.description,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
