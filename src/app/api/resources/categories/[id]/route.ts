import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUploadDir } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const category = db.prepare(`
    SELECT rc.*,
      (SELECT COUNT(*) FROM resource_files rf WHERE rf.category_id = rc.id) as file_count
    FROM resource_categories rc WHERE rc.id = ?
  `).get(id) as any;

  if (!category) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  const files = db.prepare(
    'SELECT id, original_name, file_type, file_size, uploaded_at FROM resource_files WHERE category_id = ? ORDER BY uploaded_at DESC'
  ).all(id);

  return NextResponse.json({ category, files });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM resource_categories WHERE id = ?').get(id) as any;
  if (!existing) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  const { name, description, shape, sort_order } = await request.json();
  if (name !== undefined) {
    db.prepare('UPDATE resource_categories SET name = ? WHERE id = ?').run(name, id);
  }
  if (description !== undefined) {
    db.prepare('UPDATE resource_categories SET description = ? WHERE id = ?').run(description, id);
  }
  if (shape !== undefined) {
    db.prepare('UPDATE resource_categories SET shape = ? WHERE id = ?').run(shape, id);
  }
  if (sort_order !== undefined) {
    db.prepare('UPDATE resource_categories SET sort_order = ? WHERE id = ?').run(sort_order, id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const db = getDb();

  // Delete physical files from disk
  const files = db.prepare('SELECT filename FROM resource_files WHERE category_id = ?').all(id) as any[];
  for (const f of files) {
    try {
      fs.unlinkSync(path.join(getUploadDir(), f.filename));
    } catch { /* file may not exist */ }
  }

  // Delete DB records (order matters due to FK)
  db.prepare('DELETE FROM resource_permissions WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM resource_files WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM resource_categories WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}
