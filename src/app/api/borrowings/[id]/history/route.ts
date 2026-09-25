import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid borrowing id' }, { status: 400 });
    }

    const existing = dbOperations.getBorrowingById(parsedId);
    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const history = dbOperations.getBorrowingHistory(parsedId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowing history' }, { status: 500 });
  }
}
