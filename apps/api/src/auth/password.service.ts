import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** RM-SEC-002/003 : mots de passe hachés (Argon2id), jamais accessibles en clair. */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
