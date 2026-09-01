import { NextRequest, NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/auth';

export const DEV_SECURITY_COOKIE = 'library_dev_security';
const DEV_SESSION_TTL_MS = 60 * 60 * 2 * 1000;

type DeveloperSession = {
  role: 'developer';
  issuedAt: number;
  expiresAt: number;
};

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

async function createDeveloperToken(session: DeveloperSession): Promise<string> {
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = await createSignature(payload);
  return `${payload}.${signature}`;
}

async function verifyDeveloperToken(token?: string): Promise<DeveloperSession | null> {
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

    const decoded = JSON.parse(decodeBase64Url(payload)) as Partial<DeveloperSession>;
    if (decoded.role !== 'developer') {
      return null;
    }

    const now = Date.now();
    if (typeof decoded.expiresAt !== 'number' || decoded.expiresAt <= now) {
      return null;
    }

    return {
      role: 'developer',
      issuedAt: typeof decoded.issuedAt === 'number' ? decoded.issuedAt : now,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export function getDeveloperAccessKey(): string | null {
  const key = process.env.DEVELOPER_ACCESS_KEY?.trim();
  return key || null;
}

export function isDeveloperAccessConfigured(): boolean {
  return Boolean(getDeveloperAccessKey());
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

export async function setDeveloperCookie(
  response: NextResponse,
  request?: Pick<NextRequest, 'headers' | 'url'>
): Promise<NextResponse> {
  const session: DeveloperSession = {
    role: 'developer',
    issuedAt: Date.now(),
    expiresAt: Date.now() + DEV_SESSION_TTL_MS,
  };

  response.cookies.set(DEV_SECURITY_COOKIE, await createDeveloperToken(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: Math.floor(DEV_SESSION_TTL_MS / 1000),
  });

  return response;
}

export function clearDeveloperCookie(
  response: NextResponse,
  request?: Pick<NextRequest, 'headers' | 'url'>
): NextResponse {
  response.cookies.set(DEV_SECURITY_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function hasDeveloperAccess(request: NextRequest): Promise<boolean> {
  if (!isDeveloperAccessConfigured()) {
    return false;
  }

  const token = request.cookies.get(DEV_SECURITY_COOKIE)?.value;
  return Boolean(await verifyDeveloperToken(token));
}

export async function requireDeveloperAccess(request: NextRequest): Promise<NextResponse | null> {
  if (!(await hasDeveloperAccess(request))) {
    return NextResponse.json({ error: 'Developer access required' }, { status: 403 });
  }

  return null;
}

export function verifyDeveloperAccessKey(candidate: string): boolean {
  const configuredKey = getDeveloperAccessKey();
  if (!configuredKey) {
    return false;
  }

  return candidate === configuredKey;
}
