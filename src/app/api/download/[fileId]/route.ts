import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUploadDir } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { fileId } = await params;
  const db = getDb();

  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any;
  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  // Verify access
  if (!user.is_admin) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(file.order_id) as any;
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }
    // Delivery files require admin authorization
    if (file.is_delivery) {
      if (!order.download_allowed) {
        return NextResponse.json({ error: '管理员尚未授权下载' }, { status: 403 });
      }
    }
  }

  const filePath = path.join(getUploadDir(), file.filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '文件已丢失' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.original_name)}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
