import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString, MaxLength } from 'class-validator';
import { TrimLowercase } from '../../../common/validation/transforms.js';
import {
  LOGIN_MAX_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../../users/users.constants.js';
import { USER_VALIDATION_MESSAGES as MESSAGES } from '../../users/users.messages.js';

export class LoginDto {
  @ApiProperty({ example: 'ivan_petrov', maxLength: LOGIN_MAX_LENGTH })
  @TrimLowercase()
  @IsString({ message: MESSAGES.loginType })
  @MaxLength(LOGIN_MAX_LENGTH, { message: MESSAGES.loginLength })
  login: string;

  @ApiProperty({ example: 'qwerty-12345', maxLength: PASSWORD_MAX_BYTES })
  @IsString({ message: MESSAGES.passwordType })
  @IsByteLength(0, PASSWORD_MAX_BYTES, { message: MESSAGES.passwordMax })
  password: string;
}
