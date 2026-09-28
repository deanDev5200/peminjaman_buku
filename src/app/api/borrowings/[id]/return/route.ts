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
import { calculateReturnDateFromSettings, getCurrentDate, isOverdue } from '@/lib/date-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existing = dbOperations.getBorrowingById(parseInt(id));
    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const settings = {
      borrow_limit_pelajaran: parseInt(dbOperations.getSetting('borrow_limit_pelajaran') || '3', 10),
      borrow_limit_bacaan: parseInt(dbOperations.getSetting('borrow_limit_bacaan') || '7', 10),
      borrow_limit_guru: parseInt(dbOperations.getSetting('borrow_limit_guru') || '60', 10),
    };

    const returnDate = getCurrentDate();
    const dueDate = calculateReturnDateFromSettings(existing.tanggal_pinjam, existing.jenis_buku, existing.kelas, settings);
    const returnStatus = isOverdue(dueDate, 'Dipinjam')
      ? 'Terlambat Dikembalikan'
      : 'Dikembalikan';
    dbOperations.markAsReturned(parseInt(id), returnDate, returnStatus);
    dbOperations.syncAllBorrowingStatuses();
    
    const updated = dbOperations.getBorrowingById(parseInt(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error marking as returned:', error);
    return NextResponse.json({ error: 'Failed to mark as returned' }, { status: 500 });
  }
}
