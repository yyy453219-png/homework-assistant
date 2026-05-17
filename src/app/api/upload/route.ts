import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('order_id') as string;
    const isDelivery = formData.get('is_delivery') === '1';

    if (!file || !orderId) {
      return NextResponse.json({ error: '缺少文件或订单ID' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const db = getDb();

    // Verify ownership for upload (admin can upload delivery)
    if (!user.is_admin) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, user.id);
      if (!order) {
        fs.unlinkSync(filePath);
        return NextResponse.json({ error: '订单不存在或无权操作' }, { status: 403 });
      }
    }

    const fileId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO files (id, order_id, user_id, filename, original_name, file_type, file_size, is_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, orderId, user.id, filename, file.name, ext, file.size, isDelivery ? 1 : 0);

    return NextResponse.json({ success: true, fileId, filename: file.name });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
