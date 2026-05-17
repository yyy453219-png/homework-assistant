import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { orderId } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  // Record payment
  const paymentId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO payment_records (id, order_id, user_id, amount, method, status, confirmed_at)
    VALUES (?, ?, ?, ?, 'manual', 'confirmed', datetime('now','localtime'))
  `).run(paymentId, orderId, order.user_id, order.price);

  // Update order status
  db.prepare("UPDATE orders SET status = 'paid', paid_amount = ?, paid_at = datetime('now','localtime') WHERE id = ?").run(order.price, orderId);

  return NextResponse.json({ success: true });
}
