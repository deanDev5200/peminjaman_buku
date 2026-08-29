import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection - navigate from src/lib to database folder
const dbPath = path.join(__dirname, '..', 'database', 'library.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Types
export interface Borrowing {
  id?: number;
  nama: string;
  nis: number;
  kelas: string;
  nama_buku: string;
  jenis_buku: string;
  kode_buku: string;
  jumlah: number;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Database operations
export const dbOperations = {
  // Get all borrowings
  getAllBorrowings: (): Borrowing[] => {
    const stmt = db.prepare('SELECT * FROM borrowings ORDER BY created_at DESC');
    return stmt.all() as Borrowing[];
  },

  // Get borrowing by ID
  getBorrowingById: (id: number): Borrowing | undefined => {
    const stmt = db.prepare('SELECT * FROM borrowings WHERE id = ?');
    return stmt.get(id) as Borrowing | undefined;
  },

  // Create new borrowing
  createBorrowing: (borrowing: Omit<Borrowing, 'id' | 'created_at' | 'updated_at'>): Borrowing => {
    const stmt = db.prepare(`
      INSERT INTO borrowings (nama, nis, kelas, nama_buku, jenis_buku, kode_buku, jumlah, tanggal_pinjam, tanggal_kembali, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      borrowing.nama,
      borrowing.nis,
      borrowing.kelas,
      borrowing.nama_buku,
      borrowing.jenis_buku,
      borrowing.kode_buku,
      borrowing.jumlah,
      borrowing.tanggal_pinjam,
      borrowing.tanggal_kembali,
      borrowing.status
    );
    return { ...borrowing, id: result.lastInsertRowid as number };
  },

  // Update borrowing
  updateBorrowing: (id: number, borrowing: Partial<Borrowing>): void => {
    const fields = Object.keys(borrowing).filter(key => key !== 'id').join(', ');
    const values = Object.values(borrowing).filter((_, index) => Object.keys(borrowing)[index] !== 'id');
    
    const stmt = db.prepare(`
      UPDATE borrowings 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(...values, id);
  },

  // Delete borrowing
  deleteBorrowing: (id: number): void => {
    const stmt = db.prepare('DELETE FROM borrowings WHERE id = ?');
    stmt.run(id);
  },

  // Mark as returned
  markAsReturned: (id: number, returnDate: string): void => {
    const stmt = db.prepare(`
      UPDATE borrowings 
      SET status = 'Dikembalikan', tanggal_kembali = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(returnDate, id);
  },

  // Search borrowings by name or NIS
  searchBorrowings: (keyword: string): Borrowing[] => {
    const stmt = db.prepare(`
      SELECT * FROM borrowings 
      WHERE LOWER(nama) LIKE LOWER(?) OR CAST(nis AS TEXT) LIKE ?
      ORDER BY created_at DESC
    `);
    return stmt.all(`%${keyword}%`, `%${keyword}%`) as Borrowing[];
  },

  // Get overdue borrowings
  getOverdueBorrowings: (): Borrowing[] => {
    const stmt = db.prepare(`
      SELECT * FROM borrowings 
      WHERE status = 'Dipinjam' 
      ORDER BY tanggal_kembali ASC
    `);
    return stmt.all() as Borrowing[];
  }
};

export default db;
