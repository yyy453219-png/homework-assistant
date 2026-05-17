'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '登录失败');
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
        <span className="section-number">[ 登录 ]</span>
        <h1 style={{ marginBottom: '2rem' }}>用户登录</h1>

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
              placeholder="输入密码"
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            登录
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--gray-500)', textAlign: 'center' }}>
          还没有账号？<Link href="/register" style={{ color: 'var(--black)', textDecoration: 'underline' }}>注册</Link>
        </p>
      </div>
    </div>
  );
}
