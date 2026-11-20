import type { UserEntity } from '../entities/user.entity.js';

export class UserListItem {
  id: string;
  login: string;
  age: number;
  description: string | null;
  createdAt: Date;

  static from(user: UserEntity): UserListItem {
    return {
      id: user.id,
      login: user.login,
      age: user.age,
      description: user.description,
      createdAt: user.createdAt,
    };
  }
}

export class UsersPageResponse {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
}
