import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireDeveloperAccess } from '@/lib/developer-auth';
import { dbOperations } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  const developerError = await requireDeveloperAccess(request);
  if (developerError) {
    return developerError;
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 200, 1), 500) : 200;

  const logs = dbOperations.getSecurityLogs(limit);

  return NextResponse.json({ logs, total: logs.length });
}
