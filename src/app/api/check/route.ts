import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();

  // Test the exact same query the login endpoint uses
  const nickname = '管理员';
  const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
  const userDirect = db.prepare("SELECT * FROM users WHERE nickname = '管理员'").get();
  const allUsers = db.prepare('SELECT id, nickname, hex(nickname) as hex_nick, length(nickname) as len, is_admin FROM users').all();

  return NextResponse.json({
    nickname_param: nickname,
    user_by_param: user || null,
    user_by_direct: userDirect || null,
    all_users: allUsers,
  });
}
