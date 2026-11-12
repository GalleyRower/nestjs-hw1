import { JwtService } from '@nestjs/jwt';
import { HashService } from './hash.service.js';
import { TokenService } from './token.service.js';

const CONFIG = {
  accessSecret: 'access-secret-access-secret-access-secret',
  refreshSecret: 'refresh-secret-refresh-secret-refresh-secret',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 2_592_000,
};
const USER_ID = '7f0c2f0e-5f5a-4d0c-8a53-0d7c3c0f9a11';

describe('TokenService', () => {
  const tokens = new TokenService(new JwtService(), CONFIG);

  it('две пары из одной секунды отличаются', async () => {
    const pairs = await Promise.all([
      tokens.issuePair(USER_ID),
      tokens.issuePair(USER_ID),
    ]);

    expect(pairs[0].refreshToken).not.toBe(pairs[1].refreshToken);
  });

  it('refresh проходит проверку, access - нет', async () => {
    const pair = await tokens.issuePair(USER_ID);

    expect((await tokens.verifyRefresh(pair.refreshToken)).sub).toBe(USER_ID);
    await expect(tokens.verifyRefresh(pair.accessToken)).rejects.toThrow(
      'Сессия истекла, войди заново',
    );
  });

  it('access с секретом refresh не подходит из-за type', async () => {
    const token = new JwtService().sign(
      { sub: USER_ID, type: 'access', jti: crypto.randomUUID() },
      { secret: CONFIG.refreshSecret },
    );

    await expect(tokens.verifyRefresh(token)).rejects.toThrow(
      'Сессия истекла, войди заново',
    );
  });
});

describe('HashService', () => {
  const hashes = new HashService();

  it('пароль проверяется по хэшу', async () => {
    const hash = await hashes.hashPassword('password-1');

    expect(hash).toHaveLength(60);
    expect(await hashes.verifyPassword('password-1', hash)).toBe(true);
    expect(await hashes.verifyPassword('password-2', hash)).toBe(false);
  });

  it('хэши токенов с общим началом отличаются', () => {
    const start = 'a'.repeat(100);

    expect(hashes.hashToken(`${start}1`)).not.toBe(
      hashes.hashToken(`${start}2`),
    );
  });
});
