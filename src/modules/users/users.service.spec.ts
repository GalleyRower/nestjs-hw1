import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HashService } from '../security/hash.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

const USER = {
  id: '7f0c2f0e-5f5a-4d0c-8a53-0d7c3c0f9a11',
  login: 'ivan',
  email: 'ivan@example.com',
  passwordHash: 'hash',
  age: 20,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};
const PASSWORDS = { oldPassword: 'password-1', newPassword: 'password-2' };
const MANAGER = { name: 'transaction manager' };

describe('UsersService', () => {
  const users = {
    findById: vi.fn(),
    findCredentialsById: vi.fn(),
    findPage: vi.fn(),
    update: vi.fn(),
    updatePasswordHash: vi.fn(),
    softDelete: vi.fn(),
  };
  const sessions = { closeAll: vi.fn() };
  const hashes = { hashPassword: vi.fn(), verifyPassword: vi.fn() };
  const dataSource = {
    transaction: vi.fn((work: (manager: unknown) => Promise<unknown>) =>
      work(MANAGER),
    ),
  };
  let service: UsersService;

  beforeEach(async () => {
    vi.resetAllMocks();
    dataSource.transaction.mockImplementation((work) => work(MANAGER));
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: users },
        { provide: SessionsService, useValue: sessions },
        { provide: HashService, useValue: hashes },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('профиль не содержит хэш пароля', async () => {
    users.findById.mockResolvedValue(USER);

    const profile = await service.getProfile(USER.id);

    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('deletedAt');
  });

  it('в списке нет email и хэша', async () => {
    users.findPage.mockResolvedValue({ items: [USER], total: 1 });

    const { items } = await service.getPage({ page: 1, limit: 20 });

    expect(items[0]).not.toHaveProperty('email');
    expect(items[0]).not.toHaveProperty('passwordHash');
  });

  it('404, если профиля уже нет', async () => {
    users.findById.mockResolvedValue(null);
    users.findCredentialsById.mockResolvedValue(null);
    users.update.mockResolvedValue(false);
    users.softDelete.mockResolvedValue(false);

    for (const run of [
      () => service.getProfile(USER.id),
      () => service.updateProfile(USER.id, { age: 30 }),
      () => service.changePassword(USER.id, PASSWORDS),
      () => service.deleteProfile(USER.id),
    ]) {
      await expect(run()).rejects.toThrow('Профиль не найден');
    }
    expect(sessions.closeAll).not.toHaveBeenCalled();
  });

  it('смена пароля в одной транзакции с закрытием всех сессий', async () => {
    users.findCredentialsById.mockResolvedValue(USER);
    hashes.verifyPassword.mockResolvedValue(true);
    hashes.hashPassword.mockResolvedValue('new-hash');
    users.updatePasswordHash.mockResolvedValue(true);

    await service.changePassword(USER.id, PASSWORDS);

    expect(users.updatePasswordHash).toHaveBeenCalledWith(
      USER.id,
      'new-hash',
      MANAGER,
    );
    expect(sessions.closeAll).toHaveBeenCalledWith(USER.id, MANAGER);
  });

  it('смена пароля 400, если старый пароль неверный', async () => {
    users.findCredentialsById.mockResolvedValue(USER);
    hashes.verifyPassword.mockResolvedValue(false);

    await expect(service.changePassword(USER.id, PASSWORDS)).rejects.toThrow(
      'Старый пароль указан неверно',
    );
    expect(users.updatePasswordHash).not.toHaveBeenCalled();
    expect(sessions.closeAll).not.toHaveBeenCalled();
  });

  it('удаление в одной транзакции с закрытием всех сессий', async () => {
    users.softDelete.mockResolvedValue(true);

    await service.deleteProfile(USER.id);

    expect(users.softDelete).toHaveBeenCalledWith(USER.id, MANAGER);
    expect(sessions.closeAll).toHaveBeenCalledWith(USER.id, MANAGER);
  });
});
