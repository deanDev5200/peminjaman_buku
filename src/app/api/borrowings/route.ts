import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate } from '@/lib/date-utils';
import { validateBorrowing } from '@/lib/validation';

// GET all borrowings
export async function GET(request: NextRequest) {
  try {
    dbOperations.syncAllBorrowingStatuses();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let borrowings;
    if (search) {
      borrowings = dbOperations.searchBorrowings(search);
      if (status === 'active') {
        borrowings = borrowings.filter((borrowing) => borrowing.status === 'Dipinjam' || borrowing.status === 'Terlambat');
      } else if (status) {
        borrowings = borrowings.filter((borrowing) => borrowing.status === status);
      }
    } else if (status === 'active') {
      borrowings = dbOperations.getAllBorrowings().filter((borrowing) => borrowing.status === 'Dipinjam' || borrowing.status === 'Terlambat');
    } else if (status) {
      borrowings = dbOperations.getAllBorrowings().filter((borrowing) => borrowing.status === status);
    } else {
      borrowings = dbOperations.getAllBorrowings();
    }

    return NextResponse.json(borrowings);
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowings' }, { status: 500 });
  }
}

// POST create new borrowing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate all fields using comprehensive validation
    const validation = validateBorrowing(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Calculate return date if not provided
    const tanggal_kembali = validation.data.tanggal_kembali || 
      calculateReturnDate(validation.data.tanggal_pinjam, validation.data.jenis_buku);

    const borrowing = {
      nama: validation.data.nama,
      nis: validation.data.nis,
      kelas: validation.data.kelas,
      nama_buku: validation.data.nama_buku,
      jenis_buku: validation.data.jenis_buku,
      kode_buku: validation.data.kode_buku,
      jumlah: validation.data.jumlah,
      tanggal_pinjam: validation.data.tanggal_pinjam,
      tanggal_kembali,
      status: validation.data.status || 'Dipinjam'
    };

    const result = dbOperations.createBorrowing(borrowing);
    dbOperations.syncAllBorrowingStatuses();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating borrowing:', error);
    return NextResponse.json({ error: 'Failed to create borrowing' }, { status: 500 });
  }
}
