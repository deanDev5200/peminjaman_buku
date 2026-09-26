// In-memory login rate limiter (per IP).
// Note: state lives in the Node process, which fits this app's single-instance
// standalone deployment. It is not shared across processes.

const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 5 * 60 * 1000;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 5000;

type AttemptEntry = {
  failures: number;
  lockedUntil: number;
  lastAttempt: number;
};

const attempts = new Map<string, AttemptEntry>();

function prune(): void {
  if (attempts.size <= MAX_ENTRIES) {
    return;
  }

  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (entry.lockedUntil <= now && now - entry.lastAttempt > FAILURE_WINDOW_MS) {
      attempts.delete(ip);
    }
    if (attempts.size <= MAX_ENTRIES) {
      break;
    }
  }
}

export function checkLoginLockout(ip: string): { locked: boolean; retryAfterMs: number } {
  const entry = attempts.get(ip);
  if (!entry) {
    return { locked: false, retryAfterMs: 0 };
  }

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }

  if (entry.failures >= MAX_ATTEMPTS) {
    // Previous lockout expired: start a fresh window.
    attempts.delete(ip);
  }

  return { locked: false, retryAfterMs: 0 };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip) ?? { failures: 0, lockedUntil: 0, lastAttempt: 0 };

  if (now - entry.lastAttempt > FAILURE_WINDOW_MS) {
    entry.failures = 0;
  }

  entry.failures += 1;
  entry.lastAttempt = now;
  if (entry.failures >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }

  attempts.set(ip, entry);
  prune();
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}
