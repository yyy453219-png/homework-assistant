import { cookies } from 'next/headers';
import { getDb } from './db';

export interface User {
  id: string;
  nickname: string;
  phone: string;
  school: string;
  invite_code: string;
  is_admin: number;
  is_blocked: number;
}

export function createSession(userId: string) {
  const token = 'sess_' + require('crypto').randomBytes(32).toString('hex');
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(`session_${token}`, userId);
  return token;
}

export function destroySession(token: string) {
  const db = getDb();
  db.prepare('DELETE FROM settings WHERE key = ?').run(`session_${token}`);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;

  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(`session_${token}`) as { value: string } | undefined;
  if (!row) return null;

  const user = db.prepare('SELECT id, nickname, phone, school, invite_code, is_admin, is_blocked FROM users WHERE id = ?').get(row.value) as User | undefined;
  return user || null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (!user.is_admin) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
