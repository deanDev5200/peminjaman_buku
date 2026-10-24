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
import { dbOperations } from '@/lib/db';
import { calculateReturnDateFromSettings } from '@/lib/date-utils';
import { validateBorrowing } from '@/lib/validation';

// GET all borrowings
export async function GET(request: NextRequest) {
  try {
    dbOperations.syncAllBorrowingStatuses();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const days = searchParams.get('days');
    const configuredPublicDays = Number.parseInt(dbOperations.getSetting('root_view_days') || '30', 10);
    const daysLimit = status === 'active'
      ? (Number.isInteger(configuredPublicDays) && configuredPublicDays > 0 ? configuredPublicDays : 30)
      : days ? parseInt(days, 10) : undefined;

    let borrowings;
    if (search) {
      borrowings = dbOperations.searchBorrowings(search, daysLimit);
      if (status === 'active') {
        borrowings = borrowings.filter((borrowing) => borrowing.status === 'Dipinjam' || borrowing.status === 'Terlambat');
      } else if (status) {
        borrowings = borrowings.filter((borrowing) => borrowing.status === status);
      }
    } else if (status === 'active') {
      const all = dbOperations.getAllBorrowings(daysLimit);
      borrowings = all.filter((borrowing) => borrowing.status === 'Dipinjam' || borrowing.status === 'Terlambat');
    } else if (status) {
      borrowings = dbOperations.getAllBorrowings(daysLimit).filter((borrowing) => borrowing.status === status);
    } else {
      borrowings = dbOperations.getAllBorrowings(daysLimit);
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
    
    const validation = validateBorrowing(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    const settings = {
      borrow_limit_pelajaran: parseInt(dbOperations.getSetting('borrow_limit_pelajaran') || '3', 10),
      borrow_limit_bacaan: parseInt(dbOperations.getSetting('borrow_limit_bacaan') || '7', 10),
      borrow_limit_guru: parseInt(dbOperations.getSetting('borrow_limit_guru') || '30', 10),
    };

    const tanggal_kembali = validation.data.tanggal_kembali || 
      calculateReturnDateFromSettings(validation.data.tanggal_pinjam, validation.data.jenis_buku, validation.data.kelas, settings);

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
