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

// Copies static assets into the standalone output after every build.
// The standalone server does NOT bundle these, so without this step
// public files (logos, favicon) and client JS/CSS would 404 in production.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('No standalone output found, skipping asset sync.');
  process.exit(0);
}

const copies = [
  ['public', 'public'],
  [path.join('.next', 'static'), path.join('.next', 'static')],
];

for (const [src, dest] of copies) {
  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(standaloneDir, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`Skipping ${src}: not found.`);
    continue;
  }

  fs.rmSync(destPath, { recursive: true, force: true });
  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log(`Synced ${src} -> ${path.relative(projectRoot, destPath)}`);
}
