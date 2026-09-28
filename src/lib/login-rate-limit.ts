/*
 * Sistem Peminjaman Buku - book-borrowing management system for school library
 * Copyright (C) 2026 I Dewa Gede Agung Dean Putra Purwita
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

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
