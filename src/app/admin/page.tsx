import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect('/');

  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, u.nickname FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all() as any[];

  const users = db.prepare('SELECT id, nickname, phone, school, invite_code, is_blocked, created_at FROM users ORDER BY created_at DESC').all() as any[];

  return (
    <div className="page">
      <AdminClient orders={orders} users={users} user={user} />
    </div>
  );
}
