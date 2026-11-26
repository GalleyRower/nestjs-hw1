import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto.js';

const DESCRIPTIONS = {
  [HttpStatus.BAD_REQUEST]: 'Данные не прошли проверку',
  [HttpStatus.UNAUTHORIZED]: 'Нет токена, он истек или невалиден',
  [HttpStatus.NOT_FOUND]: 'Профиль не найден',
  [HttpStatus.CONFLICT]: 'Логин или email занят',
} as const;

export const ApiErrors = (...statuses: (keyof typeof DESCRIPTIONS)[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status],
        type: ErrorResponseDto,
      }),
    ),
  );
