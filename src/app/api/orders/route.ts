import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const db = getDb();

    const id = crypto.randomUUID();
    const price = data.is_urgent ? 25 : 15;

    db.prepare(`
      INSERT INTO orders (id, user_id, course_name, homework_type, service_type, description, current_status, expected_help, is_urgent, deadline, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, data.course_name, data.homework_type, data.service_type, data.description, data.current_status || '', data.expected_help || '', data.is_urgent ? 1 : 0, data.deadline || '', price);

    return NextResponse.json({ success: true, orderId: id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const db = getDb();
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  return NextResponse.json({ orders });
}
