import { databaseConfig } from './database.config.js';

const ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'hw1',
  DB_PASSWORD: 'password',
  DB_NAME: 'hw1',
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
    expect(databaseConfig()).toMatchObject({ port: 5432 });
  });

  it.each([
    ['DB_PASSWORD', '', databaseConfig],
    ['DB_PORT', '', databaseConfig],
  ])('падает на %s=%s', (name, value, config) => {
    vi.stubEnv(name, value);

    expect(() => config()).toThrow('Ошибка в переменных окружения');
  });
});
