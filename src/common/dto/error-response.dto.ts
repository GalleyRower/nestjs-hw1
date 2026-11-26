import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty({ example: 'age' })
  field: string;

  @ApiProperty({ type: [String], example: ['Возраст от 1 до 120'] })
  messages: string[];
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Проверь данные запроса' })
  message: string;

  @ApiPropertyOptional({
    type: [FieldErrorDto],
    description: 'Только для ошибок валидации',
  })
  details?: FieldErrorDto[];

  @ApiProperty({ example: '/profile/my' })
  path: string;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;
}
