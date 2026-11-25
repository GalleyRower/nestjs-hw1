import { setTimeout as sleep } from 'node:timers/promises';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { HashService } from '../src/modules/security/hash.service.js';
import { UserEntity } from '../src/modules/users/entities/user.entity.js';
import {
  ApiClient,
  type ErrorBody,
  PASSWORD,
  type ProfileBody,
  registerBody,
  type UsersPageBody,
} from './utils/api-client.js';
import { ACCESS_SECRET, createTestApp } from './utils/create-test-app.js';

async function waitForShareLocks(
  dataSource: DataSource,
  blockerPid: number,
  count: number,
): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const [{ waiting }] = await dataSource.query<[{ waiting: number }]>(
      `SELECT count(*)::int AS waiting FROM pg_stat_activity
       WHERE $1 = ANY(pg_blocking_pids(pid)) AND query LIKE '%FOR SHARE%'`,
      [blockerPid],
    );
    if (waiting === count) {
      return;
    }
    await sleep(20);
  }
  throw new Error(`${count} запроса так и не встали на блокировку`);
}

describe('profile', () => {
  let app: INestApplication<App>;
  let api: ApiClient;

  beforeAll(async () => {
    app = await createTestApp();
    api = new ApiClient(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const patch = (token: string, body: object) =>
    api.request<ProfileBody & ErrorBody>('patch', '/profile/my', {
      token,
      body,
    });

  describe('доступ', () => {
    it('401 без токена, с мусором и с refresh вместо access', async () => {
      const { cookie } = await api.signUp();

      for (const token of [
        undefined,
        'abc',
        cookie.replace('refresh_token=', ''),
      ]) {
        const response = await api.profile(token);
        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          message: 'Войди в аккаунт, чтобы продолжить',
        });
      }
    });

    it('401 с истекшим, чужим токеном и без type', async () => {
      const { token } = await api.signUp();
      const { id } = (await api.profile(token)).body;
      const jwt = new JwtService();
      const payload = { sub: id, type: 'access' };

      for (const bad of [
        jwt.sign(payload, { secret: ACCESS_SECRET, expiresIn: -1 }),
        jwt.sign(payload, { secret: 'x'.repeat(32) }),
        jwt.sign({ sub: id }, { secret: ACCESS_SECRET }),
        jwt.sign({ ...payload, type: 'refresh' }, { secret: ACCESS_SECRET }),
        jwt.sign({ ...payload, sub: 'abc' }, { secret: ACCESS_SECRET }),
      ]) {
        expect((await api.profile(bad)).status).toBe(401);
      }
      expect(
        (await api.profile(jwt.sign(payload, { secret: ACCESS_SECRET })))
          .status,
      ).toBe(200);
    });
  });

  it('отдает свой профиль без секретов', async () => {
    const [first, second] = await Promise.all([api.signUp(), api.signUp()]);
    const profiles = await Promise.all([
      api.profile(first.token),
      api.profile(second.token),
    ]);

    expect(profiles.map(({ body }) => body.login)).toEqual([
      first.login,
      second.login,
    ]);
    expect(Object.keys(profiles[0].body).toSorted()).toEqual([
      'age',
      'createdAt',
      'description',
      'email',
      'id',
      'login',
      'updatedAt',
    ]);
  });

  describe('обновление', () => {
    it('меняет только переданные поля и только свой профиль', async () => {
      const [me, other] = await Promise.all([api.signUp(), api.signUp()]);
      const response = await patch(me.token, { age: 40 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        login: me.login,
        email: `${me.login}@example.com`,
        age: 40,
        description: 'Учусь писать бэкенд',
      });
      expect((await api.profile(other.token)).body.age).toBe(25);
    });

    it('описание можно очистить', async () => {
      const { token } = await api.signUp();

      expect((await patch(token, { description: null })).body).toMatchObject({
        description: null,
      });
    });

    it('можно передать свой же логин', async () => {
      const { login, token } = await api.signUp();

      expect((await patch(token, { login })).status).toBe(200);
    });

    it('409 на занятые логин и email', async () => {
      const [me, other] = await Promise.all([api.signUp(), api.signUp()]);

      expect((await patch(me.token, { login: other.login })).status).toBe(409);
      expect(
        (await patch(me.token, { email: `${other.login}@example.com` })).status,
      ).toBe(409);
    });

    it.each([
      [{}],
      [{ age: null }],
      [{ login: null }],
      [{ email: null }],
      [{ age: 121 }],
      [{ description: 'a'.repeat(1001) }],
      [{ password: 'new-password' }],
      [{ id: '1' }],
    ])('400 на %j', async (body) => {
      const { token } = await api.signUp();

      expect((await patch(token, body)).status).toBe(400);
    });
  });

  describe('смена пароля', () => {
    const changePassword = (token: string, oldPassword: string) =>
      api.request<ErrorBody>('patch', '/profile/my/password', {
        token,
        body: { oldPassword, newPassword: 'password-2' },
      });

    it('меняет пароль и завершает все сессии', async () => {
      const { login, token, cookie } = await api.signUp();
      const other = await api.login(login);

      expect((await changePassword(token, PASSWORD)).status).toBe(204);
      expect((await api.login(login)).status).toBe(401);
      expect((await api.login(login, 'password-2')).status).toBe(200);
      expect((await api.refresh(cookie)).status).toBe(401);
      expect((await api.refresh(other.cookie)).status).toBe(401);
    });

    it('400 с неверным старым паролем', async () => {
      const { login, token, cookie } = await api.signUp();
      const response = await changePassword(token, 'password-3');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Старый пароль указан неверно');
      expect((await api.login(login)).status).toBe(200);
      expect((await api.refresh(cookie)).status).toBe(200);
    });

    it('вход и refresh во время смены ждут ее и не открывают сессию', async () => {
      const { login, token, cookie } = await api.signUp();
      const { id } = (await api.profile(token)).body;
      const dataSource = app.get(DataSource);
      const passwordHash = await app
        .get(HashService)
        .hashPassword('password-2');
      const locker = dataSource.createQueryRunner();

      try {
        await locker.startTransaction();
        const [{ pid }] = await dataSource.query<[{ pid: number }]>(
          'SELECT pg_backend_pid() AS pid',
          [],
          locker,
        );
        await locker.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [passwordHash, id],
        );
        const pending = Promise.all([api.refresh(cookie), api.login(login)]);
        await waitForShareLocks(dataSource, pid, 2);
        await locker.query('DELETE FROM refresh_sessions WHERE user_id = $1', [
          id,
        ]);
        await locker.commitTransaction();

        const [refreshed, loggedIn] = await pending;
        expect(refreshed.status).toBe(401);
        expect(loggedIn.status).toBe(401);
      } finally {
        if (locker.isTransactionActive) {
          await locker.rollbackTransaction();
        }
        await locker.release();
      }
      expect((await api.login(login, 'password-2')).status).toBe(200);
    });
  });

  describe('удаление', () => {
    it('мягкое, после него не пускает ни один токен', async () => {
      const [me, other] = await Promise.all([api.signUp(), api.signUp()]);
      const response = await api.request('delete', '/profile/my', {
        token: me.token,
      });

      expect(response.status).toBe(204);
      expect((await api.profile(me.token)).status).toBe(401);
      expect((await api.login(me.login)).status).toBe(401);
      expect((await api.refresh(me.cookie)).status).toBe(401);

      const list = await api.request<UsersPageBody>(
        'get',
        `/users?login=${me.login}`,
        { token: other.token },
      );
      expect(list.body.total).toBe(0);
      expect((await api.profile(other.token)).status).toBe(200);

      const row = await app
        .get(DataSource)
        .getRepository(UserEntity)
        .findOneOrFail({ where: { login: me.login }, withDeleted: true });
      expect(row.deletedAt).toBeInstanceOf(Date);
    });

    it('логин и email удаленного можно занять', async () => {
      const { login, token } = await api.signUp();
      await api.request('delete', '/profile/my', { token });
      const again = await api.request<{ access_token: string }>(
        'post',
        '/auth/register',
        { body: registerBody(login) },
      );

      expect(again.status).toBe(201);
      expect((await api.profile(token)).status).toBe(401);
      expect((await api.profile(again.body.access_token)).status).toBe(200);
    });
  });
});
