import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HashService } from '../security/hash.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { ListUsersQuery } from './dto/list-users.query.js';
import { ProfileResponse } from './dto/profile.response.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import {
  UserListItem,
  type UsersPageResponse,
} from './dto/users-page.response.js';
import { USER_ERROR_MESSAGES } from './users.messages.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly hashes: HashService,
    private readonly dataSource: DataSource,
  ) {}

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

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const updated = await this.users.update(id, {
      login: dto.login,
      email: dto.email,
      age: dto.age,
      description: dto.description,
    });
    if (!updated) {
      throw new NotFoundException(USER_ERROR_MESSAGES.notFound);
    }
    return this.getProfile(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findCredentialsById(id);
    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.notFound);
    }
    const isOldPasswordValid = await this.hashes.verifyPassword(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException(USER_ERROR_MESSAGES.wrongOldPassword);
    }
    const passwordHash = await this.hashes.hashPassword(dto.newPassword);
    await this.dataSource.transaction(async (manager) => {
      const updated = await this.users.updatePasswordHash(
        id,
        passwordHash,
        manager,
      );
      if (!updated) {
        throw new NotFoundException(USER_ERROR_MESSAGES.notFound);
      }
      await this.sessions.closeAll(id, manager);
    });
  }

  async deleteProfile(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const deleted = await this.users.softDelete(id, manager);
      if (!deleted) {
        throw new NotFoundException(USER_ERROR_MESSAGES.notFound);
      }
      await this.sessions.closeAll(id, manager);
    });
  }
}
