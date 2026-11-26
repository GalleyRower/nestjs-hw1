import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { COMMON_ERROR_MESSAGES } from '../constants/error.messages.js';
import type { FieldErrorDto } from '../dto/error-response.dto.js';

const WHITELIST_CONSTRAINT = 'whitelistValidation';

function toMessages(constraints: Record<string, string>): string[] {
  const messages = Object.entries(constraints).map(([name, message]) =>
    name === WHITELIST_CONSTRAINT
      ? COMMON_ERROR_MESSAGES.unknownField
      : message,
  );
  return [...new Set(messages)];
}

function flatten(errors: ValidationError[], parent = ''): FieldErrorDto[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints
      ? [{ field, messages: toMessages(error.constraints) }]
      : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export class ValidationException extends BadRequestException {
  readonly details: FieldErrorDto[];

  constructor(errors: ValidationError[]) {
    super(COMMON_ERROR_MESSAGES.validation);
    this.details = flatten(errors);
  }
}
