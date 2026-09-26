import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';

// GET global borrowing-history (audit log), newest first.
export async function GET(request: NextRequest) {
  try {
    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '200', 10);
    const limit = Number.isNaN(limitParam) ? 200 : Math.min(Math.max(limitParam, 1), 500);

    return NextResponse.json(dbOperations.getAllBorrowingHistory(limit));
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowing history' }, { status: 500 });
  }
}
