import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HashService } from './hash.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [HashService, TokenService],
  exports: [HashService, TokenService],
})
export class SecurityModule {}
