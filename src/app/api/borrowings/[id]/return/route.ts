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
