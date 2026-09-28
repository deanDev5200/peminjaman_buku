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
import { calculateReturnDateFromSettings } from '@/lib/date-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    const body = await request.json();
    const { reason } = body;

    const existing = dbOperations.getBorrowingById(parsedId);
    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    if (existing.status === 'Terlambat') {
      return NextResponse.json(
        { error: 'Buku yang sudah terlambat harus dikembalikan dulu dan tidak bisa diperpanjang' },
        { status: 400 }
      );
    }

    if (existing.status !== 'Dipinjam') {
      return NextResponse.json(
        { error: 'Hanya buku yang sedang dipinjam yang bisa diperpanjang' },
        { status: 400 }
      );
    }

    const rawMaxExtend = parseInt(dbOperations.getSetting('max_extend_count') ?? '1', 10);
    const maxExtendCount = Number.isNaN(rawMaxExtend) ? 1 : Math.max(0, rawMaxExtend);
    const extendCount = existing.extend_count ?? 0;

    if (extendCount >= maxExtendCount) {
      return NextResponse.json(
        { error: `Batas perpanjangan tercapai (maksimal ${maxExtendCount}x)` },
        { status: 400 }
      );
    }

    const settings = {
      borrow_limit_pelajaran: parseInt(dbOperations.getSetting('borrow_limit_pelajaran') || '3', 10),
      borrow_limit_bacaan: parseInt(dbOperations.getSetting('borrow_limit_bacaan') || '7', 10),
      borrow_limit_guru: parseInt(dbOperations.getSetting('borrow_limit_guru') || '30', 10),
    };

    const newReturnDate = calculateReturnDateFromSettings(
      existing.tanggal_kembali,
      existing.jenis_buku,
      existing.kelas,
      settings
    );

    dbOperations.extendBorrowing(parsedId, newReturnDate, reason || '');
    dbOperations.syncAllBorrowingStatuses();

    const updated = dbOperations.getBorrowingById(parsedId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error extending borrowing:', error);
    return NextResponse.json({ error: 'Failed to extend borrowing' }, { status: 500 });
  }
}
