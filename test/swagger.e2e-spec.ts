import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { ApiClient } from './utils/api-client.js';
import { createTestApp } from './utils/create-test-app.js';

interface OpenApiBody {
  paths: Record<string, Record<string, { security?: object[] }>>;
  components: { securitySchemes: Record<string, object> };
}

describe('swagger', () => {
  let app: INestApplication<App>;
  let api: ApiClient;

  beforeAll(async () => {
    app = await createTestApp();
    api = new ApiClient(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('описывает все маршруты и передачу токенов', async () => {
    const { body } = await api.request<OpenApiBody>('get', '/docs-json');

    expect(Object.keys(body.paths).toSorted()).toEqual([
      '/auth/login',
      '/auth/logout',
      '/auth/refresh',
      '/auth/register',
      '/profile/my',
      '/profile/my/password',
      '/users',
    ]);
    expect(body.paths['/profile/my']?.get?.security).toEqual([{ bearer: [] }]);
    expect(body.paths['/auth/refresh']?.post?.security).toEqual([
      { refresh_token: [] },
    ]);
    expect(Object.keys(body.components.securitySchemes)).toEqual([
      'bearer',
      'refresh_token',
    ]);
  });
});
