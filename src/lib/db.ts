import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveBorrowingStatus } from './borrowing-status';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection - navigate from src/lib to database folder
const dbPath = path.join(__dirname, '..', 'database', 'library.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    device_type TEXT NOT NULL,
    device_name TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
`);

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

export interface AppSetting {
  key: string;
  value: string;
  updated_at?: string;
}

export type SecurityEventType = 'login' | 'logout';

export interface SecurityLog {
  id?: number;
  event_type: SecurityEventType;
  ip_address: string;
  user_agent: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  created_at?: string;
}

export interface SecurityLogInput {
  event_type: SecurityEventType;
  ip_address: string;
  user_agent: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
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
    const fields = Object.keys(borrowing)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.keys(borrowing)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(key => borrowing[key as keyof Borrowing]);

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
  markAsReturned: (id: number, returnDate: string, status: 'Dikembalikan' | 'Terlambat Dikembalikan'): void => {
    const stmt = db.prepare(`
      UPDATE borrowings 
      SET status = ?, tanggal_kembali = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(status, returnDate, id);
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

  syncAllBorrowingStatuses: (): { updated: number; total: number } => {
    const borrowings = db.prepare('SELECT * FROM borrowings').all() as Borrowing[];
    const updateStmt = db.prepare(`
      UPDATE borrowings
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let updated = 0;

    for (const borrowing of borrowings) {
      const correctStatus = resolveBorrowingStatus(borrowing);

      if (borrowing.status !== correctStatus && borrowing.id !== undefined) {
        updateStmt.run(correctStatus, borrowing.id);
        updated += 1;
      }
    }

    return { updated, total: borrowings.length };
  },

  // Get overdue borrowings
  getOverdueBorrowings: (): Borrowing[] => {
    const stmt = db.prepare(`
      SELECT * FROM borrowings 
      WHERE status = 'Dipinjam' 
      ORDER BY tanggal_kembali ASC
    `);
    return stmt.all() as Borrowing[];
  },

  getSetting: (key: string): string | null => {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value?: string } | undefined;
    return row?.value ?? null;
  },

  setSetting: (key: string, value: string): void => {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value);
  },

  createSecurityLog: (log: SecurityLogInput): SecurityLog => {
    const stmt = db.prepare(`
      INSERT INTO security_logs (
        event_type, ip_address, user_agent, device_type, device_name, browser, os
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      log.event_type,
      log.ip_address,
      log.user_agent,
      log.device_type,
      log.device_name,
      log.browser,
      log.os
    );

    return {
      ...log,
      id: result.lastInsertRowid as number,
    };
  },

  getSecurityLogs: (limit = 200): SecurityLog[] => {
    const stmt = db.prepare(`
      SELECT * FROM security_logs
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `);

    return stmt.all(limit) as SecurityLog[];
  },
};

export default db;
