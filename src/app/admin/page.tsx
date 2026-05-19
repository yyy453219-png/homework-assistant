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

  const resourceCategories = db.prepare(`
    SELECT rc.*,
      (SELECT COUNT(*) FROM resource_files rf WHERE rf.category_id = rc.id) as file_count
    FROM resource_categories rc
    ORDER BY rc.sort_order ASC, rc.created_at DESC
  `).all() as any[];

  const allPermissions = db.prepare(`
    SELECT rp.*, u.nickname as user_name, rc.name as category_name
    FROM resource_permissions rp
    JOIN users u ON rp.user_id = u.id
    JOIN resource_categories rc ON rp.category_id = rc.id
    ORDER BY rc.name, u.nickname
  `).all() as any[];

  return (
    <div className="page">
      <AdminClient orders={orders} users={users} user={user} resourceCategories={resourceCategories} allPermissions={allPermissions} />
    </div>
  );
}
