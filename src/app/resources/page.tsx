import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Header from '@/components/Header';
import ResourceClient from './ResourceClient';

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  const db = getDb();

  const categories = db.prepare(`
    SELECT rc.*,
      (SELECT COUNT(*) FROM resource_files rf WHERE rf.category_id = rc.id) as file_count
    FROM resource_categories rc
    ORDER BY rc.sort_order ASC, rc.created_at DESC
  `).all() as any[];

  // If logged in, get user's permission map
  let permissionMap: Record<string, boolean> = {};
  if (user) {
    const perms = db.prepare('SELECT category_id FROM resource_permissions WHERE user_id = ?')
      .all(user.id) as any[];
    for (const p of perms) {
      permissionMap[p.category_id] = true;
    }
  }

  return (
    <div className="page">
      <Header user={user} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <span className="section-number">[ 资料库 ]</span>
        <h1 style={{ marginBottom: '0.5rem' }}>学习资料库</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '2.5rem' }}>
          分类整理的学习资料，注册用户可申请下载权限
        </p>
        <ResourceClient
          categories={categories}
          user={user}
          permissionMap={permissionMap}
        />
      </div>
    </div>
  );
}
