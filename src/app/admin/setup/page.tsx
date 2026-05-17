'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminSetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('两次密码不一致');
      return;
    }
    if (password.length < 4) {
      setError('密码至少4位');
      return;
    }

    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || '设置失败');
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--white)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>密码设置成功</h1>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', fontSize: '0.875rem' }}>
            管理员密码已设置，请使用昵称「管理员」登录
          </p>
          <Link href="/login" className="btn btn-primary">前往登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1.5rem', background: 'var(--white)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <span className="section-number">[ 初始化 ]</span>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>设置管理员密码</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '2rem' }}>
          首次运行请设置管理员密码
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">密码</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="不少于4位" required />
          </div>
          <div className="form-group">
            <label className="label">确认密码</label>
            <input className="input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="再次输入密码" required />
          </div>
          {error && <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>设置密码</button>
        </form>
      </div>
    </div>
  );
}
