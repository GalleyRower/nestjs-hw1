import type { ConfigType } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import type { databaseConfig } from '../config/database.config.js';
import { RefreshSessionEntity } from '../modules/sessions/entities/refresh-session.entity.js';
import { UserEntity } from '../modules/users/entities/user.entity.js';
import { CreateUsersAndSessions1794509767318 } from './migrations/1794509767318-create-users-and-sessions.js';

export function buildTypeOrmOptions(
  config: ConfigType<typeof databaseConfig>,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    poolSize: config.poolSize,
    connectTimeoutMS: config.connectTimeoutMs,
    extra: { statement_timeout: config.statementTimeoutMs },
    entities: [UserEntity, RefreshSessionEntity],
    migrations: [CreateUsersAndSessions1794509767318],
    synchronize: false,
    migrationsRun: false,
    uuidExtension: 'pgcrypto',
    installExtensions: false,
  };
}
