import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors } from '../../common/decorators/api-errors.decorator.js';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { NotEmptyBodyPipe } from '../../common/pipes/not-empty-body.pipe.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ProfileResponse } from './dto/profile.response.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile/my')
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOkResponse({ type: ProfileResponse })
  @ApiErrors(401, 404)
  getMy(@CurrentUserId() userId: string): Promise<ProfileResponse> {
    return this.users.getProfile(userId);
  }

  @Patch()
  @ApiOkResponse({ type: ProfileResponse })
  @ApiErrors(400, 401, 404, 409)
  updateMy(
    @CurrentUserId() userId: string,
    @Body(NotEmptyBodyPipe) dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.users.updateProfile(userId, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Пароль сменен, все сессии завершены, войди заново',
  })
  @ApiErrors(400, 401, 404)
  changeMyPassword(
    @CurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.users.changePassword(userId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Профиль удален' })
  @ApiErrors(401, 404)
  deleteMy(@CurrentUserId() userId: string): Promise<void> {
    return this.users.deleteProfile(userId);
  }
}
