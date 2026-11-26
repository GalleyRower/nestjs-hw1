import { Module } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config.js';
import { buildTypeOrmOptions } from './typeorm.options.js';

const CONNECT_RETRY_ATTEMPTS = 3;
const CONNECT_RETRY_DELAY_MS = 1000;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: ConfigType<typeof databaseConfig>) => ({
        ...buildTypeOrmOptions(config),
        retryAttempts: CONNECT_RETRY_ATTEMPTS,
        retryDelay: CONNECT_RETRY_DELAY_MS,
      }),
    }),
  ],
})
export class DatabaseModule {}
