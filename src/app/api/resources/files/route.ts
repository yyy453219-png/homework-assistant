import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUploadDir } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const categoryId = formData.get('category_id') as string;
    if (!categoryId) {
      return NextResponse.json({ error: '缺少分类ID' }, { status: 400 });
    }

    const db = getDb();
    const cat = db.prepare('SELECT id FROM resource_categories WHERE id = ?').get(categoryId) as any;
    if (!cat) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 });
    }

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && (key === 'file' || key === 'files[]')) {
        files.push(value);
      }
    }
    if (files.length === 0) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `文件 ${file.name} 超过 50MB 限制` }, { status: 400 });
      }
    }

    if (!fs.existsSync(getUploadDir())) {
      fs.mkdirSync(getUploadDir(), { recursive: true });
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
        INSERT INTO resource_files (id, category_id, filename, original_name, file_type, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, categoryId, filename, file.name, ext, file.size, user.id);

      uploadedFiles.push({ fileId, name: file.name });
    }

    return NextResponse.json({ success: true, files: uploadedFiles, count: uploadedFiles.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '上传失败：服务器内部错误' }, { status: 500 });
  }
}
