import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbOperations } from '@/lib/db';

const COL_WIDTHS = [
  { wch: 20 },
  { wch: 10 },
  { wch: 10 },
  { wch: 25 },
  { wch: 12 },
  { wch: 12 },
  { wch: 8 },
  { wch: 15 },
  { wch: 15 },
  { wch: 12 }
];

function toWorkbookRows(borrowings: typeof dbOperations.getAllBorrowings extends () => infer T ? T : never) {
  return borrowings.map((b) => ({
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
}

function buildWorksheet(data: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = COL_WIDTHS;
  return worksheet;
}

function getAcademicYearOptions() {
  const years: string[] = [];

  for (let startYear = 2025; startYear <= 2045; startYear += 1) {
    years.push(`${startYear}/${startYear + 1}`);
  }

  return years;
}

function getAcademicYearMonths(academicYear: string) {
  const [startYearStr] = academicYear.split('/');
  const startYear = Number(startYearStr);

  if (!Number.isFinite(startYear)) {
    return [];
  }

  const monthNames = [
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
  ];

  return monthNames.map((monthName, index) => {
    const monthIndex = (index + 6) % 12;
    const year = index < 6 ? startYear : startYear + 1;
    return {
      label: `${monthName} ${year}`,
      sheetName: `${monthName} ${year}`.slice(0, 31),
      month: monthIndex + 1,
      year
    };
  });
}

function getBorrowingDateParts(borrowing: Awaited<ReturnType<typeof dbOperations.getAllBorrowings>>[number]) {
  const parts = borrowing.tanggal_pinjam.split('/');
  if (parts.length !== 3) return null;
  return {
    day: Number(parts[0]),
    month: Number(parts[1]),
    year: Number(parts[2])
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type');
    const academicYear = searchParams.get('academicYear') || getAcademicYearOptions().at(-1) || '2025/2026';
    const borrowings = dbOperations.getAllBorrowings();

    if (exportType === 'monthly') {
      const workbook = XLSX.utils.book_new();
      const academicMonths = getAcademicYearMonths(academicYear);

      academicMonths.forEach(({ sheetName, month, year }) => {
        const matchingBorrowings = borrowings.filter((borrowing) => {
          const dateParts = getBorrowingDateParts(borrowing);
          if (!dateParts) return false;
          return dateParts.year === year && dateParts.month === month;
        });

        const monthRows = toWorkbookRows(matchingBorrowings);
        const worksheet = buildWorksheet(monthRows.length > 0 ? monthRows : [{ 'Status': 'Tidak ada data peminjaman' }]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument/spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan-tahun-ajaran-${academicYear}.xlsx"`
        }
      });
    }

    const excelData = toWorkbookRows(borrowings);
    const workbook = XLSX.utils.book_new();
    const worksheet = buildWorksheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peminjaman');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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
