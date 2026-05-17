import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { nickname, password, inviteCode } = await request.json();

    if (!nickname || !inviteCode) {
      return NextResponse.json({ error: '昵称和邀请码不能为空' }, { status: 400 });
    }

    const db = getDb();

    // Check invite code
    const invite = db.prepare('SELECT * FROM invite_codes WHERE code = ? AND is_used = 0').get(inviteCode) as any;
    if (!invite) {
      return NextResponse.json({ error: '邀请码无效或已被使用' }, { status: 400 });
    }

    // Check nickname uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname);
    if (existing) {
      return NextResponse.json({ error: '该昵称已被使用' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const hashedPassword = password ? crypto.createHash('sha256').update(password).digest('hex') : '';

    db.prepare('INSERT INTO users (id, nickname, password, invite_code) VALUES (?, ?, ?, ?)').run(id, nickname, hashedPassword, inviteCode);
    db.prepare('UPDATE invite_codes SET is_used = 1, used_by = ?, used_at = datetime(\'now\',\'localtime\') WHERE code = ?').run(id, inviteCode);

    // Create session
    const token = 'sess_' + crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(`session_${token}`, id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (err) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
