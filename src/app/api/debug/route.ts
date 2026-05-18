import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  // Fix admin nickname if corrupted
  db.prepare("UPDATE users SET nickname = '管理员' WHERE is_admin = 1").run();

  const users = db.prepare('SELECT id, nickname, is_admin, password IS NOT NULL as has_password FROM users').all();
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_admin = 1").get();
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get();
  const inviteTotal = db.prepare("SELECT COUNT(*) as c FROM invite_codes").get();
  const inviteUsed = db.prepare("SELECT COUNT(*) as c FROM invite_codes WHERE is_used = 1").get();
  const inviteAvailable = db.prepare("SELECT COUNT(*) as c FROM invite_codes WHERE is_used = 0").get();

  // List first 20 available invite codes
  const codes = db.prepare("SELECT code FROM invite_codes WHERE is_used = 0 ORDER BY code LIMIT 20").all();

  return NextResponse.json({
    adminCount,
    userCount,
    inviteTotal,
    inviteUsed,
    inviteAvailable,
    sampleCodes: codes,
    users,
    note: 'Admin nickname has been fixed if it was corrupted',
  });
}
