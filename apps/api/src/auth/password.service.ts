import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  hashPassword(rawPassword: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(rawPassword, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    });
    return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString('hex')}`;
  }

  verifyPassword(rawPassword: string, storedHash: string): boolean {
    const [algorithm, n, r, p, salt, hashedValue] = storedHash.split('$');

    if (!algorithm || !n || !r || !p || !salt || !hashedValue) {
      return false;
    }

    if (algorithm !== 'scrypt') {
      return false;
    }

    const expectedBuffer = Buffer.from(hashedValue, 'hex');
    const actualBuffer = scryptSync(rawPassword, salt, KEY_LENGTH, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
