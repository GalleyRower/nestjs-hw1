import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { parseEnv } from './env.js';

const schema = z
  .object({
    COOKIE_SECURE: z.stringbool(),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']),
  })
  .refine((env) => env.COOKIE_SAME_SITE !== 'none' || env.COOKIE_SECURE, {
    path: ['COOKIE_SECURE'],
    message: 'для SameSite=none нужен COOKIE_SECURE=true',
  });

export const cookieConfig = registerAs('cookie', () => {
  const env = parseEnv(schema);
  return { secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAME_SITE };
});
