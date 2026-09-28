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

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'library.db');
const db = new Database(dbPath);

// Read and execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema
db.exec(schema);

console.log('Database initialized successfully at:', dbPath);
console.log('Database schema created from:', schemaPath);

// Close connection
db.close();

process.exit(0);
