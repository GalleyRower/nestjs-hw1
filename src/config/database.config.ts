import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { envInt, parseEnv } from './env.js';

const schema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: envInt(1, 65_535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});

export const databaseConfig = registerAs('database', () => {
  const env = parseEnv(schema);
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
});
