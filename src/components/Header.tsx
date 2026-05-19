import Link from 'next/link';

interface User {
  id: string;
  nickname: string;
  is_admin: number;
}

export default function Header({ user }: { user: User | null }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--gray-200)',
      padding: '1rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          letterSpacing: '-0.02em',
          textDecoration: 'none',
          color: 'var(--black)',
        }}>
          作业完成助手
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/submit" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none', letterSpacing: '0.03em' }}>
            提交需求
          </Link>
          <Link href="/orders" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none', letterSpacing: '0.03em' }}>
            我的订单
          </Link>
          <Link href="/resources" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none', letterSpacing: '0.03em' }}>
            资料库
          </Link>
          {user?.is_admin ? (
            <Link href="/admin" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.03em' }}>
              管理后台
            </Link>
          ) : null}
          {user ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              {user.nickname}
            </span>
          ) : (
            <Link href="/login" style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textDecoration: 'none' }}>
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
