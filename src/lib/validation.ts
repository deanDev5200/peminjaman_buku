import { Borrowing } from './db';
import { resolveBorrowingStatus } from './borrowing-status';

const CLASS_OPTIONS = [
  'GURU/PEGAWAI', 'X TKJ 1', 'X TKJ 2', 'X DPIB 1', 'X DPIB 2', 'X TO 1', 'X TO 2',
  'XI TKJ 1', 'XI TKJ 2', 'XI DPIB 1', 'XI DPIB 2', 'XI TO 1', 'XI TO 2',
  'XII TKJ 1', 'XII TKJ 2', 'XII DPIB 1', 'XII DPIB 2', 'XII TO 1', 'XII TO 2'
];

const STATUS_OPTIONS = ['Dipinjam', 'Dikembalikan', 'Terlambat'];
const JENIS_BUKU_OPTIONS = ['Pelajaran', 'Bacaan'];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: Omit<Borrowing, 'id' | 'created_at' | 'updated_at'>;
}

// Convert Excel date (days since 1900-01-01) to DD/MM/YYYY format
function excelDateToDateString(excelDate: number): string {
  try {
    const excelEpoch = new Date(1900, 0, 1);
    const daysOffset = excelDate - 2; // Excel's date system has a 2-day offset
    const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    // Validate the date is reasonable
    if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
      return '';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
}

// Convert various date formats to DD/MM/YYYY
function normalizeDate(dateValue: unknown): string {
  if (dateValue === null || dateValue === undefined) {
    return '';
  }

  if (typeof dateValue === 'number') {
    // Handle Excel date format (days since 1900-01-01)
    if (dateValue > 20000 && dateValue < 60000) {
      return excelDateToDateString(dateValue);
    }
    // Handle timestamp (milliseconds since epoch)
    if (dateValue > 1000000000) {
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    // Handle smaller numbers as potential Excel dates
    return excelDateToDateString(dateValue);
  }
  
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    
    if (!trimmed) return '';
    
    // FIRST: Check for Excel serial date embedded in date string (e.g., "01/01/45967")
    const parts = trimmed.split(/[/\-]/);
    if (parts.length === 3) {
      const yearPart = parts[2];
      const yearNum = parseInt(yearPart, 10);
      // If the "year" looks like an Excel serial date (between 20000-60000)
      if (!isNaN(yearNum) && yearNum > 20000 && yearNum < 60000) {
        const converted = excelDateToDateString(yearNum);
        if (converted) return converted;
      }
    }
    
    // Check if the entire string is an Excel serial date
    const entireNum = parseInt(trimmed, 10);
    if (!isNaN(entireNum) && entireNum > 20000 && entireNum < 60000) {
      const converted = excelDateToDateString(entireNum);
      if (converted) return converted;
    }
    
    // Already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Try to parse YYYY-MM-DD to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Try to parse MM/DD/YYYY to DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      return `${day}/${month}/${year}`;
    }
    
    // Try to parse DD-MM-YYYY to DD/MM/YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Try to parse D/M/YYYY to DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    
    // Try to parse Excel date string format
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Invalid date string
    }
  }
  
  return '';
}

// Validate date format (DD/MM/YYYY)
function isValidDateFormat(dateString: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
}

// Validate date is not in the future for borrowing date
function isValidBorrowDate(dateString: string): boolean {
  if (!isValidDateFormat(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date <= today;
}

// Validate date is after borrowing date
function isValidReturnDate(borrowDate: string, returnDate: string): boolean {
  if (!isValidDateFormat(borrowDate) || !isValidDateFormat(returnDate)) return false;
  
  const [bDay, bMonth, bYear] = borrowDate.split('/').map(Number);
  const [rDay, rMonth, rYear] = returnDate.split('/').map(Number);
  
  const borrowDateObj = new Date(bYear, bMonth - 1, bDay);
  const returnDateObj = new Date(rYear, rMonth - 1, rDay);
  
  return returnDateObj >= borrowDateObj;
}

// Simple fuzzy matching for class names
function fuzzyMatchKelas(input: string): string | null {
  const normalized = input.trim().toUpperCase();
  
  // Special case: return null for "-" to show error
  if (normalized === '-' || normalized === '') {
    return null;
  }
  
  // Fix common typos first
  let corrected = normalized;
  corrected = corrected.replace(/TJKT/g, 'TKJ'); // Fix "TJKT" → "TKJ"
  corrected = corrected.replace(/TKR/g, 'TO');   // Fix "TKR" → "TO"
  
  // Remove extra spaces and normalize spacing
  const spaced = corrected.replace(/\s+/g, ' ').trim();
  
  // Try exact match first (case insensitive)
  const exactMatch = CLASS_OPTIONS.find(option => 
    option.toUpperCase() === spaced
  );
  if (exactMatch) return exactMatch;
  
  // Try match without considering case and spacing
  const normalizedInput = corrected.replace(/\s/g, '');
  for (const option of CLASS_OPTIONS) {
    const normalizedOption = option.replace(/\s/g, '').toUpperCase();
    if (normalizedInput === normalizedOption) {
      return option;
    }
  }
  
  // Try partial matching for common typos
  // Extract the pattern (e.g., "XTKJ1" from "X TKJ 1")
  const pattern = corrected.replace(/[^A-Z0-9]/g, '');
  
  for (const option of CLASS_OPTIONS) {
    const optionPattern = option.replace(/[^A-Z0-9]/g, '');
    if (pattern === optionPattern) {
      return option;
    }
  }
  
  // Try Levenshtein distance for close matches - increased tolerance
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  
  for (const option of CLASS_OPTIONS) {
    const distance = levenshteinDistance(corrected, option.toUpperCase());
    if (distance < bestDistance && distance <= 3) { // Allow up to 3 character differences
      bestDistance = distance;
      bestMatch = option;
    }
  }
  
  // Try matching with special characters removed
  const cleanInput = corrected.replace(/[^A-Z0-9]/g, '');
  for (const option of CLASS_OPTIONS) {
    const cleanOption = option.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (cleanInput === cleanOption) {
      return option;
    }
  }
  
  // Try matching number patterns (e.g., "TKJ1" might match "X TKJ 1")
  const numberPattern = corrected.replace(/[^0-9]/g, '');
  if (numberPattern) {
    for (const option of CLASS_OPTIONS) {
      const optionNumberPattern = option.replace(/[^0-9]/g, '');
      if (numberPattern === optionNumberPattern) {
        // Try to match the department part too
        const deptPattern = corrected.replace(/[^A-Z]/g, '');
        const optionDeptPattern = option.replace(/[^A-Z]/g, '').toUpperCase();
        if (deptPattern && optionDeptPattern.includes(deptPattern)) {
          return option;
        }
      }
    }
  }
  
  return bestMatch;
}

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // deletion
          dp[i][j - 1],    // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

export function validateBorrowing(data: Partial<Borrowing>, isImport: boolean = false): ValidationResult {
  const errors: string[] = [];
  const validatedData: Omit<Borrowing, 'id' | 'created_at' | 'updated_at'> = {
    nama: '',
    nis: 0,
    kelas: '',
    nama_buku: '',
    jenis_buku: '',
    kode_buku: '',
    jumlah: 0,
    tanggal_pinjam: '',
    tanggal_kembali: '',
    status: ''
  };

  // Validate nama
  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
    errors.push('Nama harus diisi');
  } else {
    validatedData.nama = data.nama.trim();
  }

  const isTeacherOrStaff = typeof data.kelas === 'string' && data.kelas.trim() === 'GURU/PEGAWAI';

  // Validate nis
  const rawNis = data.nis as unknown;
  if (rawNis === undefined || rawNis === null || (typeof rawNis === 'string' && rawNis.trim() === '')) {
    if (isTeacherOrStaff) {
      validatedData.nis = 0;
    } else {
      errors.push('NIS harus diisi');
    }
  } else {
    const nis = Number(rawNis);
    if (isNaN(nis)) {
      errors.push('NIS harus berupa angka');
    } else if (!isTeacherOrStaff && (nis < 1000 || nis > 4999)) {
      errors.push('NIS tidak valid (harus antara 1000-4999)');
    } else {
      validatedData.nis = nis;
    }
  }

  // Validate kelas with fuzzy matching
  if (!data.kelas || typeof data.kelas !== 'string' || data.kelas.trim() === '') {
    errors.push('Kelas harus diisi');
  } else {
    const normalizedKelas = data.kelas.trim();
    
    // Special check for "-" - show specific error
    if (normalizedKelas === '-') {
      errors.push('Kelas tidak boleh berupa "-"');
    } else {
      // Try exact match first
      if (CLASS_OPTIONS.includes(normalizedKelas)) {
        validatedData.kelas = normalizedKelas;
      } else {
        // Try fuzzy matching
        const fuzzyMatch = fuzzyMatchKelas(normalizedKelas);
        if (fuzzyMatch) {
          validatedData.kelas = fuzzyMatch;
        } else {
          errors.push(`Kelas tidak valid: "${normalizedKelas}". Pilihan yang tersedia: ${CLASS_OPTIONS.join(', ')}`);
        }
      }
    }
  }

  // Validate nama_buku
  if (!data.nama_buku || typeof data.nama_buku !== 'string' || data.nama_buku.trim() === '') {
    errors.push('Nama buku harus diisi');
  } else {
    validatedData.nama_buku = data.nama_buku.trim();
  }

  // Validate jenis_buku
  if (!data.jenis_buku || typeof data.jenis_buku !== 'string' || data.jenis_buku.trim() === '') {
    errors.push('Jenis buku harus diisi');
  } else {
    const normalizedJenis = data.jenis_buku.trim();
    if (!JENIS_BUKU_OPTIONS.includes(normalizedJenis)) {
      errors.push(`Jenis buku tidak valid. Pilihan yang tersedia: ${JENIS_BUKU_OPTIONS.join(', ')}`);
    } else {
      validatedData.jenis_buku = normalizedJenis;
    }
  }

  // Validate kode_buku
  if (!data.kode_buku || typeof data.kode_buku !== 'string' || data.kode_buku.trim() === '') {
    errors.push('Kode buku harus diisi');
  } else {
    validatedData.kode_buku = data.kode_buku.trim();
  }

  // Validate jumlah
  if (data.jumlah === undefined || data.jumlah === null) {
    errors.push('Jumlah harus diisi');
  } else {
    const jumlah = Number(data.jumlah);
    if (isNaN(jumlah) || jumlah <= 0) {
      errors.push('Jumlah harus berupa angka positif');
    } else {
      validatedData.jumlah = jumlah;
    }
  }

  // Validate and normalize tanggal_pinjam
  if (!data.tanggal_pinjam) {
    errors.push('Tanggal pinjam harus diisi');
  } else {
    const normalizedDate = normalizeDate(data.tanggal_pinjam);
    if (!normalizedDate) {
      errors.push(`Format tanggal pinjam tidak valid: ${data.tanggal_pinjam}`);
    } else if (!isValidDateFormat(normalizedDate)) {
      errors.push(`Format tanggal pinjam harus DD/MM/YYYY, got: ${normalizedDate}`);
    } else if (!isImport && !isValidBorrowDate(normalizedDate)) {
      errors.push('Tanggal pinjam tidak boleh di masa depan');
    } else {
      validatedData.tanggal_pinjam = normalizedDate;
    }
  }

  // Validate and normalize tanggal_kembali
  if (!data.tanggal_kembali) {
    errors.push('Tanggal kembali harus diisi');
  } else {
    const normalizedDate = normalizeDate(data.tanggal_kembali);
    if (!normalizedDate) {
      errors.push(`Format tanggal kembali tidak valid: ${data.tanggal_kembali}`);
    } else if (!isValidDateFormat(normalizedDate)) {
      errors.push(`Format tanggal kembali harus DD/MM/YYYY, got: ${normalizedDate}`);
    } else {
      // Check if dates need to be swapped (return date before borrow date)
      if (validatedData.tanggal_pinjam && !isValidReturnDate(validatedData.tanggal_pinjam, normalizedDate)) {
        // Swap the dates automatically
        validatedData.tanggal_kembali = validatedData.tanggal_pinjam;
        validatedData.tanggal_pinjam = normalizedDate;
      } else {
        validatedData.tanggal_kembali = normalizedDate;
      }
    }
  }

  // Validate status
  if (!data.status || typeof data.status !== 'string' || data.status.trim() === '') {
    errors.push('Status harus diisi');
  } else {
    const normalizedStatus = data.status.trim();
    if (!STATUS_OPTIONS.includes(normalizedStatus)) {
      errors.push(`Status tidak valid. Pilihan yang tersedia: ${STATUS_OPTIONS.join(', ')}`);
    } else {
      validatedData.status = normalizedStatus;
    }
  }

  if (errors.length === 0) {
    validatedData.status = resolveBorrowingStatus(validatedData);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validatedData
  };
}

export function validateImportRow(row: unknown[], rowIndex: number): ValidationResult {
  const errors: string[] = [];
  const data: Partial<Borrowing> = {};

  if (!row || row.length < 10) {
    errors.push(`Data tidak lengkap`);
    return { valid: false, errors };
  }

  const toStringValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const toNumberValue = (value: unknown): number => {
    const parsed = Number(toStringValue(value));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  data.nama = toStringValue(row[0]);
  data.nis = toNumberValue(row[1]);
  data.kelas = toStringValue(row[2]);
  data.nama_buku = toStringValue(row[3]);
  data.jenis_buku = toStringValue(row[4]);
  data.kode_buku = toStringValue(row[5]);
  data.jumlah = toNumberValue(row[6]);
  data.tanggal_pinjam = toStringValue(row[7]);
  data.tanggal_kembali = toStringValue(row[8]);
  data.status = toStringValue(row[9]) || 'Dipinjam';

  const validation = validateBorrowing(data, true);
  
  // Prepend row index to errors for better tracking
  validation.errors = validation.errors.map(error => `Baris ${rowIndex}: ${error}`);
  
  return validation;
}
