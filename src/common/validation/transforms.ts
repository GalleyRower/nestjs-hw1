import { Transform, type TransformFnParams } from 'class-transformer';

function mapString(map: (value: string) => unknown): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? map(value) : (value as unknown),
  );
}

export const TrimLowercase = (): PropertyDecorator =>
  mapString((value) => value.trim().toLowerCase());

export const TrimToNull = (): PropertyDecorator =>
  mapString((value) => value.trim() || null);

export const ToInt = (): PropertyDecorator =>
  mapString((value) => (/^\d+$/.test(value) ? Number(value) : value));
