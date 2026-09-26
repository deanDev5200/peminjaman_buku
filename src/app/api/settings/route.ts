import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';

export async function GET() {
  try {
    const settings = {
      borrow_limit_pelajaran: dbOperations.getSetting('borrow_limit_pelajaran') || '3',
      borrow_limit_bacaan: dbOperations.getSetting('borrow_limit_bacaan') || '7',
      borrow_limit_guru: dbOperations.getSetting('borrow_limit_guru') || '30',
      max_extend_count: dbOperations.getSetting('max_extend_count') || '1',
      due_soon_days: dbOperations.getSetting('due_soon_days') || '7',
      root_view_days: dbOperations.getSetting('root_view_days') || '30',
      app_title: dbOperations.getSetting('app_title') || 'Jnana Grha Mandara',
      app_subtitle: dbOperations.getSetting('app_subtitle') || 'Sistem Peminjaman Buku',
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const allowedKeys = [
      'borrow_limit_pelajaran',
      'borrow_limit_bacaan',
      'borrow_limit_guru',
      'root_view_days',
      'due_soon_days',
    ];
    const stringKeys = ['app_title', 'app_subtitle'];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const value = parseInt(body[key], 10);
        if (isNaN(value) || value <= 0) {
          return NextResponse.json(
            { error: `Invalid value for ${key}` },
            { status: 400 }
          );
        }
        dbOperations.setSetting(key, String(value));
      }
    }

    if (body.max_extend_count !== undefined) {
      const value = parseInt(body.max_extend_count, 10);
      if (isNaN(value) || value < 0) {
        return NextResponse.json(
          { error: 'Invalid value for max_extend_count' },
          { status: 400 }
        );
      }
      dbOperations.setSetting('max_extend_count', String(value));
    }

    for (const key of stringKeys) {
      if (body[key] !== undefined) {
        const value = String(body[key]).trim();
        if (value.length === 0) {
          return NextResponse.json(
            { error: `Invalid value for ${key}` },
            { status: 400 }
          );
        }
        dbOperations.setSetting(key, value);
      }
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
