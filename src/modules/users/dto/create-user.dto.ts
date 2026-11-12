import {
  IsByteLength,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  TrimLowercase,
  TrimToNull,
} from '../../../common/validation/transforms.js';
import {
  AGE_MAX,
  AGE_MIN,
  DESCRIPTION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_PATTERN,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
} from '../users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../users.messages.js';

export class CreateUserDto {
  @TrimLowercase()
  @IsString({ message: MESSAGES.loginType })
  @Length(LOGIN_MIN_LENGTH, LOGIN_MAX_LENGTH, { message: MESSAGES.loginLength })
  @Matches(LOGIN_PATTERN, { message: MESSAGES.loginPattern })
  login: string;

  @TrimLowercase()
  @IsEmail({}, { message: MESSAGES.email })
  @MaxLength(EMAIL_MAX_LENGTH, { message: MESSAGES.emailLength })
  email: string;

  @IsString({ message: MESSAGES.passwordType })
  @MinLength(PASSWORD_MIN_LENGTH, { message: MESSAGES.passwordMin })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  password: string;

  @IsInt({ message: MESSAGES.ageInt })
  @Min(AGE_MIN, { message: MESSAGES.ageRange })
  @Max(AGE_MAX, { message: MESSAGES.ageRange })
  age: number;

  @TrimToNull()
  @IsOptional()
  @IsString({ message: MESSAGES.descriptionType })
  @MaxLength(DESCRIPTION_MAX_LENGTH, { message: MESSAGES.descriptionLength })
  description?: string | null;
}
