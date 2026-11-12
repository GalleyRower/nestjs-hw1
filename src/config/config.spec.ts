import { databaseConfig } from './database.config.js';

const ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'hw1',
  DB_PASSWORD: 'password',
  DB_NAME: 'hw1',
  DB_POOL_SIZE: '10',
  DB_CONNECT_TIMEOUT_MS: '5000',
  DB_STATEMENT_TIMEOUT_MS: '5000',
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
  });

  it.each([
    ['DB_PASSWORD', '', databaseConfig],
    ['DB_PORT', '', databaseConfig],
    ['DB_STATEMENT_TIMEOUT_MS', '0', databaseConfig],
  ])('падает на %s=%s', (name, value, config) => {
    vi.stubEnv(name, value);

    expect(() => config()).toThrow('Ошибка в переменных окружения');
  });
});
