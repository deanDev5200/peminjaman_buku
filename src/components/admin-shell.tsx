'use client';

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

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import Sidebar from '@/components/sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="lg:hidden sticky top-0 z-30 flex items-center border-b bg-card px-4 py-2">
            <button
              className="p-2 rounded-md hover:bg-accent"
              onClick={() => setIsOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
