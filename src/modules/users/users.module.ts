import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '../security/security.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UserEntity } from './entities/user.entity.js';
import { ProfileController } from './profile.controller.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SecurityModule,
    SessionsModule,
  ],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
