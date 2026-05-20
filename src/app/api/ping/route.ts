import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok', time: Date.now() });
}
// deployment trigger Wed May 20 13:28:02     2026
