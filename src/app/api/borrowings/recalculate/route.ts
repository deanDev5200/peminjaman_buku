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
