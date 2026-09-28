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

import { NextRequest } from 'next/server';
import { dbOperations } from '@/lib/db';
import { getClientMetadata } from '@/lib/request-metadata';
import type { SecurityEventType } from '@/lib/types';

export function logSecurityEvent(request: NextRequest, eventType: SecurityEventType): void {
  const metadata = getClientMetadata(request);

  dbOperations.createSecurityLog({
    event_type: eventType,
    ip_address: metadata.ipAddress,
    user_agent: metadata.userAgent,
    device_type: metadata.deviceType,
    device_name: metadata.deviceName,
    browser: metadata.browser,
    os: metadata.os,
  });
}
