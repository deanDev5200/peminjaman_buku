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

import { addDays, parse, format, isValid, startOfDay } from 'date-fns';

// Calculate return date based on book type
export const calculateReturnDate = (borrowDate: string, bookType: string, kelas?: string): string => {
  try {
    const date = parse(borrowDate, 'dd/MM/yyyy', new Date());
    
    if (!isValid(date)) {
      throw new Error('Invalid date format');
    }

    let daysToAdd: number;

    if (kelas === 'GURU/PEGAWAI') {
      daysToAdd = 30;
    } else {
      const bookTypeLower = bookType.toLowerCase();
      
      if (bookTypeLower === 'pelajaran') {
        daysToAdd = 3;
      } else if (bookTypeLower === 'bacaan') {
        daysToAdd = 7;
      } else {
        daysToAdd = 7;
      }
    }

    const returnDate = addDays(date, daysToAdd);
    return format(returnDate, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error calculating return date:', error);
    return borrowDate;
  }
};

// Server-side function that uses database settings
export const calculateReturnDateFromSettings = (
  borrowDate: string, 
  bookType: string, 
  kelas: string,
  settings: { borrow_limit_pelajaran: number; borrow_limit_bacaan: number; borrow_limit_guru: number }
): string => {
  try {
    const date = parse(borrowDate, 'dd/MM/yyyy', new Date());
    
    if (!isValid(date)) {
      throw new Error('Invalid date format');
    }

    let daysToAdd: number;

    if (kelas === 'GURU/PEGAWAI') {
      daysToAdd = settings.borrow_limit_guru || 30;
    } else {
      const bookTypeLower = bookType.toLowerCase();
      if (bookTypeLower === 'pelajaran') {
        daysToAdd = settings.borrow_limit_pelajaran || 3;
      } else if (bookTypeLower === 'bacaan') {
        daysToAdd = settings.borrow_limit_bacaan || 7;
      } else {
        daysToAdd = settings.borrow_limit_bacaan || 7;
      }
    }

    const returnDate = addDays(date, daysToAdd);
    return format(returnDate, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error calculating return date from settings:', error);
    return borrowDate;
  }
};

// Check if a borrowing is overdue
export const isOverdue = (returnDate: string, status: string): boolean => {
  if (status !== 'Dipinjam' && status !== 'Terlambat') return false;
  
  try {
    const returnD = parse(returnDate, 'dd/MM/yyyy', new Date());
    const today = startOfDay(new Date());
    
    if (!isValid(returnD)) return false;
    
    return startOfDay(returnD) < today;
  } catch (error) {
    console.error('Error checking overdue status:', error);
    return false;
  }
};

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    const date = parse(dateString, 'dd/MM/yyyy', new Date());
    if (!isValid(date)) return dateString;
    return format(date, 'dd MMMM yyyy');
  } catch {
    return dateString;
  }
};

// Get current date in DD/MM/YYYY format
export const getCurrentDate = (): string => {
  return format(new Date(), 'dd/MM/yyyy');
};

// Validate date format
export const isValidDateFormat = (dateString: string): boolean => {
  try {
    const date = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(date);
  } catch {
    return false;
  }
};

export const isDateWithinRange = (
  dateString: string,
  startDate: string,
  endDate: string
): boolean => {
  const date = parse(dateString, 'dd/MM/yyyy', new Date());
  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const end = parse(endDate, 'yyyy-MM-dd', new Date());

  if (!isValid(date) || !isValid(start) || !isValid(end)) {
    return false;
  }

  const value = startOfDay(date).getTime();
  return value >= startOfDay(start).getTime() && value <= startOfDay(end).getTime();
};
