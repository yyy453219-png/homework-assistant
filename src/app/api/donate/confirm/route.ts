import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const { donationId } = await request.json();

  if (!donationId) {
    return NextResponse.json({ error: '缺少打赏记录ID' }, { status: 400 });
  }

  const db = getDb();
  const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
  if (!donation) {
    return NextResponse.json({ error: '打赏记录不存在' }, { status: 404 });
  }

  // Mark as paid (user confirmed)
  db.prepare("UPDATE donations SET status = 'paid' WHERE id = ?").run(donationId);

  return NextResponse.json({
    success: true,
    message: '已通知管理员，请等待确认',
  });
}
