import { Borrowing } from './db';
import { calculateReturnDate, isOverdue } from './date-utils';

type BorrowingStatusInput = Pick<
  Borrowing,
  'tanggal_pinjam' | 'tanggal_kembali' | 'jenis_buku' | 'status'
>;

export function resolveBorrowingStatus(
  borrowing: BorrowingStatusInput
): 'Dipinjam' | 'Dikembalikan' | 'Terlambat' {
  const { tanggal_pinjam, tanggal_kembali, jenis_buku, status } = borrowing;

  if (status === 'Dikembalikan') {
    const expectedDueDate = calculateReturnDate(tanggal_pinjam, jenis_buku);

    // Imported or stale records sometimes keep the due date while status is wrong.
    if (tanggal_kembali === expectedDueDate && isOverdue(tanggal_kembali, 'Dipinjam')) {
      return 'Terlambat';
    }

    return 'Dikembalikan';
  }

  if (isOverdue(tanggal_kembali, 'Dipinjam')) {
    return 'Terlambat';
  }

  return 'Dipinjam';
}
