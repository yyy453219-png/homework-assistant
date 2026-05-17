import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (!password || password.length < 4) {
    return NextResponse.json({ error: '密码至少4位' }, { status: 400 });
  }

  const db = getDb();
  const admin = db.prepare("SELECT * FROM users WHERE is_admin = 1 LIMIT 1").get() as any;
  if (!admin) {
    return NextResponse.json({ error: '管理员账户不存在' }, { status: 400 });
  }

  const hashed = crypto.createHash('sha256').update(password).digest('hex');
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, admin.id);

  return NextResponse.json({ success: true, message: '管理员密码设置成功' });
}
