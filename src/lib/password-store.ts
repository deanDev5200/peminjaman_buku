import { dbOperations } from '@/lib/db';

const PASSWORD_KEY = 'app_password';

const HASH_PREFIX = 'pbkdf2';
const HASH_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_BYTES)));
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array<ArrayBufferLike>, b: Uint8Array<ArrayBufferLike>): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    KEY_BYTES * 8
  );

  return new Uint8Array(bits);
}

function parseHash(stored: string): { iterations: number; salt: Uint8Array<ArrayBuffer>; hash: Uint8Array<ArrayBuffer> } | null {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== HASH_PREFIX) {
    return null;
  }

  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return null;
  }

  try {
    return { iterations, salt: fromHex(parts[2]), hash: fromHex(parts[3]) };
  } catch {
    return null;
  }
}

function readStoredRecord(): string {
  const stored = dbOperations.getSetting(PASSWORD_KEY);
  if (stored) {
    return stored;
  }

  const fallbackPassword = process.env.APP_PASSWORD?.trim();
  if (fallbackPassword) {
    return fallbackPassword;
  }

  throw new Error('APP_PASSWORD is not configured. Set it in .env.local or .env.production.');
}

export async function setStoredPassword(newPassword: string): Promise<void> {
  const trimmed = newPassword.trim();
  if (!trimmed) {
    throw new Error('Password baru tidak boleh kosong');
  }

  const salt = randomSalt();
  const hash = await deriveKey(trimmed, salt, HASH_ITERATIONS);
  dbOperations.setSetting(PASSWORD_KEY, `${HASH_PREFIX}$${HASH_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`);
}

export async function verifyPassword(submitted: string): Promise<boolean> {
  const stored = readStoredRecord();
  const parsed = parseHash(stored);

  if (!parsed) {
    // Legacy plaintext record: compare in constant time, then upgrade to a hash.
    const match = timingSafeEqual(new TextEncoder().encode(submitted), new TextEncoder().encode(stored));
    if (match) {
      await setStoredPassword(submitted);
    }
    return match;
  }

  const derived = await deriveKey(submitted, parsed.salt, parsed.iterations);
  return timingSafeEqual(derived, parsed.hash);
}
