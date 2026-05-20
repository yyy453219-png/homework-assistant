'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUICK_AMOUNTS = [5, 10, 15, 20, 30, 50];

export default function DonationEntry() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [showHint, setShowHint] = useState(false);

  function handleQuickAmount(value: number) {
    setAmount(String(value));
  }

  function handleSubmit() {
    router.push('/submit');
  }

  return (
    <div className="geo-block" style={{ alignSelf: 'flex-start' }}>
      <span className="section-number" style={{ marginBottom: '0.5rem' }}>打赏制</span>
      <p style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
        随性打赏
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
        满意后再付款，金额由你定
      </p>

      {/* Amount input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>¥</span>
        <input type="number" className="input" value={amount}
          onChange={e => setAmount(e.target.value)}
          onFocus={() => setShowHint(true)}
          onBlur={() => setShowHint(false)}
          style={{ width: '140px', padding: '0.5rem 0.75rem', fontSize: '1rem' }}
          placeholder="输入打赏金额" min="0" step="0.01" />
      </div>

      {/* Quick amount chips */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {QUICK_AMOUNTS.map(v => (
          <button key={v} onClick={() => handleQuickAmount(v)}
            style={{
              padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer',
              border: amount === String(v) ? '1px solid var(--black)' : '1px solid var(--gray-200)',
              background: amount === String(v) ? 'var(--black)' : 'transparent',
              color: amount === String(v) ? 'white' : 'var(--gray-500)',
              fontFamily: 'var(--font-mono)',
              borderRadius: 0, transition: 'all 0.15s',
            }}>
            ¥{v}
          </button>
        ))}
      </div>

      {/* Hint */}
      {showHint && (
        <div style={{
          fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '1rem',
          padding: '0.5rem 0.75rem', background: 'var(--gray-50)',
          border: '1px solid var(--gray-100)',
          lineHeight: 1.6,
        }}>
          先提交需求 → 我们完成作业 → 你满意后再付款打赏<br />
          金额完全由你决定，每一份支持都是对我们的鼓励
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}
        onClick={handleSubmit}>
        提交需求 {amount ? `· ¥${amount}` : ''} →
      </button>
    </div>
  );
}
