import { Transform } from 'class-transformer';

function mapString(map: (value: string) => unknown): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? map(value) : value,
  );
}

export const TrimLowercase = (): PropertyDecorator =>
  mapString((value) => value.trim().toLowerCase());

export const TrimToNull = (): PropertyDecorator =>
  mapString((value) => value.trim() || null);
