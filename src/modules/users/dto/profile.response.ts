import { ApiProperty } from '@nestjs/swagger';
import type { UserEntity } from '../entities/user.entity.js';

export class ProfileResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ivan_petrov' })
  login: string;

  @ApiProperty({ example: 'ivan@example.com' })
  email: string;

  @ApiProperty({ example: 25, type: 'integer' })
  age: number;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
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
