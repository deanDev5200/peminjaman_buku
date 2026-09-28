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
  { wch: 12 },
  { wch: 13 }
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
    'Status': b.status,
    'Perpanjangan': b.extend_count ?? 0
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
