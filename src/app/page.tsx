import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="page">
      <Header user={user} />

      {/* HERO SECTION — deconstructivist headline */}
      <section style={{ padding: '6rem 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-number">[ 01 ]</span>
        <div className="step-text">
          <span className="line" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: '700', letterSpacing: '-0.04em' }}>
            不知道作业
          </span>
          <span className="line" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: '700', letterSpacing: '-0.04em' }}>
            怎么下手？
          </span>
          <span className="line" style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: '400', color: 'var(--gray-400)', marginTop: '1.5rem' }}>
            上传作业要求，获取完成文档
          </span>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/submit" className="btn btn-primary">
            立即提交需求 →
          </Link>
          <Link href="/orders" className="btn btn-outline">
            我的订单
          </Link>
        </div>
      </section>

      <div className="thin-divider" style={{ maxWidth: '1200px', margin: '0 auto' }} />

      {/* SERVICE TYPES */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-number">[ 02 ]</span>
        <h2 style={{ marginBottom: '2.5rem' }}>可提供服务</h2>
        <div className="asymmetric-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { num: '01', label: '作业思路解析' },
              { num: '02', label: '论文/报告提纲' },
              { num: '03', label: 'PPT结构建议' },
              { num: '04', label: '资料整理文档' },
              { num: '05', label: '初稿修改建议' },
              { num: '06', label: '格式规范检查' },
              { num: '07', label: '编程作业解析' },
              { num: '08', label: '习题思路讲解' },
            ].map((s, i) => (
              <div key={s.num} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 0',
                borderBottom: i < 7 ? '1px solid var(--gray-100)' : 'none',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gray-400)', minWidth: '2rem' }}>
                  {s.num}
                </span>
                <span style={{ fontSize: '1rem' }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="geo-block" style={{ alignSelf: 'flex-start' }}>
            <span className="section-number" style={{ marginBottom: '0.5rem' }}>价格</span>
            <div className="price-large">
              <span className="currency">¥</span>15
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
              加急服务 25 元
            </p>
          </div>
        </div>
      </section>

      <div className="thin-divider" style={{ maxWidth: '1200px', margin: '0 auto' }} />

      {/* HOW IT WORKS */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-number">[ 03 ]</span>
        <h2 style={{ marginBottom: '2.5rem' }}>服务流程</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', title: '提交需求', desc: '填写课程名称、作业类型，上传作业要求文件' },
            { step: '02', title: '确认付款', desc: '确认价格和服务内容，通过微信扫码付款' },
            { step: '03', title: '等待交付', desc: '平台制作完成后，订单状态更新为已交付' },
            { step: '04', title: '下载文档', desc: '在订单详情页下载完成文档，作业搞定' },
          ].map((s) => (
            <div key={s.step} className="card" style={{ position: 'relative', paddingTop: '3rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--gray-100)',
                position: 'absolute',
                top: '0.75rem',
                right: '1rem',
                lineHeight: 1,
              }}>
                {s.step}
              </span>
              <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <div className="thin-divider" style={{ maxWidth: '1200px', margin: '0 auto' }} />
      <section style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-number">[ 04 ]</span>
        <h2 style={{ marginBottom: '2.5rem' }}>价格说明</h2>
        <div className="offset-grid" style={{ gap: '2rem' }}>
          <div>
            <div className="geo-block" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>标准服务</p>
              <div className="price-large">
                <span className="currency">¥</span>15
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.75rem' }}>
                24-48小时交付
              </p>
            </div>
          </div>
          <div>
            <div className="geo-block" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>加急服务</p>
              <div className="price-large">
                <span className="currency">¥</span>25
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.75rem' }}>
                6-12小时交付
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DECLARATION */}
      <div className="thin-divider" style={{ maxWidth: '1200px', margin: '0 auto' }} />
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-number">[ 05 ]</span>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', lineHeight: 1.8, maxWidth: '640px' }}>
          本平台提供作业思路解析、框架搭建、资料整理、格式检查等服务。
          用户需遵守学术规范，最终作业内容由用户本人独立完成并承担责任。
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link href="/login" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
            开始使用 →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--gray-100)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--gray-400)',
      }}>
        <p>作业完成助手 · 学习辅导平台</p>
      </footer>
    </div>
  );
}
