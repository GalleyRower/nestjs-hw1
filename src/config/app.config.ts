import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { envInt, parseEnv } from './env.js';

const schema = z.object({
  PORT: envInt(1, 65_535),
});

export const appConfig = registerAs('app', () => {
  const env = parseEnv(schema);
  return { port: env.PORT };
});
