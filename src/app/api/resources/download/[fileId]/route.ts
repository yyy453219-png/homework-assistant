import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const db = getDb();
  const file = db.prepare('SELECT * FROM resource_files WHERE id = ?').get(fileId) as any;
  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  // Permission check: admin always allowed
  if (!user.is_admin) {
    const perm = db.prepare(
      'SELECT id FROM resource_permissions WHERE user_id = ? AND category_id = ?'
    ).get(user.id, file.category_id) as any;

    if (!perm) {
      return NextResponse.json({ error: '暂无下载权限' }, { status: 403 });
    }
  }

  const filePath = path.join(process.cwd(), 'uploads', file.filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const encodedName = encodeURIComponent(file.original_name);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
    },
  });
}
