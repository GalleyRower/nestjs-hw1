import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { inject, vi } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { setupApp } from '../../src/app.setup.js';

export const ACCESS_SECRET = 'test-access-secret-test-access-secret';
export const REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';

export async function createTestApp(
  env: Record<string, string> = {},
): Promise<INestApplication<App>> {
  const database = inject('database');
  const values = {
    PORT: '3000',
    DB_HOST: database.host,
    DB_PORT: String(database.port),
    DB_USER: database.username,
    DB_PASSWORD: database.password,
    DB_NAME: database.database,
    DB_POOL_SIZE: '5',
    DB_CONNECT_TIMEOUT_MS: '5000',
    DB_STATEMENT_TIMEOUT_MS: '5000',
    JWT_ACCESS_SECRET: ACCESS_SECRET,
    JWT_REFRESH_SECRET: REFRESH_SECRET,
    JWT_ACCESS_TTL_SECONDS: '900',
    JWT_REFRESH_TTL_SECONDS: '2592000',
    COOKIE_SECURE: 'false',
    COOKIE_SAME_SITE: 'strict',
    ...env,
  };
  for (const [name, value] of Object.entries(values)) {
    vi.stubEnv(name, value);
  }

  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication<INestApplication<App>>({
    logger: false,
  });
  setupApp(app);
  await app.init();
  return app;
}
