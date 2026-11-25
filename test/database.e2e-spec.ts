import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { UserEntity } from '../src/modules/users/entities/user.entity.js';
import { ApiClient, type ErrorBody, registerBody } from './utils/api-client.js';
import { createTestApp } from './utils/create-test-app.js';

describe('database', () => {
  let app: INestApplication<App>;
  let api: ApiClient;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp({ DB_STATEMENT_TIMEOUT_MS: '500' });
    api = new ApiClient(app);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('миграции и сущности описывают одну схему', async () => {
    const { upQueries } = await dataSource.driver.createSchemaBuilder().log();

    expect(upQueries.map(({ query }) => query)).toEqual([]);
  });

  it('по таймауту отвечает 503 и откатывает транзакцию', async () => {
    const body = registerBody();
    const locker = dataSource.createQueryRunner();
    await locker.startTransaction();
    await locker.query('LOCK TABLE refresh_sessions IN ACCESS EXCLUSIVE MODE');

    const response = await api.request<ErrorBody>('post', '/auth/register', {
      body,
    });
    await locker.rollbackTransaction();
    await locker.release();

    expect(response.status).toBe(503);
    expect(response.body.message).toBe(
      'Сервис не успел обработать запрос, попробуй позже',
    );
    expect(
      await dataSource
        .getRepository(UserEntity)
        .existsBy({ login: body.login }),
    ).toBe(false);
  });
});
