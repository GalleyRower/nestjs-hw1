import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HashService } from '../security/hash.service.js';
import { TokenService } from '../security/token.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';

const USER_ID = '7f0c2f0e-5f5a-4d0c-8a53-0d7c3c0f9a11';
const CREDENTIALS = { id: USER_ID, passwordHash: 'hash' };
const MANAGER = { name: 'transaction manager' };
const PAIR = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshExpiresAt: new Date(),
};

describe('AuthService', () => {
  const users = {
    create: vi.fn(),
    findCredentialsByLogin: vi.fn(),
    existsById: vi.fn(),
  };
  const sessions = { open: vi.fn(), consume: vi.fn(), close: vi.fn() };
  const tokens = { verifyRefresh: vi.fn() };
  const hashes = { hashPassword: vi.fn(), verifyPassword: vi.fn() };
  const dataSource = {
    transaction: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
      work(MANAGER),
    ),
  };
  let service: AuthService;

  beforeEach(async () => {
    vi.resetAllMocks();
    dataSource.transaction.mockImplementation((work) => work(MANAGER));
    sessions.open.mockResolvedValue(PAIR);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: users },
        { provide: SessionsService, useValue: sessions },
        { provide: TokenService, useValue: tokens },
        { provide: HashService, useValue: hashes },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('register сохраняет хэш и открывает сессию в той же транзакции', async () => {
    hashes.hashPassword.mockResolvedValue('hash');
    users.create.mockResolvedValue({ id: USER_ID });

    const result = await service.register({
      login: 'ivan',
      email: 'ivan@example.com',
      password: 'password-1',
      age: 20,
    });

    expect(result).toBe(PAIR);
    expect(users.create).toHaveBeenCalledWith(
      {
        login: 'ivan',
        email: 'ivan@example.com',
        passwordHash: 'hash',
        age: 20,
        description: null,
      },
      MANAGER,
    );
    expect(sessions.open).toHaveBeenCalledWith(USER_ID, MANAGER);
  });

  it('login возвращает пару при верном пароле', async () => {
    users.findCredentialsByLogin.mockResolvedValue(CREDENTIALS);
    hashes.verifyPassword.mockResolvedValue(true);

    expect(await service.login({ login: 'ivan', password: 'p' })).toBe(PAIR);
    expect(sessions.open).toHaveBeenCalledWith(USER_ID);
  });

  it.each([
    ['нет пользователя', null, false],
    ['неверный пароль', CREDENTIALS, false],
  ])('login 401: %s', async (_name, found, isValid) => {
    users.findCredentialsByLogin.mockResolvedValue(found);
    hashes.verifyPassword.mockResolvedValue(isValid);

    await expect(
      service.login({ login: 'ivan', password: 'p' }),
    ).rejects.toThrow('Неверный логин или пароль');
    expect(sessions.open).not.toHaveBeenCalled();
  });

  it('refresh меняет старую сессию на новую в одной транзакции', async () => {
    tokens.verifyRefresh.mockResolvedValue({ sub: USER_ID });
    users.existsById.mockResolvedValue(true);
    sessions.consume.mockResolvedValue(true);

    expect(await service.refresh('old')).toBe(PAIR);
    expect(sessions.consume).toHaveBeenCalledWith(USER_ID, 'old', MANAGER);
    expect(sessions.open).toHaveBeenCalledWith(USER_ID, MANAGER);
  });

  it.each([
    ['пользователь удален', false, true],
    ['refresh уже использован', true, false],
  ])('refresh 401: %s', async (_name, isActive, isConsumed) => {
    tokens.verifyRefresh.mockResolvedValue({ sub: USER_ID });
    users.existsById.mockResolvedValue(isActive);
    sessions.consume.mockResolvedValue(isConsumed);

    await expect(service.refresh('old')).rejects.toThrow(
      'Сессия истекла, войди заново',
    );
    expect(sessions.open).not.toHaveBeenCalled();
  });

  it('refresh 401 без токена', async () => {
    await expect(service.refresh(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(tokens.verifyRefresh).not.toHaveBeenCalled();
  });

  it('logout без токена ничего не делает', async () => {
    await service.logout(undefined);
    expect(sessions.close).not.toHaveBeenCalled();

    await service.logout('refresh');
    expect(sessions.close).toHaveBeenCalledWith('refresh');
  });
});
