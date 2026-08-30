import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true, message: 'Logout berhasil' });
  return clearAuthCookie(response, request);
}
