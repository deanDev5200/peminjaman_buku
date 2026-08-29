import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate } from '@/lib/date-utils';

// GET all borrowings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    let borrowings;
    if (search) {
      borrowings = dbOperations.searchBorrowings(search);
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
    
    // Validate required fields
    const requiredFields = ['nama', 'nis', 'kelas', 'nama_buku', 'jenis_buku', 'kode_buku', 'jumlah', 'tanggal_pinjam'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate numeric fields
    if (isNaN(parseInt(body.nis)) || isNaN(parseInt(body.jumlah))) {
      return NextResponse.json({ error: 'NIS and Jumlah must be numbers' }, { status: 400 });
    }

    // Calculate return date
    const tanggal_kembali = calculateReturnDate(body.tanggal_pinjam, body.jenis_buku);

    const borrowing = {
      nama: body.nama,
      nis: parseInt(body.nis),
      kelas: body.kelas,
      nama_buku: body.nama_buku,
      jenis_buku: body.jenis_buku,
      kode_buku: body.kode_buku,
      jumlah: parseInt(body.jumlah),
      tanggal_pinjam: body.tanggal_pinjam,
      tanggal_kembali: tanggal_kembali,
      status: 'Dipinjam'
    };

    const result = dbOperations.createBorrowing(borrowing);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating borrowing:', error);
    return NextResponse.json({ error: 'Failed to create borrowing' }, { status: 500 });
  }
}
