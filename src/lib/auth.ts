import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'library_session';
const SESSION_VALUE = 'authenticated';

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    return 'change-this-secret-in-production';
  }

  return secret;
}

export function getAppPassword(): string {
  const password = process.env.APP_PASSWORD?.trim();

  if (!password) {
    throw new Error('APP_PASSWORD is not configured. Set it in .env.local or .env.production.');
  }

  return password;
}

async function createSignature(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(): Promise<string> {
  const signature = await createSignature(SESSION_VALUE);
  return `${SESSION_VALUE}.${signature}`;
}

export async function verifySessionToken(token?: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const [value, signature] = token.split('.');

  if (!value || !signature) {
    return false;
  }

  const expected = await createSignature(value);

  try {
    const actual = signature.toLowerCase();
    const expectedLower = expected.toLowerCase();

    if (actual.length !== expectedLower.length) {
      return false;
    }

    let diff = 0;
    for (let index = 0; index < actual.length; index += 1) {
      diff |= actual.charCodeAt(index) ^ expectedLower.charCodeAt(index);
    }

    return diff === 0;
  } catch {
    return false;
  }
}

export async function setAuthCookie(response: NextResponse): Promise<NextResponse> {
  response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
