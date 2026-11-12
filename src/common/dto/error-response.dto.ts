export class FieldErrorDto {
  field: string;
  messages: string[];
}

export class ErrorResponseDto {
  statusCode: number;
  message: string;
  details?: FieldErrorDto[];
  path: string;
  timestamp: string;
}
