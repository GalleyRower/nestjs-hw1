import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './swagger.setup.js';

export function setupApp(app: INestApplication): void {
  app.use(cookieParser());
  setupSwagger(app);
  app.enableShutdownHooks();
}
