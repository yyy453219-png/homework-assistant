'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password, inviteCode }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '注册失败');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
          ← 返回首页
        </Link>
        <span className="section-number">[ 注册 ]</span>
        <h1 style={{ marginBottom: '2rem' }}>新用户注册</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">昵称</label>
            <input
              className="input"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="输入你的昵称"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="设置密码（可选）"
            />
          </div>
          <div className="form-group">
            <label className="label">邀请码</label>
            <input
              className="input"
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="输入邀请码（如 HELPER01）"
              required
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            注册
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>
          已有账号？<Link href="/login" style={{ color: 'var(--black)', textDecoration: 'underline' }}>登录</Link>
        </p>
      </div>
    </div>
  );
}
