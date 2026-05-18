import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const users = db.prepare('SELECT id, nickname, hex(nickname), is_admin FROM users').all();
  const codes = db.prepare("SELECT code FROM invite_codes WHERE is_used = 0 ORDER BY code LIMIT 10").all();

  return NextResponse.json({
    users,
    available_codes: codes,
    note: 'Admin nickname set to ASCII "admin". Use "admin" to login.',
  });
}
