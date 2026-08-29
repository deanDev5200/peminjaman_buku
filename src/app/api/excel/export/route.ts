import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbOperations } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const borrowings = dbOperations.getAllBorrowings();

    // Prepare data for Excel
    const excelData = borrowings.map(b => ({
      'Nama': b.nama,
      'NIS': b.nis,
      'Kelas': b.kelas,
      'Nama Buku': b.nama_buku,
      'Jenis Buku': b.jenis_buku,
      'Kode Buku': b.kode_buku,
      'Jumlah': b.jumlah,
      'Tanggal Pinjam': b.tanggal_pinjam,
      'Tanggal Kembali': b.tanggal_kembali,
      'Status': b.status
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Nama
      { wch: 10 }, // NIS
      { wch: 10 }, // Kelas
      { wch: 25 }, // Nama Buku
      { wch: 12 }, // Jenis Buku
      { wch: 12 }, // Kode Buku
      { wch: 8 },  // Jumlah
      { wch: 15 }, // Tanggal Pinjam
      { wch: 15 }, // Tanggal Kembali
      { wch: 12 }  // Status
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peminjaman');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="peminjaman-buku-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json({ error: 'Failed to export Excel file' }, { status: 500 });
  }
}
