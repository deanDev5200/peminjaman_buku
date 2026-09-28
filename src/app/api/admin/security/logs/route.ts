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
import { requireDeveloperAccess } from '@/lib/developer-auth';
import { dbOperations } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  const developerError = await requireDeveloperAccess(request);
  if (developerError) {
    return developerError;
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 200, 1), 500) : 200;

  const logs = dbOperations.getSecurityLogs(limit);

  return NextResponse.json({ logs, total: logs.length });
}
