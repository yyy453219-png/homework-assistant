import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  const users = db.prepare('SELECT id, nickname, is_admin, password IS NOT NULL as has_password FROM users').all();
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_admin = 1").get();
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get();
  const inviteTotal = db.prepare("SELECT COUNT(*) as c FROM invite_codes").get();
  const inviteUsed = db.prepare("SELECT COUNT(*) as c FROM invite_codes WHERE is_used = 1").get();
  const inviteAvailable = db.prepare("SELECT COUNT(*) as c FROM invite_codes WHERE is_used = 0").get();

  return NextResponse.json({
    adminCount,
    userCount,
    inviteTotal,
    inviteUsed,
    inviteAvailable,
    users,
  });
}
