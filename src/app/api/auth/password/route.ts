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
import { clearAuthCookie } from '@/lib/auth';
import { setStoredPassword, verifyPassword } from '@/lib/password-store';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    if (!(await verifyPassword(currentPassword))) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 401 });
    }

    await setStoredPassword(newPassword);

    const response = NextResponse.json({ ok: true, message: 'Password berhasil diubah' });
    return clearAuthCookie(response, request);
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
