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

-- Create index for faster search by name and NIS
CREATE INDEX IF NOT EXISTS idx_nama ON borrowings(nama);
CREATE INDEX IF NOT EXISTS idx_nis ON borrowings(nis);
CREATE INDEX IF NOT EXISTS idx_status ON borrowings(status);
