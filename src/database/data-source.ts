import '../config/load-env-file.js';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config.js';
import { buildTypeOrmOptions } from './typeorm.options.js';

// миграция может идти дольше обычного запроса, лимит ей не нужен
export default new DataSource(
  buildTypeOrmOptions({ ...databaseConfig(), statementTimeoutMs: 0 }),
);
