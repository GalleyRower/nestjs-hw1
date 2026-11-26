import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { QueryFailedError } from 'typeorm';
import { toApiError } from './to-api-error.js';

const UNIQUE_MESSAGES = {
  users_login_active_uq: 'Логин уже занят, выбери другой',
  users_email_active_uq: 'Email уже занят, укажи другой',
};

function queryError(code: string, constraint?: string): QueryFailedError {
  const error = new DatabaseError('duplicate key', 0, 'error');
  error.code = code;
  error.constraint = constraint;
  return new QueryFailedError('INSERT', [], error);
}

describe('toApiError', () => {
  it.each([
    [
      queryError('23505', 'users_login_active_uq'),
      409,
      'Логин уже занят, выбери другой',
    ],
    [
      queryError('23505', 'users_email_active_uq'),
      409,
      'Email уже занят, укажи другой',
    ],
    [queryError('23505', 'other'), 409, 'Такая запись уже существует'],
    [
      queryError('22021'),
      400,
      'В запросе недопустимое значение, проверь данные',
    ],
    [
      queryError('57014'),
      503,
      'Сервис не успел обработать запрос, попробуй позже',
    ],
    [queryError('42P01'), 500, 'Что-то пошло не так, попробуй позже'],
    [
      new BadRequestException('Unexpected token', {
        cause: new SyntaxError('Unexpected token'),
      }),
      400,
      'Не удалось прочитать запрос, проверь формат JSON',
    ],
    [
      new BadRequestException('Bad Request', { cause: new Error('aborted') }),
      400,
      'Bad Request',
    ],
    [new NotFoundException('Профиль не найден'), 404, 'Профиль не найден'],
    [new Error('secret details'), 500, 'Что-то пошло не так, попробуй позже'],
    ['string', 500, 'Что-то пошло не так, попробуй позже'],
  ])('%s -> %i', (exception, statusCode, message) => {
    expect(toApiError(exception, UNIQUE_MESSAGES)).toEqual({
      statusCode,
      message,
    });
  });
});
