import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  if (order.user_id !== user.id && !user.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const files = db.prepare('SELECT * FROM files WHERE order_id = ? AND is_delivery = 0 ORDER BY uploaded_at ASC').all(id);
  const deliveries = db.prepare('SELECT * FROM files WHERE order_id = ? AND is_delivery = 1 ORDER BY uploaded_at ASC').all(id);
  const payments = db.prepare('SELECT * FROM payment_records WHERE order_id = ? ORDER BY created_at DESC').all(id);

  return NextResponse.json({ order, files, deliveries, payments });
}
