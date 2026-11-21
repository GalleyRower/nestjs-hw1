import { IsByteLength, IsString, MinLength } from 'class-validator';
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from '../users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../users.messages.js';

export class ChangePasswordDto {
  @IsString({ message: MESSAGES.passwordType })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  oldPassword: string;

  @IsString({ message: MESSAGES.passwordType })
  @MinLength(PASSWORD_MIN_LENGTH, { message: MESSAGES.passwordMin })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  newPassword: string;
}
