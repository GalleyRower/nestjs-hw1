import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { envInt, parseEnv } from './env.js';

const schema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: envInt(1, 65_535),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_POOL_SIZE: envInt(1, 100),
  DB_CONNECT_TIMEOUT_MS: envInt(100, 60_000),
  DB_STATEMENT_TIMEOUT_MS: envInt(100, 60_000),
});

export const databaseConfig = registerAs('database', () => {
  const env = parseEnv(schema);
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    poolSize: env.DB_POOL_SIZE,
    connectTimeoutMs: env.DB_CONNECT_TIMEOUT_MS,
    statementTimeoutMs: env.DB_STATEMENT_TIMEOUT_MS,
  };
});
