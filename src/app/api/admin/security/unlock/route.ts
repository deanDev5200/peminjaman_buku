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
import { requireAuth } from '@/lib/auth';
import {
  hasDeveloperAccess,
  isDeveloperAccessConfigured,
  setDeveloperCookie,
  verifyDeveloperAccessKey,
} from '@/lib/developer-auth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  return NextResponse.json({
    configured: isDeveloperAccessConfigured(),
    unlocked: await hasDeveloperAccess(request),
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  if (!isDeveloperAccessConfigured()) {
    return NextResponse.json(
      { error: 'Developer access belum dikonfigurasi di server.' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { accessKey?: string };
  const accessKey = body.accessKey?.trim() ?? '';

  if (!verifyDeveloperAccessKey(accessKey)) {
    return NextResponse.json({ error: 'Developer access key salah.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, message: 'Developer access granted' });
  return setDeveloperCookie(response, request);
}
