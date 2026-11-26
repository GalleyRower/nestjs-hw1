import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import type { TestProject } from 'vitest/node';
import { buildTypeOrmOptions } from '../src/database/typeorm.options.js';

export interface TestDatabase {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    database: TestDatabase;
  }
}

export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const database: TestDatabase = {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  };

  const dataSource = new DataSource(
    buildTypeOrmOptions({
      ...database,
      poolSize: 1,
      connectTimeoutMs: 5000,
      statementTimeoutMs: 0,
    }),
  );
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  project.provide('database', database);

  return async () => {
    await container.stop();
  };
}
