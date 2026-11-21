import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { NotEmptyBodyPipe } from '../../common/pipes/not-empty-body.pipe.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ProfileResponse } from './dto/profile.response.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller('profile/my')
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMy(@CurrentUserId() userId: string): Promise<ProfileResponse> {
    return this.users.getProfile(userId);
  }

  @Patch()
  updateMy(
    @CurrentUserId() userId: string,
    @Body(NotEmptyBodyPipe) dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.users.updateProfile(userId, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeMyPassword(
    @CurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.users.changePassword(userId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMy(@CurrentUserId() userId: string): Promise<void> {
    return this.users.deleteProfile(userId);
  }
}
