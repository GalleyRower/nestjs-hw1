import { ApiProperty } from '@nestjs/swagger';
import type { UserEntity } from '../entities/user.entity.js';

export class UserListItem {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ivan_petrov' })
  login: string;

  @ApiProperty({ example: 25, type: 'integer' })
  age: number;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ format: 'date-time' })
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
  @ApiProperty({ type: [UserListItem] })
  items: UserListItem[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
