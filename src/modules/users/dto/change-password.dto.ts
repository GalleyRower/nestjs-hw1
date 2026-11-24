import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString, MinLength } from 'class-validator';
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from '../users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../users.messages.js';

export class ChangePasswordDto {
  @ApiProperty({ example: 'qwerty-12345', maxLength: PASSWORD_MAX_BYTES })
  @IsString({ message: MESSAGES.passwordType })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  oldPassword: string;

  @ApiProperty({
    example: 'new-qwerty-12345',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_BYTES,
    description: `Максимум считается в байтах, не больше ${PASSWORD_MAX_BYTES}`,
  })
  @IsString({ message: MESSAGES.passwordType })
  @MinLength(PASSWORD_MIN_LENGTH, { message: MESSAGES.passwordMin })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  newPassword: string;
}
