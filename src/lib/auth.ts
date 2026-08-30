import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'library_session';
const SESSION_TTL_MS = 60 * 60 * 8 * 1000;

export type AuthSession = {
  authenticated: boolean;
  user: 'admin';
  issuedAt: number;
  expiresAt: number;
};

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    return 'change-this-secret-in-production';
  }

  return secret;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

export async function createSessionToken(session: AuthSession = {
  authenticated: true,
  user: 'admin',
  issuedAt: Date.now(),
  expiresAt: Date.now() + SESSION_TTL_MS,
}): Promise<string> {
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = await createSignature(payload);

  return `${payload}.${signature}`;
}

export async function verifySessionToken(token?: string): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  if (!payload || !signature) {
    return null;
  }

  const expected = await createSignature(payload);

  try {
    const actual = signature.toLowerCase();
    const expectedLower = expected.toLowerCase();

    if (actual.length !== expectedLower.length) {
      return null;
    }

    let diff = 0;
    for (let index = 0; index < actual.length; index += 1) {
      diff |= actual.charCodeAt(index) ^ expectedLower.charCodeAt(index);
    }

    if (diff !== 0) {
      return null;
    }

    const decoded = JSON.parse(decodeBase64Url(payload)) as Partial<AuthSession>;

    if (!decoded.authenticated || decoded.user !== 'admin') {
      return null;
    }

    const now = Date.now();
    if (typeof decoded.expiresAt === 'number' && decoded.expiresAt <= now) {
      return null;
    }

    return {
      authenticated: true,
      user: 'admin',
      issuedAt: typeof decoded.issuedAt === 'number' ? decoded.issuedAt : now,
      expiresAt: typeof decoded.expiresAt === 'number' ? decoded.expiresAt : now + SESSION_TTL_MS,
    };
  } catch {
    return null;
  }
}

function isSecureRequest(request?: Pick<NextRequest, 'headers' | 'url'>): boolean {
  if (!request) {
    return process.env.NODE_ENV === 'production';
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.toLowerCase() === 'https';
  }

  return request.url.startsWith('https://');
}

export async function setAuthCookie(response: NextResponse, request?: Pick<NextRequest, 'headers' | 'url'>): Promise<NextResponse> {
  const session: AuthSession = {
    authenticated: true,
    user: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return response;
}

export function clearAuthCookie(response: NextResponse, request?: Pick<NextRequest, 'headers' | 'url'>): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
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
