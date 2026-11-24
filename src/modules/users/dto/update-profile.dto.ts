import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

// skipNullProperties: false, иначе null пройдет валидацию и упадет на NOT NULL
export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
  { skipNullProperties: false },
) {}
