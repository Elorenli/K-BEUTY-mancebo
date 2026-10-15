import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SCRYPT_COST = 16384;
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, saltValue, keyValue] = storedHash.split("$");
  if (algorithm !== "scrypt" || cost !== String(SCRYPT_COST) || !saltValue || !keyValue) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(saltValue, "base64url");
    expected = Buffer.from(keyValue, "base64url");
  } catch {
    return false;
  }
  if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;

  const actual = await scrypt(password, salt, expected.length, {
    N: SCRYPT_COST,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}
