import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname) {
      return NextResponse.json({ error: '请输入昵称' }, { status: 400 });
    }

    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as any;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    if (user.password) {
      const hashed = crypto.createHash('sha256').update(password || '').digest('hex');
      if (hashed !== user.password) {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    }

    if (user.is_blocked) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 });
    }

    const token = 'sess_' + crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(`session_${token}`, user.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (err) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
