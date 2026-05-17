import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) redirect('/orders');

  if (order.user_id !== user.id && !user.is_admin) redirect('/orders');

  const files = db.prepare('SELECT * FROM files WHERE order_id = ? AND is_delivery = 0 ORDER BY uploaded_at ASC').all(id) as any[];
  const deliveries = db.prepare('SELECT * FROM files WHERE order_id = ? AND is_delivery = 1 ORDER BY uploaded_at ASC').all(id) as any[];
  const payments = db.prepare('SELECT * FROM payment_records WHERE order_id = ? ORDER BY created_at DESC').all(id) as any[];

  return (
    <div className="page">
      <Header user={user} />
      <OrderDetailClient
        order={order}
        files={files}
        deliveries={deliveries}
        payments={payments}
        user={user}
      />
    </div>
  );
}
