'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

const statusFlow = ['pending_payment', 'paid', 'processing', 'delivered', 'completed'];

interface Order {
  id: string;
  user_id: string;
  nickname: string;
  course_name: string;
  homework_type: string;
  service_type: string;
  description: string;
  current_status: string;
  is_urgent: number;
  price: number;
  status: string;
  admin_note: string;
  created_at: string;
  paid_at: string;
  delivered_at: string;
}

interface User {
  id: string;
  nickname: string;
  is_admin: number;
}

interface Props {
  orders: Order[];
  users: any[];
  user: User;
}

export default function AdminClient({ orders, users, user }: Props) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState<'orders' | 'users'>('orders');

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div style={{
        background: 'var(--gray-50)',
        borderRight: '1px solid var(--gray-200)',
        padding: '2rem 1.5rem',
      }}>
        <Link href="/" style={{ fontSize: '1rem', fontWeight: '600', textDecoration: 'none', color: 'var(--black)', display: 'block', marginBottom: '2rem' }}>
          作业完成助手
        </Link>
        <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '600', marginBottom: '1.5rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          管理后台
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setTab('orders')} style={{
            textAlign: 'left', padding: '0.5rem 0', background: 'none', border: 'none',
            fontSize: '0.875rem', cursor: 'pointer', color: tab === 'orders' ? 'var(--black)' : 'var(--gray-500)',
            fontWeight: tab === 'orders' ? '600' : '400',
          }}>
            订单管理
          </button>
          <button onClick={() => setTab('users')} style={{
            textAlign: 'left', padding: '0.5rem 0', background: 'none', border: 'none',
            fontSize: '0.875rem', cursor: 'pointer', color: tab === 'users' ? 'var(--black)' : 'var(--gray-500)',
            fontWeight: tab === 'users' ? '600' : '400',
          }}>
            用户管理
          </button>
        </nav>
      </div>

      {/* Main */}
      <div style={{ padding: '2rem 1.5rem' }}>
        {tab === 'orders' && (
          <>
            <h2 style={{ marginBottom: '1.5rem' }}>订单管理</h2>

            {/* Status Filter */}
            <div className="status-flow" style={{ marginBottom: '1.5rem' }}>
              {['all', 'pending_payment', 'paid', 'processing', 'need_info', 'delivered', 'completed', 'refunded'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '0.375rem 0.875rem',
                  fontSize: '0.75rem',
                  border: `1px solid ${statusFilter === s ? 'var(--black)' : 'var(--gray-200)'}`,
                  background: statusFilter === s ? 'var(--black)' : 'transparent',
                  color: statusFilter === s ? 'var(--white)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>
                  {s === 'all' ? '全部' : statusLabels[s]}
                </button>
              ))}
            </div>

            {/* Orders table */}
            {selectedOrder ? (
              <OrderDetailPanel
                order={selectedOrder}
                onBack={() => setSelectedOrder(null)}
                onUpdate={() => router.refresh()}
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>课程</th>
                      <th>服务</th>
                      <th>金额</th>
                      <th>状态</th>
                      <th>时间</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontSize: '0.8rem' }}>{o.nickname}</td>
                        <td style={{ fontSize: '0.85rem' }}>{o.course_name}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{o.service_type}</td>
                        <td>¥{o.price}</td>
                        <td>
                          <span className={`badge ${o.status === 'delivered' || o.status === 'completed' ? 'badge-success' : o.status === 'pending_payment' ? 'badge-warning' : ''}`}
                            style={{ fontSize: '0.65rem' }}>
                            {statusLabels[o.status]}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.created_at}</td>
                        <td>
                          <button onClick={() => setSelectedOrder(o)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'users' && (
          <>
            <h2 style={{ marginBottom: '1.5rem' }}>用户管理</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>昵称</th>
                    <th>邀请码</th>
                    <th>手机</th>
                    <th>学校</th>
                    <th>注册时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td style={{ fontSize: '0.85rem', fontWeight: '500' }}>{u.nickname}</td>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{u.invite_code}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{u.phone || '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{u.school || '-'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{u.created_at}</td>
                      <td>
                        {u.is_blocked ? (
                          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>已禁用</span>
                        ) : (
                          <span className="badge badge-success">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Order detail panel in admin (inline)
function OrderDetailPanel({ order, onBack, onUpdate }: { order: Order; onBack: () => void; onUpdate: () => void }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [note, setNote] = useState(order.admin_note || '');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleStatusChange(status: string) {
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, status }),
    });
    if (res.ok) {
      setNewStatus(status);
      setMessage('状态已更新');
      onUpdate();
    } else {
      setMessage('更新失败');
    }
  }

  async function handleSaveNote() {
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, admin_note: note }),
    });
    if (res.ok) {
      setMessage('备注已保存');
      onUpdate();
    } else {
      setMessage('保存失败');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setMessage('请先选择文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage('文件超过 50MB 限制');
      return;
    }

    setUploading(true);
    setMessage('上传中...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', order.id);
    formData.append('is_delivery', '1');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 文件上传成功：${file.name}`);
        onUpdate();
      } else {
        setMessage(`❌ 上传失败：${data.error || res.statusText}`);
      }
    } catch (err) {
      setMessage(`❌ 网络错误：无法连接到服务器`);
    }
    setUploading(false);
    // Reset file input
    e.target.value = '';
  }

  return (
    <div>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: '0.8rem',
        color: 'var(--gray-500)', cursor: 'pointer', padding: 0,
        marginBottom: '1.5rem', fontFamily: 'inherit',
      }}>
        ← 返回列表
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3>{order.course_name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{order.nickname} · {order.service_type}</p>
        </div>
        <span className={`badge ${order.status === 'delivered' || order.status === 'completed' ? 'badge-success' : order.status === 'pending_payment' ? 'badge-warning' : ''}`}>
          {statusLabels[newStatus]}
        </span>
      </div>

      {/* Order Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div><span style={{ color: 'var(--gray-400)' }}>订单ID:</span> {order.id.slice(0, 12)}...</div>
          <div><span style={{ color: 'var(--gray-400)' }}>价格:</span> ¥{order.price}</div>
          <div><span style={{ color: 'var(--gray-400)' }}>提交时间:</span> {order.created_at}</div>
          <div><span style={{ color: 'var(--gray-400)' }}>加急:</span> {order.is_urgent ? '是' : '否'}</div>
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>作业要求</p>
        <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{order.description}</p>
        {order.current_status && (
          <>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '1rem', marginBottom: '0.25rem' }}>当前完成情况</p>
            <p style={{ fontSize: '0.85rem' }}>{order.current_status}</p>
          </>
        )}
      </div>

      {/* Status Control */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>订单状态</p>
        <div className="status-flow">
          {statusFlow.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              disabled={s === newStatus}
              style={{
                padding: '0.375rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer',
                border: `1px solid ${s === newStatus ? 'var(--black)' : 'var(--gray-200)'}`,
                background: s === newStatus ? 'var(--black)' : 'transparent',
                color: s === newStatus ? 'var(--white)' : 'var(--gray-600)',
                fontFamily: 'inherit',
              }}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Delivery */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>上传交付文档</p>
        <input type="file" onChange={handleFileUpload} disabled={uploading}
          style={{ fontSize: '0.8rem' }} />
        {uploading && <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>上传中...</p>}
      </div>

      {/* Admin Note */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>管理员备注</p>
        <textarea className="input" value={note} onChange={e => setNote(e.target.value)}
          style={{ minHeight: '80px', marginBottom: '0.75rem' }} />
        <button className="btn btn-outline btn-sm" onClick={handleSaveNote}>保存备注</button>
      </div>

      {message && <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>{message}</p>}
    </div>
  );
}
