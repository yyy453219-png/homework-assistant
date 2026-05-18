export default function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '3rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid var(--gray-200)',
          borderTopColor: 'var(--black)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>加载中...</p>
      </div>
    </div>
  );
}
