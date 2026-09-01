import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  hasDeveloperAccess,
  isDeveloperAccessConfigured,
  setDeveloperCookie,
  verifyDeveloperAccessKey,
} from '@/lib/developer-auth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  return NextResponse.json({
    configured: isDeveloperAccessConfigured(),
    unlocked: await hasDeveloperAccess(request),
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  if (!isDeveloperAccessConfigured()) {
    return NextResponse.json(
      { error: 'Developer access belum dikonfigurasi di server.' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { accessKey?: string };
  const accessKey = body.accessKey?.trim() ?? '';

  if (!verifyDeveloperAccessKey(accessKey)) {
    return NextResponse.json({ error: 'Developer access key salah.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, message: 'Developer access granted' });
  return setDeveloperCookie(response, request);
}
