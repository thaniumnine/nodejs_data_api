import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$v1$${salt}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, version, salt, expectedHash] = storedHash.split('$');

  if (algorithm !== 'scrypt' || version !== 'v1' || !salt || !expectedHash) {
    return false;
  }

  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHash, 'base64url');

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
