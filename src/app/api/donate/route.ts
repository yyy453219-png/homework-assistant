import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const { amount, message } = await request.json();

  const donation = parseFloat(amount);
  if (!donation || donation <= 0) {
    return NextResponse.json({ error: '请输入有效的打赏金额' }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO donations (id, user_id, nickname, amount, message, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(
    id,
    user?.id || null,
    user?.nickname || '匿名用户',
    donation,
    (message || '').slice(0, 200)
  );

  return NextResponse.json({
    success: true,
    id,
    message: '打赏记录已提交',
  });
}
