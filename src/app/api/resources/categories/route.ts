import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  const db = getDb();
  const categories = db.prepare(`
    SELECT rc.*,
      (SELECT COUNT(*) FROM resource_files rf WHERE rf.category_id = rc.id) as file_count
    FROM resource_categories rc
    ORDER BY rc.sort_order ASC, rc.created_at DESC
  `).all();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const { name, description, shape, sort_order } = await request.json();
  if (!name) {
    return NextResponse.json({ error: '请填写分类名称' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO resource_categories (id, name, description, shape, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, description || '', shape || 'corner-tl', sort_order ?? 0);

  return NextResponse.json({ success: true, id });
}
