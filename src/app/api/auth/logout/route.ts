import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  logSecurityEvent(request, 'logout');

  const response = NextResponse.json({ ok: true, message: 'Logout berhasil' });
  return clearAuthCookie(response, request);
}
