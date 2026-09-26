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
