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

import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password-store';
import { getClientIp } from '@/lib/request-metadata';
import { checkLoginLockout, clearLoginAttempts, recordFailedLogin } from '@/lib/login-rate-limit';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const lockout = checkLoginLockout(ip);
    if (lockout.locked) {
      const retryMinutes = Math.max(1, Math.ceil(lockout.retryAfterMs / 60000));
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${retryMinutes} menit.` },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const submittedPassword = body.password ?? '';

    if (!(await verifyPassword(submittedPassword))) {
      recordFailedLogin(ip);
      logSecurityEvent(request, 'login_failed');
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    clearLoginAttempts(ip);
    logSecurityEvent(request, 'login');

    const response = NextResponse.json({ ok: true, message: 'Login berhasil' });
    return await setAuthCookie(response, request);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Password tidak dikonfigurasi' }, { status: 500 });
  }
}
