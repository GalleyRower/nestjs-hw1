import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import {
  ApiClient,
  type ErrorBody,
  uniqueLogin,
  type UsersPageBody,
} from './utils/api-client.js';
import { createTestApp } from './utils/create-test-app.js';

describe('users', () => {
  let app: INestApplication<App>;
  let api: ApiClient;
  let token: string;
  const prefix = uniqueLogin('list');

  beforeAll(async () => {
    app = await createTestApp();
    api = new ApiClient(app);
    for (let i = 0; i < 5; i += 1) {
      const session = await api.signUp(`${prefix}_${i}`);
      token = session.token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const list = (query: string, accessToken: string | undefined = token) =>
    api.request<UsersPageBody & ErrorBody>('get', `/users?${query}`, {
      token: accessToken,
    });

  it('401 без токена', async () => {
    expect((await api.request('get', '/users')).status).toBe(401);
  });

  it('не показывает email и секреты', async () => {
    const { body } = await list(`login=${prefix}&limit=1`);

    expect(Object.keys(body.items[0] ?? {}).toSorted()).toEqual([
      'age',
      'createdAt',
      'description',
      'id',
      'login',
    ]);
  });

  it('страницы не пересекаются и идут от новых к старым', async () => {
    const pages = await Promise.all(
      [1, 2, 3, 4].map((page) => list(`login=${prefix}&limit=2&page=${page}`)),
    );
    const logins = pages.flatMap(({ body }) =>
      body.items.map((item) => item.login),
    );

    expect(logins).toEqual([4, 3, 2, 1, 0].map((i) => `${prefix}_${i}`));
    expect(pages.map(({ body }) => body.items.length)).toEqual([2, 2, 1, 0]);
    expect(pages[1]?.body).toMatchObject({ total: 5, page: 2, limit: 2 });
  });

  it('порядок стабилен при одинаковом created_at', async () => {
    await app
      .get(DataSource)
      .query('UPDATE users SET created_at = $1 WHERE login LIKE $2', [
        new Date(),
        `${prefix}%`,
      ]);
    const load = async () => {
      const pages = await Promise.all(
        [1, 2, 3].map((page) => list(`login=${prefix}&limit=2&page=${page}`)),
      );
      return pages.flatMap(({ body }) => body.items.map((item) => item.id));
    };
    const ids = await load();

    expect(new Set(ids).size).toBe(5);
    expect(await load()).toEqual(ids);
  });

  it('по умолчанию page=1, limit=20', async () => {
    expect((await list('')).body).toMatchObject({ page: 1, limit: 20 });
  });

  it('ищет по части логина без учета регистра', async () => {
    const part = `${prefix}_3`.slice(2).toUpperCase();
    const { body } = await list(`login=${part}`);

    expect(body.items.map((item) => item.login)).toEqual([`${prefix}_3`]);
  });

  it('спецсимволы LIKE ищет как обычные', async () => {
    const query = (login: string) => list(`login=${encodeURIComponent(login)}`);

    expect((await query('%')).body.total).toBe(0);
    expect((await query('\\')).body.total).toBe(0);
    expect((await query(prefix.replaceAll('_', '%'))).body.total).toBe(0);
    expect((await query(prefix.replace('_', 'x'))).body.total).toBe(0);
  });

  it.each([
    'page=0',
    'page=-1',
    'page=abc',
    'page=',
    'page=1.5',
    'page=10001',
    'limit=0',
    'limit=101',
    `login=${'a'.repeat(33)}`,
    'sort=login',
  ])('400 на %s', async (query) => {
    expect((await list(query)).status).toBe(400);
  });

  it.each(['page=10000', 'limit=100', 'limit=1'])(
    '200 на %s',
    async (query) => {
      expect((await list(query)).status).toBe(200);
    },
  );
});
