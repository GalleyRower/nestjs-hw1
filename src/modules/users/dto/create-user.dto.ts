import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'ivan_petrov',
    minLength: LOGIN_MIN_LENGTH,
    maxLength: LOGIN_MAX_LENGTH,
    pattern: LOGIN_PATTERN.source,
    description: 'Регистр не учитывается, хранится в нижнем',
  })
  @TrimLowercase()
  @IsString({ message: MESSAGES.loginType })
  @Length(LOGIN_MIN_LENGTH, LOGIN_MAX_LENGTH, { message: MESSAGES.loginLength })
  @Matches(LOGIN_PATTERN, { message: MESSAGES.loginPattern })
  login: string;

  @ApiProperty({
    example: 'ivan@example.com',
    format: 'email',
    maxLength: EMAIL_MAX_LENGTH,
  })
  @TrimLowercase()
  @IsEmail({}, { message: MESSAGES.email })
  @MaxLength(EMAIL_MAX_LENGTH, { message: MESSAGES.emailLength })
  email: string;

  @ApiProperty({
    example: 'qwerty-12345',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_BYTES,
    description: `Максимум считается в байтах, не больше ${PASSWORD_MAX_BYTES}`,
  })
  @IsString({ message: MESSAGES.passwordType })
  @MinLength(PASSWORD_MIN_LENGTH, { message: MESSAGES.passwordMin })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  password: string;

  @ApiProperty({
    example: 25,
    type: 'integer',
    minimum: AGE_MIN,
    maximum: AGE_MAX,
  })
  @IsInt({ message: MESSAGES.ageInt })
  @Min(AGE_MIN, { message: MESSAGES.ageRange })
  @Max(AGE_MAX, { message: MESSAGES.ageRange })
  age: number;

  @ApiPropertyOptional({
    example: 'Учусь писать бэкенд на NestJS',
    type: String,
    nullable: true,
    maxLength: DESCRIPTION_MAX_LENGTH,
  })
  @TrimToNull()
  @IsOptional()
  @IsString({ message: MESSAGES.descriptionType })
  @MaxLength(DESCRIPTION_MAX_LENGTH, { message: MESSAGES.descriptionLength })
  description?: string | null;
}
