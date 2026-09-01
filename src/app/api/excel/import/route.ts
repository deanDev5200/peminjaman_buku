import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { dbOperations } from '@/lib/db';
import { calculateReturnDate } from '@/lib/date-utils';
import { validateImportRow } from '@/lib/validation';

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function toNumberValue(value: unknown): number {
  const parsed = Number(toStringValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    
    if (jsonData.length < 2) {
      return NextResponse.json({ error: 'File is empty or invalid' }, { status: 400 });
    }

    // Extract headers from first row
    const headers = jsonData[0].map((h: unknown) => String(h ?? '').trim());
    const expectedHeaders = [
      'Nama', 'NIS', 'Kelas', 'Nama Buku', 'Jenis Buku', 'Kode Buku',
      'Jumlah', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status'
    ];

    // Validate headers
    const headersMatch = expectedHeaders.every((h, i) => headers[i] === h);
    if (!headersMatch) {
      return NextResponse.json({ 
        error: 'Invalid Excel format. Expected columns: ' + expectedHeaders.join(', ') 
      }, { status: 400 });
    }

    // Process data rows
    let imported = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0) continue;

      try {
        // Validate the row using comprehensive validation
        const validation = validateImportRow(row, i + 1);
        
        if (!validation.valid || !validation.data) {
          errors++;
          errorDetails.push(...validation.errors);
          continue;
        }

        const borrowing = validation.data;

        // Recalculate return date if needed
        if (!borrowing.tanggal_kembali || borrowing.status === 'Dipinjam') {
          borrowing.tanggal_kembali = calculateReturnDate(borrowing.tanggal_pinjam, borrowing.jenis_buku);
        }

        dbOperations.createBorrowing(borrowing);
        imported++;
      } catch (error) {
        console.error('Error importing row:', i, error);
        errors++;
        errorDetails.push(`Baris ${i + 1}: Error processing row`);
      }
    }

    return NextResponse.json({ 
      message: 'Import completed',
      imported,
      errors,
      total: jsonData.length - 1,
      errorDetails: errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined // Show first 10 errors
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    return NextResponse.json({ error: 'Failed to import Excel file' }, { status: 500 });
  }
}
