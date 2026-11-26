import { z } from 'zod';

export const envInt = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/, 'нужно целое число')
    .transform(Number)
    .pipe(z.number().min(min).max(max));

export function parseEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Ошибка в переменных окружения\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
