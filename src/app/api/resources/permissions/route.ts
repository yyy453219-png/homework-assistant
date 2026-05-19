import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const permissions = db.prepare(`
    SELECT rp.*, u.nickname as user_name, rc.name as category_name
    FROM resource_permissions rp
    JOIN users u ON rp.user_id = u.id
    JOIN resource_categories rc ON rp.category_id = rc.id
    ORDER BY rc.name, u.nickname
  `).all();

  return NextResponse.json({ permissions });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const { userId, categoryId } = await request.json();
  if (!userId || !categoryId) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  // Check user and category exist
  const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any;
  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }
  const cat = db.prepare('SELECT id FROM resource_categories WHERE id = ?').get(categoryId) as any;
  if (!cat) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  // INSERT OR IGNORE to handle duplicates
  const id = crypto.randomUUID();
  db.prepare('INSERT OR IGNORE INTO resource_permissions (id, user_id, category_id) VALUES (?, ?, ?)')
    .run(id, userId, categoryId);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const { userId, categoryId } = await request.json();
  if (!userId || !categoryId) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  db.prepare('DELETE FROM resource_permissions WHERE user_id = ? AND category_id = ?')
    .run(userId, categoryId);

  return NextResponse.json({ success: true });
}
