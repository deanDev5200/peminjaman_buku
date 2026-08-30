import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { getStoredPassword } from '@/lib/password-store';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const submittedPassword = body.password ?? '';

    if (submittedPassword !== getStoredPassword()) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, message: 'Login berhasil' });
    return await setAuthCookie(response, request);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Password tidak dikonfigurasi' }, { status: 500 });
  }
}
