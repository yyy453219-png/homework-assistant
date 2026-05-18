import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM invite_codes').get() as { c: number };
  const used = db.prepare('SELECT COUNT(*) as c FROM invite_codes WHERE is_used = 1').get() as { c: number };
  const available = db.prepare('SELECT code, created_at FROM invite_codes WHERE is_used = 0 ORDER BY code').all();
  const usedList = db.prepare(`
    SELECT ic.code, ic.used_by, u.nickname, ic.used_at
    FROM invite_codes ic
    LEFT JOIN users u ON ic.used_by = u.id
    WHERE ic.is_used = 1
    ORDER BY ic.used_at DESC
  `).all();

  return NextResponse.json({
    total: total.c,
    used: used.c,
    available: available.length,
    availableCodes: available,
    usedCodes: usedList,
  });
}
