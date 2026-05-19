import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUploadDir } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const orderId = formData.get('order_id') as string;
    const isDelivery = formData.get('is_delivery') === '1';

    if (!orderId) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
    }

    // Get all files from formData (both 'file' and 'files[]')
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && (key === 'file' || key === 'files[]')) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // Check file sizes (max 50MB each)
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `文件 ${file.name} 超过 50MB 限制` }, { status: 400 });
      }
    }

    if (!fs.existsSync(getUploadDir())) {
      fs.mkdirSync(getUploadDir(), { recursive: true });
    }

    const db = getDb();

    // Verify ownership for upload (admin can upload delivery)
    if (!user.is_admin) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, user.id);
      if (!order) {
        return NextResponse.json({ error: '订单不存在或无权操作' }, { status: 403 });
      }
    }

    const uploadedFiles: { fileId: string; name: string }[] = [];

    for (const file of files) {
      const ext = path.extname(file.name) || '.bin';
      const filename = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(getUploadDir(), filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      const fileId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO files (id, order_id, user_id, filename, original_name, file_type, file_size, is_delivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, orderId, user.id, filename, file.name, ext, file.size, isDelivery ? 1 : 0);

      uploadedFiles.push({ fileId, name: file.name });
    }

    return NextResponse.json({ success: true, files: uploadedFiles, count: uploadedFiles.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '上传失败：服务器内部错误' }, { status: 500 });
  }
}
