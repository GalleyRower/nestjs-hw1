import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListUsersQuery } from './dto/list-users.query.js';
import { ProfileResponse } from './dto/profile.response.js';
import {
  UserListItem,
  type UsersPageResponse,
} from './dto/users-page.response.js';
import { USER_ERROR_MESSAGES } from './users.messages.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getProfile(id: string): Promise<ProfileResponse> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.notFound);
    }
    return ProfileResponse.from(user);
  }

  async getPage(query: ListUsersQuery): Promise<UsersPageResponse> {
    const { items, total } = await this.users.findPage({
      page: query.page,
      limit: query.limit,
      login: query.login,
    });
    return {
      items: items.map((user) => UserListItem.from(user)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  // TODO: обновление профиля, смена пароля, удаление
}
