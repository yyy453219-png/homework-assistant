import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const status = request.nextUrl.searchParams.get('status');
  let orders;

  if (status) {
    orders = db.prepare('SELECT o.*, u.nickname FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = ? ORDER BY o.created_at DESC').all(status);
  } else {
    orders = db.prepare('SELECT o.*, u.nickname FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC').all();
  }

  return NextResponse.json({ orders });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { orderId, status, admin_note, paidAmount, downloadAllowed } = await request.json();
  const db = getDb();

  if (status) {
    const updateData: any = { status };
    if (status === 'paid') updateData.paid_at = new Date().toLocaleString('zh-CN');
    if (status === 'delivered') updateData.delivered_at = new Date().toLocaleString('zh-CN');

    if (status === 'paid') {
      db.prepare('UPDATE orders SET status = ?, paid_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(status, orderId);
    } else if (status === 'delivered') {
      db.prepare('UPDATE orders SET status = ?, delivered_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(status, orderId);
    } else {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    }
  }

  if (admin_note !== undefined) {
    db.prepare('UPDATE orders SET admin_note = ? WHERE id = ?').run(admin_note, orderId);
  }

  if (downloadAllowed !== undefined) {
    db.prepare('UPDATE orders SET download_allowed = ? WHERE id = ?').run(downloadAllowed ? 1 : 0, orderId);
  }

  if (paidAmount !== undefined) {
    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: '无效金额' }, { status: 400 });
    }
    // Accumulate paid_amount
    db.prepare('UPDATE orders SET paid_amount = COALESCE(paid_amount, 0) + ? WHERE id = ?').run(amount, orderId);
  }

  return NextResponse.json({ success: true });
}
