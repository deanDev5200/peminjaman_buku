import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate, getCurrentDate, isOverdue } from '@/lib/date-utils';

// PATCH mark as returned
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

    const returnDate = getCurrentDate();
    const dueDate = calculateReturnDate(existing.tanggal_pinjam, existing.jenis_buku);
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
