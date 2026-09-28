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

import { Settings } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  borrow_limit_pelajaran: '3',
  borrow_limit_bacaan: '7',
  borrow_limit_guru: '30',
  max_extend_count: '1',
  due_soon_days: '7',
  root_view_days: '30',
  app_title: 'Jnana Grha Mandara',
  app_subtitle: 'Sistem Peminjaman Buku',
};

export async function fetchAppSettings(): Promise<Settings> {
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    if (!response.ok) {
      return { ...DEFAULT_SETTINGS };
    }
    const data = await response.json();
    return {
      borrow_limit_pelajaran: data.borrow_limit_pelajaran ?? DEFAULT_SETTINGS.borrow_limit_pelajaran,
      borrow_limit_bacaan: data.borrow_limit_bacaan ?? DEFAULT_SETTINGS.borrow_limit_bacaan,
      borrow_limit_guru: data.borrow_limit_guru ?? DEFAULT_SETTINGS.borrow_limit_guru,
      max_extend_count: data.max_extend_count ?? DEFAULT_SETTINGS.max_extend_count,
      due_soon_days: data.due_soon_days ?? DEFAULT_SETTINGS.due_soon_days,
      root_view_days: data.root_view_days ?? DEFAULT_SETTINGS.root_view_days,
      app_title: data.app_title ?? DEFAULT_SETTINGS.app_title,
      app_subtitle: data.app_subtitle ?? DEFAULT_SETTINGS.app_subtitle,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
