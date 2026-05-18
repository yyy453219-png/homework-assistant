import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const users = db.prepare('SELECT id, nickname, is_admin FROM users').all();
  return NextResponse.json({ users });
}
