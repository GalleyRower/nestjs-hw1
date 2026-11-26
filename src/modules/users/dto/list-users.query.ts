import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ToInt, TrimLowercase } from '../../../common/validation/transforms.js';
import {
  LIMIT_DEFAULT,
  LIMIT_MAX,
  LIMIT_MIN,
  LOGIN_MAX_LENGTH,
  PAGE_DEFAULT,
  PAGE_MAX,
  PAGE_MIN,
} from '../users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../users.messages.js';

export class ListUsersQuery {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: PAGE_MIN,
    maximum: PAGE_MAX,
    default: PAGE_DEFAULT,
  })
  @ToInt()
  @IsInt({ message: MESSAGES.page })
  @Min(PAGE_MIN, { message: MESSAGES.page })
  @Max(PAGE_MAX, { message: MESSAGES.page })
  page: number = PAGE_DEFAULT;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: LIMIT_MIN,
    maximum: LIMIT_MAX,
    default: LIMIT_DEFAULT,
  })
  @ToInt()
  @IsInt({ message: MESSAGES.limit })
  @Min(LIMIT_MIN, { message: MESSAGES.limit })
  @Max(LIMIT_MAX, { message: MESSAGES.limit })
  limit: number = LIMIT_DEFAULT;

  @ApiPropertyOptional({
    maxLength: LOGIN_MAX_LENGTH,
    description: 'Поиск по части логина',
  })
  @TrimLowercase()
  @IsOptional()
  @IsString({ message: MESSAGES.loginType })
  @MaxLength(LOGIN_MAX_LENGTH, { message: MESSAGES.loginSearchLength })
  login?: string;
}
