import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { orderId, amount } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
  }

  const donation = parseFloat(amount);
  if (!donation || donation <= 0) {
    return NextResponse.json({ error: '请输入有效的打赏金额' }, { status: 400 });
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  // Record payment intent
  const paymentId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO payment_records (id, order_id, user_id, amount, method, status, remark)
    VALUES (?, ?, ?, ?, 'manual', 'pending_payment', '用户已付款，等待管理员确认')
  `).run(paymentId, orderId, user.id, donation);

  // Don't auto-mark as paid - admin must verify
  // Just record the payment intent and leave order as pending_payment

  return NextResponse.json({
    success: true,
    message: '已通知管理员，请等待确认',
  });
}
