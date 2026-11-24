import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { HashService } from '../src/modules/security/hash.service.js';
import { RefreshSessionEntity } from '../src/modules/sessions/entities/refresh-session.entity.js';
import { UserEntity } from '../src/modules/users/entities/user.entity.js';
import {
  ApiClient,
  type ErrorBody,
  PASSWORD,
  registerBody,
  uniqueLogin,
} from './utils/api-client.js';
import { createTestApp, REFRESH_SECRET } from './utils/create-test-app.js';

describe('auth', () => {
  let app: INestApplication<App>;
  let api: ApiClient;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    api = new ApiClient(app);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  const register = (body: object) =>
    api.request<ErrorBody>('post', '/auth/register', { body });

  describe('регистрация', () => {
    it('отдает access в теле, refresh в HttpOnly cookie', async () => {
      const response = await api.request<Record<string, unknown>>(
        'post',
        '/auth/register',
        { body: registerBody() },
      );

      expect(response.status).toBe(201);
      expect(Object.keys(response.body)).toEqual(['access_token']);
      expect(response.setCookie).toMatch(/^refresh_token=.+; Path=\/auth;/);
      expect(response.setCookie).toContain('HttpOnly');
      expect(response.setCookie).toContain('SameSite=Strict');
    });

    it('хранит только хэши пароля и refresh', async () => {
      const { login, cookie } = await api.signUp();
      const user = await dataSource.getRepository(UserEntity).findOneOrFail({
        where: { login },
        select: { id: true, passwordHash: true },
      });
      const session = await dataSource
        .getRepository(RefreshSessionEntity)
        .findOneByOrFail({ userId: user.id });

      expect(user.passwordHash).not.toBe(PASSWORD);
      expect(
        await app.get(HashService).verifyPassword(PASSWORD, user.passwordHash),
      ).toBe(true);
      expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(cookie).not.toContain(session.tokenHash);
    });

    it('приводит логин и email к нижнему регистру', async () => {
      const login = uniqueLogin();
      const body = registerBody(login);
      const response = await api.request<{ access_token: string }>(
        'post',
        '/auth/register',
        {
          body: {
            ...body,
            login: ` ${login.toUpperCase()} `,
            email: ` ${body.email.toUpperCase()} `,
          },
        },
      );
      const profile = await api.profile(response.body.access_token);

      expect(profile.body).toMatchObject({ login, email: body.email });
    });

    it.each(['', '   ', null, undefined])(
      'пустое описание %j хранит как null',
      async (description) => {
        const response = await api.request<{ access_token: string }>(
          'post',
          '/auth/register',
          { body: { ...registerBody(), description } },
        );
        const profile = await api.profile(response.body.access_token);

        expect(profile.body.description).toBeNull();
      },
    );

    it('не дает занять логин в другом регистре', async () => {
      const { login } = await api.signUp();
      const response = await register({
        ...registerBody(),
        login: login.toUpperCase(),
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Логин уже занят, выбери другой');
    });

    it('не дает занять email в другом регистре', async () => {
      const { login } = await api.signUp();
      const response = await register({
        ...registerBody(),
        email: `${login}@EXAMPLE.com`,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email уже занят, укажи другой');
    });

    it('при параллельной регистрации пускает одного', async () => {
      const body = registerBody();
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => register(body)),
      );

      expect(
        responses.map(({ status }) => status).toSorted((a, b) => a - b),
      ).toEqual([201, 409, 409, 409, 409]);
    });

    it.each([
      ['короткий логин', { login: 'ab' }, 'login'],
      ['длинный логин', { login: 'a'.repeat(33) }, 'login'],
      ['пробел в логине', { login: 'a b c' }, 'login'],
      ['кривой email', { email: 'not-email' }, 'email'],
      ['короткий пароль', { password: '1234567' }, 'password'],
      ['пароль больше 72 байт', { password: 'я'.repeat(37) }, 'password'],
      ['возраст 0', { age: 0 }, 'age'],
      ['возраст 121', { age: 121 }, 'age'],
      ['дробный возраст', { age: 1.5 }, 'age'],
      ['возраст строкой', { age: '25' }, 'age'],
      ['описание 1001', { description: 'a'.repeat(1001) }, 'description'],
      ['лишнее поле', { role: 'admin' }, 'role'],
    ])('400: %s', async (_name, patch, field) => {
      const response = await register({ ...registerBody(), ...patch });

      expect(response.status).toBe(400);
      expect(response.body.details?.map((detail) => detail.field)).toEqual([
        field,
      ]);
    });

    it.each([
      ['логин 3 символа', () => ({ login: uniqueLogin('').slice(-3) })],
      ['логин 32 символа', () => ({ login: uniqueLogin('a'.repeat(21)) })],
      ['пароль 72 байта', () => ({ password: 'я'.repeat(36) })],
      ['возраст 1', () => ({ age: 1 })],
      ['возраст 120', () => ({ age: 120 })],
      ['описание 1000', () => ({ description: 'a'.repeat(1000) })],
    ])('201: %s', async (_name, patch) => {
      const response = await register({ ...registerBody(), ...patch() });

      expect(response.status).toBe(201);
    });

    it('ошибка всегда в одном формате', async () => {
      const response = await register({});

      expect(Object.keys(response.body).toSorted()).toEqual([
        'details',
        'message',
        'path',
        'statusCode',
        'timestamp',
      ]);
      expect(response.body.path).toBe('/auth/register');
    });

    it('400 на битый JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"login":');

      expect(response.status).toBe(400);
      expect((response.body as ErrorBody).message).toBe(
        'Не удалось прочитать запрос, проверь формат JSON',
      );
    });
  });

  describe('вход', () => {
    it('возвращает новую пару', async () => {
      const user = await api.signUp();
      const response = await api.login(user.login.toUpperCase());

      expect(response.status).toBe(200);
      expect((await api.profile(response.body.access_token)).status).toBe(200);
      expect(response.cookie).not.toBe(user.cookie);
      expect((await api.refresh(user.cookie)).status).toBe(200);
    });

    it('не различает неверный логин и неверный пароль', async () => {
      const { login } = await api.signUp();
      const wrongPassword = await api.login(login, 'password-2');
      const wrongLogin = await api.login(uniqueLogin());
      const { timestamp: _a, ...first } =
        wrongPassword.body as unknown as ErrorBody;
      const { timestamp: _b, ...second } =
        wrongLogin.body as unknown as ErrorBody;

      expect(first).toEqual(second);
      expect(first).toMatchObject({
        statusCode: 401,
        message: 'Неверный логин или пароль',
      });
    });
  });

  describe('refresh', () => {
    it('выдает новую пару, старый refresh больше не работает', async () => {
      const { cookie } = await api.signUp();
      const first = await api.refresh(cookie);
      const reused = await api.refresh(cookie);

      expect(first.status).toBe(200);
      expect(first.cookie).not.toBe(cookie);
      expect((await api.profile(first.body.access_token)).status).toBe(200);
      expect(reused.status).toBe(401);
      expect(reused.body).toMatchObject({
        message: 'Сессия истекла, войди заново',
      });
      expect((await api.refresh(first.cookie)).status).toBe(200);
    });

    it('из параллельных запросов с одним refresh проходит один', async () => {
      const { cookie } = await api.signUp();
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => api.refresh(cookie)),
      );

      expect(
        responses.map(({ status }) => status).toSorted((a, b) => a - b),
      ).toEqual([200, 401, 401, 401, 401]);
    });

    it('access не подходит вместо refresh', async () => {
      const { token } = await api.signUp();

      expect((await api.refresh(`refresh_token=${token}`)).status).toBe(401);
    });

    it.each([
      ['нет cookie', undefined],
      ['мусор', 'refresh_token=abc'],
    ])('401: %s', async (_name, cookie) => {
      expect((await api.refresh(cookie)).status).toBe(401);
    });

    it('не принимает истекший и подписанный чужим секретом', async () => {
      const { token } = await api.signUp();
      const profile = await api.profile(token);
      const jwt = new JwtService();
      const payload = {
        sub: profile.body.id,
        type: 'refresh',
        jti: crypto.randomUUID(),
      };
      const expired = jwt.sign(payload, {
        secret: REFRESH_SECRET,
        expiresIn: -1,
      });
      const foreign = jwt.sign(payload, { secret: 'x'.repeat(32) });
      const unknown = jwt.sign(payload, { secret: REFRESH_SECRET });

      for (const value of [expired, foreign, unknown]) {
        expect((await api.refresh(`refresh_token=${value}`)).status).toBe(401);
      }
    });

    it('не принимает сессию, истекшую в базе', async () => {
      const { cookie } = await api.signUp();
      const tokenHash = app
        .get(HashService)
        .hashToken(cookie.replace('refresh_token=', ''));
      await dataSource
        .getRepository(RefreshSessionEntity)
        .update({ tokenHash }, { expiresAt: new Date(Date.now() - 1000) });

      expect((await api.refresh(cookie)).status).toBe(401);
    });
  });

  describe('выход', () => {
    const logout = (cookie?: string) =>
      api.request('post', '/auth/logout', { cookie });

    it('удаляет refresh и чистит cookie', async () => {
      const { cookie } = await api.signUp();
      const response = await logout(cookie);

      expect(response.status).toBe(204);
      expect(response.setCookie).toContain('refresh_token=;');
      expect((await api.refresh(cookie)).status).toBe(401);
    });

    it('не трогает другие сессии', async () => {
      const { login, cookie } = await api.signUp();
      const other = await api.login(login);
      await logout(cookie);

      expect((await api.refresh(other.cookie)).status).toBe(200);
    });

    it('повторный выход и выход без cookie не ошибка', async () => {
      const { cookie } = await api.signUp();
      await logout(cookie);

      expect((await logout(cookie)).status).toBe(204);
      expect((await logout()).status).toBe(204);
    });
  });
});
