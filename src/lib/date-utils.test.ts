import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { addDays, format } from 'date-fns';
import {
  calculateReturnDate,
  calculateReturnDateFromSettings,
  formatDate,
  getCurrentDate,
  isOverdue,
  isValidDateFormat,
} from './date-utils';

const fmt = (date: Date): string => format(date, 'dd/MM/yyyy');
const daysFromToday = (offset: number): string => fmt(addDays(new Date(), offset));

// The utils log expected errors for invalid input; keep test output clean.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateReturnDate', () => {
  it('adds 3 days for Pelajaran books', () => {
    expect(calculateReturnDate('01/09/2026', 'Pelajaran')).toBe('04/09/2026');
  });

  it('matches book type case-insensitively', () => {
    expect(calculateReturnDate('01/09/2026', 'pelajaran')).toBe('04/09/2026');
    expect(calculateReturnDate('01/09/2026', 'BACAAN')).toBe('08/09/2026');
  });

  it('adds 7 days for Bacaan books', () => {
    expect(calculateReturnDate('01/09/2026', 'Bacaan')).toBe('08/09/2026');
  });

  it('falls back to 7 days for unknown book types', () => {
    expect(calculateReturnDate('01/09/2026', 'Referensi')).toBe('08/09/2026');
  });

  it('adds 30 days for GURU/PEGAWAI regardless of book type', () => {
    expect(calculateReturnDate('01/09/2026', 'Pelajaran', 'GURU/PEGAWAI')).toBe('01/10/2026');
    expect(calculateReturnDate('01/09/2026', 'Bacaan', 'GURU/PEGAWAI')).toBe('01/10/2026');
  });

  it('rolls over month boundaries', () => {
    expect(calculateReturnDate('30/01/2026', 'Pelajaran')).toBe('02/02/2026');
  });

  it('rolls over year boundaries', () => {
    expect(calculateReturnDate('30/12/2026', 'Bacaan')).toBe('06/01/2027');
  });

  it('handles leap years', () => {
    expect(calculateReturnDate('27/02/2024', 'Pelajaran')).toBe('01/03/2024');
  });

  it('returns the input when the date is invalid', () => {
    expect(calculateReturnDate('not-a-date', 'Pelajaran')).toBe('not-a-date');
  });
});

describe('calculateReturnDateFromSettings', () => {
  const settings = { borrow_limit_pelajaran: 5, borrow_limit_bacaan: 10, borrow_limit_guru: 60 };

  it('uses the configured Pelajaran limit', () => {
    expect(calculateReturnDateFromSettings('01/09/2026', 'Pelajaran', 'X TKJ 1', settings)).toBe('06/09/2026');
  });

  it('uses the configured Bacaan limit', () => {
    expect(calculateReturnDateFromSettings('01/09/2026', 'Bacaan', 'X TKJ 1', settings)).toBe('11/09/2026');
  });

  it('uses the guru limit for GURU/PEGAWAI regardless of book type', () => {
    expect(calculateReturnDateFromSettings('01/09/2026', 'Pelajaran', 'GURU/PEGAWAI', settings)).toBe(
      '31/10/2026'
    );
  });

  it('falls back to defaults when a limit is zero', () => {
    const zeros = { borrow_limit_pelajaran: 0, borrow_limit_bacaan: 0, borrow_limit_guru: 0 };
    expect(calculateReturnDateFromSettings('01/09/2026', 'Pelajaran', 'X TKJ 1', zeros)).toBe('04/09/2026');
    expect(calculateReturnDateFromSettings('01/09/2026', 'Bacaan', 'X TKJ 1', zeros)).toBe('08/09/2026');
  });

  it('returns the input when the date is invalid', () => {
    expect(calculateReturnDateFromSettings('not-a-date', 'Pelajaran', 'X TKJ 1', settings)).toBe(
      'not-a-date'
    );
  });
});

describe('isOverdue', () => {
  it('is overdue when the return date is in the past', () => {
    expect(isOverdue(daysFromToday(-1), 'Dipinjam')).toBe(true);
    expect(isOverdue(daysFromToday(-30), 'Dipinjam')).toBe(true);
  });

  it('is not overdue when the return date is today or in the future', () => {
    expect(isOverdue(daysFromToday(0), 'Dipinjam')).toBe(false);
    expect(isOverdue(daysFromToday(5), 'Dipinjam')).toBe(false);
  });

  it('stays overdue for Terlambat records in the past', () => {
    expect(isOverdue(daysFromToday(-1), 'Terlambat')).toBe(true);
  });

  it('is never overdue once returned', () => {
    expect(isOverdue(daysFromToday(-10), 'Dikembalikan')).toBe(false);
    expect(isOverdue(daysFromToday(-10), 'Terlambat Dikembalikan')).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isOverdue('not-a-date', 'Dipinjam')).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats DD/MM/YYYY into a long date', () => {
    expect(formatDate('25/09/2026')).toBe('25 September 2026');
  });

  it('returns the input when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('getCurrentDate', () => {
  it('returns today in DD/MM/YYYY format', () => {
    expect(getCurrentDate()).toBe(fmt(new Date()));
  });
});

describe('isValidDateFormat', () => {
  it('accepts DD/MM/YYYY dates', () => {
    expect(isValidDateFormat('25/09/2026')).toBe(true);
  });

  it('rejects other formats and garbage', () => {
    expect(isValidDateFormat('2026-09-25')).toBe(false);
    expect(isValidDateFormat('not-a-date')).toBe(false);
    expect(isValidDateFormat('')).toBe(false);
  });
});
