import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate } from '@/lib/date-utils';
import { validateBorrowing } from '@/lib/validation';

// PUT update borrowing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    const body = await request.json();

    // Validate numeric fields if provided
    if (body.nis !== undefined && isNaN(parseInt(body.nis))) {
      return NextResponse.json({ error: 'NIS must be a number' }, { status: 400 });
    }
    if (body.jumlah !== undefined && isNaN(parseInt(body.jumlah))) {
      return NextResponse.json({ error: 'Jumlah must be a number' }, { status: 400 });
    }

    // Get existing borrowing to preserve return date if book type changes
    const existing = dbOperations.getBorrowingById(parsedId);
    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    // Merge existing data with updates for validation
    const mergedData = { ...existing, ...body };

    // Validate the merged data
    const validation = validateBorrowing(mergedData);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Use validated data for update
    const updateData: Record<string, unknown> = validation.data ? { ...validation.data } : {};

    // Active records derive their due date from the borrow date and book type.
    const isActiveBorrowing = existing.status === 'Dipinjam' || existing.status === 'Terlambat';
    const bookTypeChanged = body.jenis_buku !== undefined && body.jenis_buku !== existing.jenis_buku;
    const borrowDateChanged = body.tanggal_pinjam !== undefined && body.tanggal_pinjam !== existing.tanggal_pinjam;

    if (isActiveBorrowing && (bookTypeChanged || borrowDateChanged)) {
      const jenis_buku = String(updateData.jenis_buku || existing.jenis_buku);
      const tanggal_pinjam = String(updateData.tanggal_pinjam || existing.tanggal_pinjam);
      updateData.tanggal_kembali = calculateReturnDate(tanggal_pinjam, jenis_buku);
    }

    dbOperations.updateBorrowing(parsedId, updateData);
    dbOperations.syncAllBorrowingStatuses();
    const updated = dbOperations.getBorrowingById(parsedId);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating borrowing:', error);
    return NextResponse.json({ error: 'Failed to update borrowing' }, { status: 500 });
  }
}

// DELETE borrowing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    
    const existing = dbOperations.getBorrowingById(parsedId);
    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    dbOperations.deleteBorrowing(parsedId);
    dbOperations.syncAllBorrowingStatuses();
    return NextResponse.json({ message: 'Borrowing deleted successfully' });
  } catch (error) {
    console.error('Error deleting borrowing:', error);
    return NextResponse.json({ error: 'Failed to delete borrowing' }, { status: 500 });
  }
}
