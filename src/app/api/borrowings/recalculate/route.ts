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

import { NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDateFromSettings } from '@/lib/date-utils';

// POST recalculate return dates of active borrowings using current settings.
// Records with history entries (extensions or manual edits) are skipped so
// intentional changes are never overwritten. Every applied change is audited.
export async function POST() {
  try {
    const settings = {
      borrow_limit_pelajaran: parseInt(dbOperations.getSetting('borrow_limit_pelajaran') || '3', 10),
      borrow_limit_bacaan: parseInt(dbOperations.getSetting('borrow_limit_bacaan') || '7', 10),
      borrow_limit_guru: parseInt(dbOperations.getSetting('borrow_limit_guru') || '30', 10),
    };

    const active = dbOperations
      .getAllBorrowings()
      .filter((b) => b.status === 'Dipinjam' || b.status === 'Terlambat');
    const modifiedIds = new Set(dbOperations.getBorrowingIdsWithHistory());

    let updated = 0;
    let skippedModified = 0;
    let unchanged = 0;

    for (const borrowing of active) {
      if (borrowing.id === undefined) continue;

      if (modifiedIds.has(borrowing.id)) {
        skippedModified += 1;
        continue;
      }

      const recalculated = calculateReturnDateFromSettings(
        borrowing.tanggal_pinjam,
        borrowing.jenis_buku,
        borrowing.kelas,
        settings
      );

      if (recalculated === borrowing.tanggal_kembali) {
        unchanged += 1;
        continue;
      }

      dbOperations.logReturnDateChange(
        borrowing.id,
        borrowing.tanggal_kembali,
        recalculated,
        'Dihitung ulang massal dari pengaturan terbaru'
      );
      dbOperations.updateBorrowing(borrowing.id, { tanggal_kembali: recalculated });
      updated += 1;
    }

    dbOperations.syncAllBorrowingStatuses();

    return NextResponse.json({ updated, skippedModified, unchanged, totalActive: active.length });
  } catch (error) {
    console.error('Error recalculating return dates:', error);
    return NextResponse.json({ error: 'Failed to recalculate return dates' }, { status: 500 });
  }
}
