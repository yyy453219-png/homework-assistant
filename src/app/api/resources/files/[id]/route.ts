import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUploadDir } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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
  const file = db.prepare('SELECT * FROM resource_files WHERE id = ?').get(id) as any;
  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  // Delete physical file
  const filePath = path.join(getUploadDir(), file.filename);
  try {
    fs.unlinkSync(filePath);
  } catch { /* file may not exist */ }

  // Delete DB record
  db.prepare('DELETE FROM resource_files WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}
