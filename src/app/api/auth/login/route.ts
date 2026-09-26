import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password-store';
import { getClientIp } from '@/lib/request-metadata';
import { checkLoginLockout, clearLoginAttempts, recordFailedLogin } from '@/lib/login-rate-limit';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const lockout = checkLoginLockout(ip);
    if (lockout.locked) {
      const retryMinutes = Math.max(1, Math.ceil(lockout.retryAfterMs / 60000));
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${retryMinutes} menit.` },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const submittedPassword = body.password ?? '';

    if (!(await verifyPassword(submittedPassword))) {
      recordFailedLogin(ip);
      logSecurityEvent(request, 'login_failed');
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    clearLoginAttempts(ip);
    logSecurityEvent(request, 'login');

    const response = NextResponse.json({ ok: true, message: 'Login berhasil' });
    return await setAuthCookie(response, request);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Password tidak dikonfigurasi' }, { status: 500 });
  }
}
