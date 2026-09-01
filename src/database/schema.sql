-- Database schema for library book borrowing system
-- Matches the Excel structure from the original PyQt5 application

CREATE TABLE IF NOT EXISTS borrowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    nis INTEGER NOT NULL,
    kelas TEXT NOT NULL,
    nama_buku TEXT NOT NULL,
    jenis_buku TEXT NOT NULL, -- 'Pelajaran' or 'Bacaan'
    kode_buku TEXT NOT NULL,
    jumlah INTEGER NOT NULL,
    tanggal_pinjam TEXT NOT NULL, -- Format: DD/MM/YYYY
    tanggal_kembali TEXT NOT NULL, -- Format: DD/MM/YYYY
    status TEXT NOT NULL DEFAULT 'Dipinjam', -- 'Dipinjam' or 'Dikembalikan'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster search by name and NIS
CREATE INDEX IF NOT EXISTS idx_nama ON borrowings(nama);
CREATE INDEX IF NOT EXISTS idx_nis ON borrowings(nis);
CREATE INDEX IF NOT EXISTS idx_status ON borrowings(status);

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
