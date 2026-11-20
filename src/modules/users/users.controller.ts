import { Controller, Get, Query } from '@nestjs/common';
import { ListUsersQuery } from './dto/list-users.query.js';
import { UsersPageResponse } from './dto/users-page.response.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getPage(@Query() query: ListUsersQuery): Promise<UsersPageResponse> {
    return this.users.getPage(query);
  }
}
