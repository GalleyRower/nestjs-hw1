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
    app = await createTestApp({
      DB_POOL_SIZE: '2',
      DB_STATEMENT_TIMEOUT_MS: '500',
    });
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

  it('по таймауту отвечает 503, откатывает транзакцию и отдает соединение', async () => {
    const bodies = [registerBody(), registerBody()];
    const responses = [];
    // в пуле из двух одно занято, второй запрос пройдет, только если первый вернул свое
    const locker = dataSource.createQueryRunner();
    try {
      await locker.startTransaction();
      await locker.query(
        'LOCK TABLE refresh_sessions IN ACCESS EXCLUSIVE MODE',
      );
      for (const body of bodies) {
        responses.push(
          await api.request<ErrorBody>('post', '/auth/register', { body }),
        );
      }
    } finally {
      if (locker.isTransactionActive) {
        await locker.rollbackTransaction();
      }
      await locker.release();
    }

    for (const response of responses) {
      expect(response.status).toBe(503);
      expect(response.body.message).toBe(
        'Сервис не успел обработать запрос, попробуй позже',
      );
    }
    const users = dataSource.getRepository(UserEntity);
    for (const { login } of bodies) {
      expect(await users.existsBy({ login })).toBe(false);
    }
    expect(
      (
        await api.request('post', '/auth/register', {
          body: registerBody(),
        })
      ).status,
    ).toBe(201);
  });
});
