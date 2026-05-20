'use client';

import { useState } from 'react';

type Step = 'input' | 'pay' | 'done';

export default function DonationEntry() {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [submitting, setSubmitting] = useState(false);
  const [donationId, setDonationId] = useState('');

  async function handleStartDonate() {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (res.ok) {
        setDonationId(data.id);
        setStep('pay');
      }
    } catch {
      // ignore
    }
    setSubmitting(false);
  }

  async function handleConfirmPaid() {
    setSubmitting(true);
    try {
      await fetch('/api/donate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donationId }),
      });
      setStep('done');
    } catch {
      setStep('done');
    }
    setSubmitting(false);
  }

  const isValid = parseFloat(amount) > 0;

  return (
    <div className="geo-block" style={{ alignSelf: 'flex-start' }}>
      <span className="section-number" style={{ marginBottom: '0.5rem' }}>打赏支持</span>
      <p style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
        随性打赏
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
        满意后再付款，金额由你定
      </p>

      {step === 'input' && (
        <>
          {/* Amount input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '0.75rem',
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>¥</span>
            <input type="number" className="input" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ width: '140px', padding: '0.5rem 0.75rem', fontSize: '1rem' }}
              placeholder="金额随意" min="0" step="0.01" />
          </div>

          {/* Subtle hint */}
          <p style={{
            fontSize: '0.65rem', color: 'var(--gray-300)', marginBottom: '1rem',
            fontStyle: 'italic', lineHeight: 1.5,
            userSelect: 'none',
          }}>
            先打赏 → 稍后在订单中抵扣<br />
            每一份支持都是对我们的鼓励
          </p>

          <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}
            disabled={!isValid || submitting} onClick={handleStartDonate}>
            {submitting ? '处理中...' : isValid ? `打赏 ¥${amount} →` : '输入打赏金额'}
          </button>
        </>
      )}

      {step === 'pay' && (
        <>
          <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            打赏 ¥{amount}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            请扫描下方二维码付款
          </p>
          <div style={{
            width: '180px', height: '180px',
            background: 'var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid var(--gray-200)',
            fontSize: '0.7rem', color: 'var(--gray-400)',
            overflow: 'hidden',
          }}>
            <img src="/images/qr-code.jpg" alt="微信收款码"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                (e.target as HTMLElement).parentElement!.innerText = '请替换 public/images/qr-code.jpg';
              }}
            />
          </div>

          {/* Subtle hint near QR */}
          <p style={{
            fontSize: '0.6rem', color: 'var(--gray-300)', textAlign: 'center',
            marginBottom: '0.75rem', userSelect: 'none',
          }}>
            微信扫一扫 · 金额随心
          </p>

          <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.8rem' }}
            disabled={submitting} onClick={handleConfirmPaid}>
            {submitting ? '确认中...' : '我已付款'}
          </button>
          <p style={{
            fontSize: '0.6rem', color: 'var(--gray-300)', textAlign: 'center',
            marginTop: '0.5rem', userSelect: 'none',
          }}>
            付款后点击确认，管理员核实后生效
          </p>
        </>
      )}

      {step === 'done' && (
        <>
          <div style={{
            textAlign: 'center', padding: '1rem 0',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</p>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              感谢你的支持！
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>
              打赏 ¥{amount} 已记录<br />
              管理员核实后生效
            </p>
          </div>
          <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', marginTop: '0.5rem' }}
            onClick={() => { setStep('input'); setAmount(''); setDonationId(''); }}>
            继续打赏
          </button>
        </>
      )}
    </div>
  );
}
