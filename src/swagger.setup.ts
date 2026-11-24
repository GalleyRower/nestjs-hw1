import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { REFRESH_COOKIE_NAME } from './modules/auth/auth.constants.js';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Profiles API')
    .setDescription(
      'Access передается в заголовке Authorization: Bearer, refresh - в HttpOnly cookie. ' +
        'Любой маршрут может вернуть 500 или 503 в общем формате ошибки',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(
      REFRESH_COOKIE_NAME,
      { type: 'apiKey', in: 'cookie', name: REFRESH_COOKIE_NAME },
      REFRESH_COOKIE_NAME,
    )
    .build();
  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
