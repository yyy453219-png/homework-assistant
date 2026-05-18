export default function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '3rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>加载管理后台...</p>
      </div>
    </div>
  );
}
