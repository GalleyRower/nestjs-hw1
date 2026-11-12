import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationException } from './common/errors/validation.exception.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { appConfig } from './config/app.config.js';
import { cookieConfig } from './config/cookie.config.js';
import { databaseConfig } from './config/database.config.js';
import { jwtConfig } from './config/jwt.config.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { USER_UNIQUE_MESSAGES } from './modules/users/users.messages.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, cookieConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: () => new AllExceptionsFilter(USER_UNIQUE_MESSAGES),
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: (errors) => new ValidationException(errors),
        }),
    },
  ],
})
export class AppModule {}
