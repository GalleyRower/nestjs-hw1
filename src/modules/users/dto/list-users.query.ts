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
  LOGIN_MAX_LENGTH,
  PAGE_DEFAULT,
  PAGE_MAX,
} from '../users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../users.messages.js';

export class ListUsersQuery {
  @ToInt()
  @IsInt({ message: MESSAGES.page })
  @Min(1, { message: MESSAGES.page })
  @Max(PAGE_MAX, { message: MESSAGES.page })
  page: number = PAGE_DEFAULT;

  @ToInt()
  @IsInt({ message: MESSAGES.limit })
  @Min(1, { message: MESSAGES.limit })
  @Max(LIMIT_MAX, { message: MESSAGES.limit })
  limit: number = LIMIT_DEFAULT;

  @TrimLowercase()
  @IsOptional()
  @IsString({ message: MESSAGES.loginType })
  @MaxLength(LOGIN_MAX_LENGTH, { message: MESSAGES.loginSearchLength })
  login?: string;
}
