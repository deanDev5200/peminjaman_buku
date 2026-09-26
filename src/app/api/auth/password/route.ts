import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { setStoredPassword, verifyPassword } from '@/lib/password-store';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    if (!(await verifyPassword(currentPassword))) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 401 });
    }

    await setStoredPassword(newPassword);

    const response = NextResponse.json({ ok: true, message: 'Password berhasil diubah' });
    return clearAuthCookie(response, request);
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
