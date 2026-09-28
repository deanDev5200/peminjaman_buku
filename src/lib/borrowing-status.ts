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

import { Borrowing } from './types';
import { isOverdue } from './date-utils';

type BorrowingStatusInput = Pick<
  Borrowing,
  'tanggal_pinjam' | 'tanggal_kembali' | 'jenis_buku' | 'status'
>;

export function resolveBorrowingStatus(
  borrowing: BorrowingStatusInput
): 'Dipinjam' | 'Dikembalikan' | 'Terlambat' | 'Terlambat Dikembalikan' {
  const { tanggal_kembali, status } = borrowing;

  if (status === 'Dikembalikan' || status === 'Terlambat Dikembalikan') {
    return status;
  }

  if (isOverdue(tanggal_kembali, 'Dipinjam')) {
    return 'Terlambat';
  }

  return 'Dipinjam';
}
