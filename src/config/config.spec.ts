import { cookieConfig } from './cookie.config.js';
import { databaseConfig } from './database.config.js';
import { jwtConfig } from './jwt.config.js';

const ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'hw1',
  DB_PASSWORD: 'password',
  DB_NAME: 'hw1',
  DB_POOL_SIZE: '10',
  DB_CONNECT_TIMEOUT_MS: '5000',
  DB_STATEMENT_TIMEOUT_MS: '5000',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_TTL_SECONDS: '900',
  JWT_REFRESH_TTL_SECONDS: '2592000',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'strict',
};

describe('config', () => {
  beforeEach(() => {
    for (const [name, value] of Object.entries(ENV)) {
      vi.stubEnv(name, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('разбирает корректные значения', () => {
    expect(databaseConfig()).toMatchObject({
      port: 5432,
      statementTimeoutMs: 5000,
    });
    expect(jwtConfig()).toMatchObject({ accessTtlSeconds: 900 });
    expect(cookieConfig()).toEqual({ secure: false, sameSite: 'strict' });
  });

  it.each([
    ['DB_PASSWORD', '', databaseConfig],
    ['DB_PORT', '', databaseConfig],
    ['DB_STATEMENT_TIMEOUT_MS', '0', databaseConfig],
    ['JWT_ACCESS_SECRET', 'short', jwtConfig],
    ['JWT_REFRESH_SECRET', ENV.JWT_ACCESS_SECRET, jwtConfig],
    ['JWT_ACCESS_TTL_SECONDS', '15m', jwtConfig],
    ['JWT_REFRESH_TTL_SECONDS', '900', jwtConfig],
    ['COOKIE_SECURE', 'maybe', cookieConfig],
    ['COOKIE_SAME_SITE', 'none', cookieConfig],
  ])('падает на %s=%s', (name, value, config) => {
    vi.stubEnv(name, value);

    expect(() => config()).toThrow('Ошибка в переменных окружения');
  });
});
