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

export type ClientMetadata = {
  ipAddress: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  os: string;
  deviceName: string;
};

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return 'unknown';
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return 'Opera';
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return 'Google Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Mozilla Firefox';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  if (/MSIE|Trident/i.test(userAgent)) return 'Internet Explorer';
  return 'Unknown Browser';
}

function detectOs(userAgent: string): string {
  if (/Windows NT 10/i.test(userAgent)) return 'Windows 10/11';
  if (/Windows NT/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/CrOS/i.test(userAgent)) return 'ChromeOS';
  return 'Unknown OS';
}

function detectDeviceType(userAgent: string): ClientMetadata['deviceType'] {
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
  if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) return 'mobile';
  if (userAgent) return 'desktop';
  return 'unknown';
}

export function parseUserAgent(userAgent: string): Omit<ClientMetadata, 'ipAddress' | 'userAgent'> {
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);
  const deviceType = detectDeviceType(userAgent);

  return {
    deviceType,
    browser,
    os,
    deviceName: `${browser} on ${os}`,
  };
}

export function getClientMetadata(request: NextRequest): ClientMetadata {
  const userAgent = request.headers.get('user-agent')?.trim() || 'unknown';
  const parsed = parseUserAgent(userAgent);

  return {
    ipAddress: getClientIp(request),
    userAgent,
    ...parsed,
  };
}
