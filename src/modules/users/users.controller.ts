import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../../common/decorators/api-errors.decorator.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { UsersPageResponse } from './dto/users-page.response.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOkResponse({ type: UsersPageResponse })
  @ApiErrors(400, 401)
  getPage(@Query() query: ListUsersQuery): Promise<UsersPageResponse> {
    return this.users.getPage(query);
  }
}
