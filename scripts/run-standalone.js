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

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadEnvFile } = require('./load-env-file');

const projectRoot = path.resolve(__dirname, '..');
const serverPath = path.join(projectRoot, '.next', 'standalone', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('Standalone server not found at:', serverPath);
  console.error('Build it first with "npm run build" (requires output: "standalone" in next.config.ts).');
  process.exit(1);
}

// Same env file `npm start` uses, so behavior stays identical.
const envFileValues = loadEnvFile(path.join(projectRoot, '.env.production'));
const env = { ...process.env, ...envFileValues };

// The standalone server reads PORT and HOSTNAME (not HOST).
if (env.HOST && !env.HOSTNAME) {
  env.HOSTNAME = env.HOST;
}

const child = spawn(process.execPath, [serverPath], {
  cwd: projectRoot,
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
