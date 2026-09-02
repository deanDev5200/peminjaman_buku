import { Borrowing } from './db';
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
