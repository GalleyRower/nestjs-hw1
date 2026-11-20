import { Controller, Get } from '@nestjs/common';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { ProfileResponse } from './dto/profile.response.js';
import { UsersService } from './users.service.js';

@Controller('profile/my')
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMy(@CurrentUserId() userId: string): Promise<ProfileResponse> {
    return this.users.getProfile(userId);
  }
}
