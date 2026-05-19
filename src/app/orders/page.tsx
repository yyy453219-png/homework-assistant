import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

const statusLabels: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  processing: '处理中',
  need_info: '待补充资料',
  delivered: '已交付',
  completed: '已完成',
  refunded: '已退款',
  cancelled: '已取消',
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const db = getDb();
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as any[];

  return (
    <div className="page">
      <Header user={user} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <span className="section-number">[ 订单 ]</span>
        <h1 style={{ marginBottom: '2.5rem' }}>我的订单</h1>

        {orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--gray-200)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>暂无订单</p>
            <Link href="/submit" className="btn btn-primary btn-sm">
              提交第一个需求
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map((order: any) => (
              <Link key={order.id} href={`/order/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="order-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.25rem' }}>{order.course_name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {order.service_type} · {order.homework_type}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                        {order.created_at}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${order.status === 'delivered' || order.status === 'completed' ? 'badge-success' : order.status === 'pending_payment' ? 'badge-warning' : ''}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '0.25rem' }}>
                        ¥{order.paid_amount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
