import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS, TOKEN_HASH_ALGORITHM } from './security.constants.js';

@Injectable()
export class HashService {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // bcrypt видит только 72 байта, у разных JWT одного юзера они совпадают
  hashToken(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token).digest('hex');
  }
}
