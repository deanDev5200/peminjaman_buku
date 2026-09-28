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

import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import { resolveBorrowingStatus } from './borrowing-status';

const daysFromToday = (offset: number): string => format(addDays(new Date(), offset), 'dd/MM/yyyy');

const base = {
  tanggal_pinjam: daysFromToday(-10),
  jenis_buku: 'Pelajaran',
} as const;

describe('resolveBorrowingStatus', () => {
  it('keeps returned records untouched even when the date is past', () => {
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(-5), status: 'Dikembalikan' })
    ).toBe('Dikembalikan');
    expect(
      resolveBorrowingStatus({
        ...base,
        tanggal_kembali: daysFromToday(-5),
        status: 'Terlambat Dikembalikan',
      })
    ).toBe('Terlambat Dikembalikan');
  });

  it('marks active records with past return dates as Terlambat', () => {
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(-1), status: 'Dipinjam' })
    ).toBe('Terlambat');
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(-1), status: 'Terlambat' })
    ).toBe('Terlambat');
  });

  it('keeps active records with future return dates as Dipinjam', () => {
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(5), status: 'Dipinjam' })
    ).toBe('Dipinjam');
  });

  it('recovers Terlambat records whose return date moved back to the future', () => {
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(5), status: 'Terlambat' })
    ).toBe('Dipinjam');
  });

  it('treats a return date of today as not overdue', () => {
    expect(
      resolveBorrowingStatus({ ...base, tanggal_kembali: daysFromToday(0), status: 'Dipinjam' })
    ).toBe('Dipinjam');
  });
});
