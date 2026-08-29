import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate } from '@/lib/date-utils';

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

    // Recalculate return date if book type or borrow date changes
    const updateData = { ...body };
    if (body.jenis_buku || body.tanggal_pinjam) {
      const jenis_buku = body.jenis_buku || existing.jenis_buku;
      const tanggal_pinjam = body.tanggal_pinjam || existing.tanggal_pinjam;
      updateData.tanggal_kembali = calculateReturnDate(tanggal_pinjam, jenis_buku);
    }

    // Preserve status and original return date if not explicitly changing
    if (!body.status) {
      updateData.status = existing.status;
    }

    dbOperations.updateBorrowing(parsedId, updateData);
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
    return NextResponse.json({ message: 'Borrowing deleted successfully' });
  } catch (error) {
    console.error('Error deleting borrowing:', error);
    return NextResponse.json({ error: 'Failed to delete borrowing' }, { status: 500 });
  }
}
