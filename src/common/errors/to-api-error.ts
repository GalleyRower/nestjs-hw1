import { HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { QueryFailedError } from 'typeorm';
import { COMMON_ERROR_MESSAGES } from '../constants/error.messages.js';
import type { FieldErrorDto } from '../dto/error-response.dto.js';
import { ValidationException } from './validation.exception.js';

const PG_UNIQUE_VIOLATION = '23505';
const PG_QUERY_CANCELED = '57014';
const PG_DATA_EXCEPTION_CLASS = '22';

export type UniqueMessages = Record<string, string>;

export interface ApiError {
  statusCode: number;
  message: string;
  details?: FieldErrorDto[];
}

const INTERNAL_ERROR: ApiError = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: COMMON_ERROR_MESSAGES.internal,
};

function fromDatabase(
  error: DatabaseError,
  uniqueMessages: UniqueMessages,
): ApiError {
  const code = error.code ?? '';
  if (code === PG_UNIQUE_VIOLATION) {
    return {
      statusCode: HttpStatus.CONFLICT,
      message:
        uniqueMessages[error.constraint ?? ''] ??
        COMMON_ERROR_MESSAGES.conflict,
    };
  }
  if (code === PG_QUERY_CANCELED) {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: COMMON_ERROR_MESSAGES.databaseTimeout,
    };
  }
  if (code.startsWith(PG_DATA_EXCEPTION_CLASS)) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: COMMON_ERROR_MESSAGES.invalidData,
    };
  }
  return INTERNAL_ERROR;
}

function fromHttp(exception: HttpException): ApiError {
  const statusCode = exception.getStatus();
  if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE) {
    return { statusCode, message: COMMON_ERROR_MESSAGES.tooLarge };
  }
  if (exception.cause instanceof SyntaxError) {
    return { statusCode, message: COMMON_ERROR_MESSAGES.unreadable };
  }
  return { statusCode, message: exception.message };
}

export function toApiError(
  exception: unknown,
  uniqueMessages: UniqueMessages,
): ApiError {
  if (exception instanceof ValidationException) {
    return {
      statusCode: exception.getStatus(),
      message: exception.message,
      details: exception.details,
    };
  }
  if (exception instanceof HttpException) {
    return fromHttp(exception);
  }
  if (exception instanceof QueryFailedError) {
    const driverError = exception.driverError;
    return driverError instanceof DatabaseError
      ? fromDatabase(driverError, uniqueMessages)
      : INTERNAL_ERROR;
  }
  return INTERNAL_ERROR;
}
