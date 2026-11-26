import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { envInt, parseEnv } from './env.js';

const MIN_SECRET_LENGTH = 32;
const YEAR_SECONDS = 31_536_000;

const schema = z
  .object({
    JWT_ACCESS_SECRET: z.string().min(MIN_SECRET_LENGTH),
    JWT_REFRESH_SECRET: z.string().min(MIN_SECRET_LENGTH),
    JWT_ACCESS_TTL_SECONDS: envInt(1, YEAR_SECONDS),
    JWT_REFRESH_TTL_SECONDS: envInt(1, YEAR_SECONDS),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    path: ['JWT_REFRESH_SECRET'],
    message: 'секреты access и refresh должны отличаться',
  })
  .refine((env) => env.JWT_ACCESS_TTL_SECONDS < env.JWT_REFRESH_TTL_SECONDS, {
    path: ['JWT_REFRESH_TTL_SECONDS'],
    message: 'refresh должен жить дольше access',
  });

export const jwtConfig = registerAs('jwt', () => {
  const env = parseEnv(schema);
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
    refreshTtlSeconds: env.JWT_REFRESH_TTL_SECONDS,
  };
});
