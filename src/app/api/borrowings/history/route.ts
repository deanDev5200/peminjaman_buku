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
import { dbOperations } from '@/lib/db';

// GET global borrowing-history (audit log), newest first.
export async function GET(request: NextRequest) {
  try {
    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '200', 10);
    const limit = Number.isNaN(limitParam) ? 200 : Math.min(Math.max(limitParam, 1), 500);

    return NextResponse.json(dbOperations.getAllBorrowingHistory(limit));
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowing history' }, { status: 500 });
  }
}
