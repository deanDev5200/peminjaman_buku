import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveBorrowingStatus } from './borrowing-status';
import type { Borrowing, BorrowingHistory, AppSetting, SecurityEventType, SecurityLog, SecurityLogInput } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export types
export type { Borrowing, BorrowingHistory, AppSetting, SecurityEventType, SecurityLog, SecurityLogInput };

// Database connection - navigate from src/lib to database folder.
// DB_PATH overrides the location (used by standalone/production deploys
// to keep data outside the deployed code folder). Also honored by
// `npm run init-db` and `npm run migrate-db`.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'database', 'library.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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

// Database operations
export const dbOperations = {
  // Get all borrowings
  getAllBorrowings: (daysLimit?: number): Borrowing[] => {
    let query = 'SELECT * FROM borrowings';
    const params: unknown[] = [];
    
    if (daysLimit !== undefined && daysLimit !== null && daysLimit > 0) {
      const cutoffDate = new Date(Date.now() - daysLimit * 86400000);
      const year = cutoffDate.getFullYear();
      const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
      const day = String(cutoffDate.getDate()).padStart(2, '0');
      query += ' WHERE tanggal_pinjam >= ?';
      params.push(`${day}/${month}/${year}`);
    }
    
    query += ' ORDER BY created_at DESC';
    const stmt = db.prepare(query);
    return stmt.all(...params) as Borrowing[];
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

  // Extend borrowing - record history and update return date
  extendBorrowing: (id: number, newReturnDate: string, reason: string): void => {
    const borrowing = db.prepare('SELECT tanggal_kembali FROM borrowings WHERE id = ?').get(id) as { tanggal_kembali: string } | undefined;
    if (!borrowing) return;

    const insertHistory = db.prepare(`
      INSERT INTO borrowing_history (borrowing_id, original_tanggal_kembali, new_tanggal_kembali, reason)
      VALUES (?, ?, ?, ?)
    `);
    insertHistory.run(id, borrowing.tanggal_kembali, newReturnDate, reason);

    const updateStmt = db.prepare(`
      UPDATE borrowings 
      SET tanggal_kembali = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    updateStmt.run(newReturnDate, id);
  },

  // Get borrowing history
  getBorrowingHistory: (borrowingId: number): BorrowingHistory[] => {
    const stmt = db.prepare(`
      SELECT * FROM borrowing_history 
      WHERE borrowing_id = ?
      ORDER BY extended_at DESC
    `);
    return stmt.all(borrowingId) as BorrowingHistory[];
  },

  // Search borrowings
  searchBorrowings: (keyword: string, daysLimit?: number): Borrowing[] => {
    let query = `SELECT * FROM borrowings 
      WHERE LOWER(nama) LIKE LOWER(?) OR CAST(nis AS TEXT) LIKE ?`;
    const params: unknown[] = [`%${keyword}%`, `%${keyword}%`];

    if (daysLimit !== undefined && daysLimit !== null && daysLimit > 0) {
      const cutoffDate = new Date(Date.now() - daysLimit * 86400000);
      const year = cutoffDate.getFullYear();
      const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
      const day = String(cutoffDate.getDate()).padStart(2, '0');
      query += ' AND tanggal_pinjam >= ?';
      params.push(`${day}/${month}/${year}`);
    }

    query += ' ORDER BY created_at DESC';
    const stmt = db.prepare(query);
    return stmt.all(...params) as Borrowing[];
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
