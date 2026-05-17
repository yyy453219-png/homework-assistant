'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusLabels: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  processing: '处理中',
  need_info: '待补充资料',
  delivered: '已交付',
  completed: '已完成',
  refunded: '已退款',
  cancelled: '已取消',
};

interface Order {
  id: string;
  course_name: string;
  homework_type: string;
  service_type: string;
  description: string;
  current_status: string;
  expected_help: string;
  is_urgent: number;
  deadline: string;
  price: number;
  paid_amount: number;
  status: string;
  admin_note: string;
  created_at: string;
  paid_at: string;
  delivered_at: string;
}

interface FileItem {
  id: string;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface User {
  id: string;
  nickname: string;
  is_admin: number;
}

interface Props {
  order: Order;
  files: FileItem[];
  deliveries: FileItem[];
  payments: any[];
  user: User;
}

function FileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return '🖼️';
  if (['doc', 'docx'].includes(ext || '')) return '📝';
  if (['pdf'].includes(ext || '')) return '📄';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
  if (['ppt', 'pptx'].includes(ext || '')) return '📽️';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
  if (['py', 'js', 'ts', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext || '')) return '💻';
  return '📎';
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function OrderDetailClient({ order, files, deliveries, payments, user }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentNotified, setPaymentNotified] = useState(false);

  async function handlePaymentConfirm() {
    setConfirming(true);
    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentNotified(true);
        setMessage(data.message || '已通知管理员，请等待确认');
        router.refresh();
      } else {
        setMessage(data.error || '确认失败，请重试');
      }
    } catch {
      setMessage('网络错误');
    }
    setConfirming(false);
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link href="/orders" style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
        ← 返回订单列表
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <span className="section-number">[ 订单详情 ]</span>
          <h1 style={{ fontSize: '1.75rem' }}>{order.course_name}</h1>
        </div>
        <span className={`badge ${order.status === 'delivered' || order.status === 'completed' ? 'badge-success' : order.status === 'pending_payment' ? 'badge-warning' : ''}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      {/* Payment Section */}
      {order.status === 'pending_payment' && !paymentNotified && (
        <div className="geo-block" style={{ marginBottom: '2rem' }}>
          <span className="section-number" style={{ marginBottom: '0.5rem' }}>付款</span>
          <h2 style={{ marginBottom: '0.5rem' }}>
            <span className="currency" style={{ fontSize: '1rem', verticalAlign: 'super' }}>¥</span>
            {order.price}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
            请扫描以下二维码付款，付款后点击确认
          </p>
          <div style={{
            width: '200px', height: '200px',
            background: 'var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
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
          <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            应付金额：<strong>¥{order.price}</strong> · 请支付正确金额，管理员会核实确认
          </p>
          <button className="btn btn-primary btn-sm" onClick={handlePaymentConfirm} disabled={confirming}>
            {confirming ? '确认中...' : '我已付款'}
          </button>
          {message && <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>{message}</p>}
        </div>
      )}

      {paymentNotified && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: '#2a9d8f' }}>
          <p style={{ fontSize: '0.85rem', color: '#2a9d8f', marginBottom: '0.25rem' }}>
            ✅ 已通知管理员你已付款
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            管理员核实金额后会更新订单状态，请耐心等待
          </p>
        </div>
      )}

      {/* Order Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>订单编号</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{order.id.slice(0, 8)}...</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>服务类型</p>
            <p>{order.service_type}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>作业类型</p>
            <p>{order.homework_type}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>提交时间</p>
            <p>{order.created_at}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>价格</p>
            <p style={{ fontWeight: '600' }}>¥{order.price}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>加急</p>
            <p>{order.is_urgent ? '是' : '否'}</p>
          </div>
        </div>
        {order.paid_amount > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            已付金额：¥{order.paid_amount}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>作业要求描述</p>
        <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{order.description}</p>
      </div>

      {/* User Uploaded Files - with visual display */}
      {files.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>
            你上传的附件（{files.length} 个文件）
          </p>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--gray-100)',
              fontSize: '0.85rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{FileIcon(f.original_name)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.original_name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                {formatSize(f.file_size)}
              </span>
              <Link href={`/api/download/${f.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
                下载
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Deliveries - with admin upload display */}
      {deliveries.length > 0 && (
        <div className="geo-block" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '0.75rem', fontWeight: '600' }}>
            交付文档（{deliveries.length} 个文件）
          </p>
          {deliveries.map(d => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--gray-100)',
              fontSize: '0.85rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{FileIcon(d.original_name)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.original_name}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                {formatSize(d.file_size)}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>
                {d.uploaded_at}
              </span>
              <Link href={`/api/download/${d.id}`} className="btn btn-accent btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
                下载
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Admin Note */}
      {order.admin_note && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--gray-50)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>管理员备注</p>
          <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{order.admin_note}</p>
        </div>
      )}

      {/* Customer Service */}
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>需要帮助？联系客服</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>微信：请添加客服微信号</p>
      </div>
    </div>
  );
}
