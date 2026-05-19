'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploadZone, { FileListDisplay } from '@/components/FileUploadZone';
import FilePreviewModal from '@/components/FilePreviewModal';

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
  paid_amount: number;
  status: string;
  admin_note: string;
  created_at: string;
  paid_at: string;
  delivered_at: string;
  download_allowed: number;
}

interface User {
  id: string;
  nickname: string;
  is_admin: number;
}

interface FileInfo {
  id: string;
  original_name: string;
  file_size: number;
  uploaded_at: string;
  is_delivery: number;
}

interface Props {
  orders: Order[];
  users: any[];
  user: User;
  resourceCategories: any[];
  allPermissions: any[];
}

export default function AdminClient({ orders, users, user, resourceCategories, allPermissions }: Props) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState<'orders' | 'users' | 'resources'>('orders');
  const [orderFiles, setOrderFiles] = useState<FileInfo[]>([]);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="admin-layout">
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
            fontWeight: tab === 'orders' ? '600' : '400', fontFamily: 'inherit',
          }}>
            订单管理
          </button>
          <button onClick={() => setTab('users')} style={{
            textAlign: 'left', padding: '0.5rem 0', background: 'none', border: 'none',
            fontSize: '0.875rem', cursor: 'pointer', color: tab === 'users' ? 'var(--black)' : 'var(--gray-500)',
            fontWeight: tab === 'users' ? '600' : '400', fontFamily: 'inherit',
          }}>
            用户管理
          </button>
          <button onClick={() => setTab('resources')} style={{
            textAlign: 'left', padding: '0.5rem 0', background: 'none', border: 'none',
            fontSize: '0.875rem', cursor: 'pointer', color: tab === 'resources' ? 'var(--black)' : 'var(--gray-500)',
            fontWeight: tab === 'resources' ? '600' : '400', fontFamily: 'inherit',
          }}>
            资源管理
          </button>
        </nav>
      </div>

      <div style={{ padding: '2rem 1.5rem' }}>
        {tab === 'orders' && (
          <>
            <h2 style={{ marginBottom: '1.5rem' }}>订单管理</h2>
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
                      <th>打赏</th>
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
                        <td>¥{o.paid_amount || 0}</td>
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

        {tab === 'resources' && (
          <ResourceAdminPanel
            categories={resourceCategories}
            users={users}
            allPermissions={allPermissions}
          />
        )}
      </div>
    </div>
  );
}

// Resource Library Admin Panel
function ResourceAdminPanel({ categories: initialCategories, users, allPermissions: initialPermissions }: {
  categories: any[];
  users: any[];
  allPermissions: any[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [permissions, setPermissions] = useState(initialPermissions);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatShape, setNewCatShape] = useState('corner-tl');
  const [newCatOrder, setNewCatOrder] = useState('0');
  const [catMessage, setCatMessage] = useState('');

  // File upload state
  const [selectedCatForUpload, setSelectedCatForUpload] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [catFiles, setCatFiles] = useState<any[]>([]);

  // Permission state
  const [permUser, setPermUser] = useState('');
  const [permCat, setPermCat] = useState('');
  const [permMessage, setPermMessage] = useState('');

  async function createCategory() {
    if (!newCatName.trim()) { setCatMessage('请输入分类名称'); return; }
    const res = await fetch('/api/resources/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCatName,
        description: newCatDesc,
        shape: newCatShape,
        sort_order: parseInt(newCatOrder) || 0,
      }),
    });
    if (res.ok) {
      setCatMessage('✅ 分类已创建');
      setNewCatName(''); setNewCatDesc(''); setNewCatShape('corner-tl'); setNewCatOrder('0');
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    } else {
      const data = await res.json();
      setCatMessage(`❌ ${data.error || '创建失败'}`);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('确定要删除该分类及其所有文件？')) return;
    const res = await fetch(`/api/resources/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCatMessage('✅ 分类已删除');
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    } else {
      setCatMessage('❌ 删除失败');
    }
  }

  async function loadFiles(categoryId: string) {
    if (!categoryId) { setCatFiles([]); return; }
    const res = await fetch(`/api/resources/categories/${categoryId}`);
    const data = await res.json();
    setCatFiles(data.files || []);
  }

  async function handleUploadFiles(files: File[]) {
    if (!selectedCatForUpload) { setUploadMessage('请先选择分类'); return; }
    setUploading(true);
    setUploadMessage('上传中...');
    const formData = new FormData();
    for (const f of files) formData.append('files[]', f);
    formData.append('category_id', selectedCatForUpload);
    try {
      const res = await fetch('/api/resources/files', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage(`✅ 成功上传 ${data.count} 个文件`);
        loadFiles(selectedCatForUpload);
        router.refresh();
      } else {
        setUploadMessage(`❌ ${data.error || '上传失败'}`);
      }
    } catch {
      setUploadMessage('❌ 网络错误');
    }
    setUploading(false);
  }

  async function deleteResourceFile(fileId: string) {
    if (!confirm('确定要删除该文件？')) return;
    const res = await fetch(`/api/resources/files/${fileId}`, { method: 'DELETE' });
    if (res.ok) {
      setUploadMessage('✅ 文件已删除');
      loadFiles(selectedCatForUpload);
    } else {
      setUploadMessage('❌ 删除失败');
    }
  }

  async function grantPermission() {
    if (!permUser || !permCat) { setPermMessage('请选择用户和分类'); return; }
    const res = await fetch('/api/resources/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: permUser, categoryId: permCat }),
    });
    if (res.ok) {
      setPermMessage('✅ 权限已授予');
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    } else {
      setPermMessage('❌ 授权失败');
    }
  }

  async function revokePermission(userId: string, categoryId: string) {
    const res = await fetch('/api/resources/permissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, categoryId }),
    });
    if (res.ok) {
      setPermMessage('✅ 权限已撤销');
      router.refresh();
      setTimeout(() => window.location.reload(), 500);
    } else {
      setPermMessage('❌ 撤销失败');
    }
  }

  const shapeOptions = [
    { value: 'corner-tl', label: '左上角标' },
    { value: 'corner-tr', label: '右上角标' },
    { value: 'corner-bl', label: '左下角标' },
    { value: 'corner-br', label: '右下角标' },
    { value: 'accent-bottom', label: '底部强调' },
    { value: 'accent-left', label: '左侧强调' },
    { value: 'diagonal', label: '对角标记' },
    { value: 'cross', label: '十字标记' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>资源管理</h2>

      {/* A. Category Management */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem', fontWeight: '600' }}>
          分类管理
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: '1', minWidth: '140px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>名称</span>
            <input className="input" value={newCatName} onChange={e => setNewCatName(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} placeholder="分类名称" />
          </div>
          <div style={{ flex: '1', minWidth: '140px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>描述</span>
            <input className="input" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} placeholder="可选" />
          </div>
          <div style={{ minWidth: '120px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>形状</span>
            <select className="select-input" value={newCatShape} onChange={e => setNewCatShape(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}>
              {shapeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ width: '80px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>排序</span>
            <input className="input" type="number" value={newCatOrder} onChange={e => setNewCatOrder(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
          </div>
          <button className="btn btn-accent btn-sm" onClick={createCategory}>创建分类</button>
        </div>
        {catMessage && <p style={{ fontSize: '0.8rem', color: catMessage.startsWith('✅') ? '#2a9d8f' : 'var(--accent)' }}>{catMessage}</p>}

        {categories.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>形状</th>
                  <th>文件数</th>
                  <th>排序</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: any) => (
                  <tr key={cat.id}>
                    <td style={{ fontSize: '0.85rem' }}>{cat.name}</td>
                    <td style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{shapeOptions.find(o => o.value === cat.shape)?.label || cat.shape}</td>
                    <td style={{ fontSize: '0.8rem' }}>{cat.file_count}</td>
                    <td style={{ fontSize: '0.8rem' }}>{cat.sort_order}</td>
                    <td>
                      <button onClick={() => deleteCategory(cat.id)}
                        className="btn btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', border: '1px solid var(--gray-200)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* B. File Management */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem', fontWeight: '600' }}>
          文件管理
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>选择分类</span>
          <select className="select-input" value={selectedCatForUpload} onChange={e => {
            setSelectedCatForUpload(e.target.value);
            loadFiles(e.target.value);
          }} style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem', maxWidth: '300px' }}>
            <option value="">-- 请选择 --</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name} ({cat.file_count} 个文件)</option>
            ))}
          </select>
        </div>

        {selectedCatForUpload && (
          <>
            <FileUploadZone
              onFilesSelected={handleUploadFiles}
              label="拖拽文件到此处上传到该分类"
            />
            {uploading && <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>上传中...</p>}
            {uploadMessage && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: uploadMessage.startsWith('✅') ? '#2a9d8f' : 'var(--accent)' }}>{uploadMessage}</p>}

            {catFiles.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>
                  已上传文件（{catFiles.length} 个）：
                </p>
                {catFiles.map((f: any, i: number) => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--gray-100)',
                    fontSize: '0.8rem',
                  }}>
                    <span style={{ flex: 1 }}>{f.original_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                      {f.file_size > 0 ? `${(f.file_size / 1024).toFixed(1)} KB` : '0 B'}
                    </span>
                    <button onClick={() => deleteResourceFile(f.id)}
                      style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* C. Permission Management */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem', fontWeight: '600' }}>
          下载权限管理
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ minWidth: '160px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>用户</span>
            <select className="select-input" value={permUser} onChange={e => setPermUser(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}>
              <option value="">-- 请选择 --</option>
              {users.filter((u: any) => !u.is_blocked).map((u: any) => (
                <option key={u.id} value={u.id}>{u.nickname}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', display: 'block', marginBottom: '0.25rem' }}>分类</span>
            <select className="select-input" value={permCat} onChange={e => setPermCat(e.target.value)}
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}>
              <option value="">-- 请选择 --</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-accent btn-sm" onClick={grantPermission}>授予权限</button>
        </div>
        {permMessage && <p style={{ fontSize: '0.8rem', color: permMessage.startsWith('✅') ? '#2a9d8f' : 'var(--accent)' }}>{permMessage}</p>}

        {permissions.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>分类</th>
                  <th>授予时间</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.85rem' }}>{p.user_name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.category_name}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{p.created_at}</td>
                    <td>
                      <button onClick={() => revokePermission(p.user_id, p.category_id)}
                        className="btn btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', border: '1px solid var(--gray-200)', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--accent)' }}>
                        撤销
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Order detail panel in admin
function OrderDetailPanel({ order, onBack, onUpdate }: { order: Order; onBack: () => void; onUpdate: () => void }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [note, setNote] = useState(order.admin_note || '');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<{ name: string; id: string }[]>([]);
  const [userFiles, setUserFiles] = useState<{ name: string; id: string }[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string } | null>(null);

  const [downloadAllowed, setDownloadAllowed] = useState(order.download_allowed ? true : false);

  // Load files on mount
  useState(() => {
    fetch(`/api/orders/${order.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.deliveries) setDeliveryFiles(data.deliveries.map((f: any) => ({ name: f.original_name, id: f.id })));
        if (data.files) setUserFiles(data.files.map((f: any) => ({ name: f.original_name, id: f.id })));
      })
      .catch(() => {});
  });

  async function handleStatusChange(status: string) {
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, status }),
    });
    if (res.ok) {
      setNewStatus(status);
      setMessage('✅ 状态已更新');
      onUpdate();
    } else {
      setMessage('❌ 更新失败');
    }
  }

  async function handleSaveNote() {
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, admin_note: note }),
    });
    if (res.ok) {
      setMessage('✅ 备注已保存');
      onUpdate();
    } else {
      setMessage('❌ 保存失败');
    }
  }

  async function handleToggleDownload() {
    const newValue = !downloadAllowed;
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, downloadAllowed: newValue }),
    });
    if (res.ok) {
      setDownloadAllowed(newValue);
      setMessage(newValue ? '✅ 已授权用户下载' : '✅ 已撤销下载权限');
      onUpdate();
    } else {
      setMessage('❌ 更新失败');
    }
  }

  async function handleFilesSelected(files: File[]) {
    setUploading(true);
    setMessage('上传中...');

    const formData = new FormData();
    for (const file of files) {
      formData.append('files[]', file);
    }
    formData.append('order_id', order.id);
    formData.append('is_delivery', '1');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 成功上传 ${data.count} 个文件`);
        setDeliveryFiles(prev => [...prev, ...data.files]);
        onUpdate();
      } else {
        setMessage(`❌ 上传失败：${data.error || res.statusText}`);
      }
    } catch {
      setMessage('❌ 网络错误');
    }
    setUploading(false);
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
          <div><span style={{ color: 'var(--gray-400)' }}>打赏金额:</span> ¥{order.paid_amount || 0}</div>
          <div><span style={{ color: 'var(--gray-400)' }}>提交时间:</span> {order.created_at}</div>
          <div><span style={{ color: 'var(--gray-400)' }}>加急:</span> {order.is_urgent ? '是' : '否'}</div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: 'var(--gray-400)' }}>订单ID:</span>{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{order.id}</span>
          </div>
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

      {/* User Uploaded Files */}
      {userFiles.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>
            用户上传的附件（{userFiles.length} 个）
          </p>
          {userFiles.map((f, i) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0', borderBottom: '1px solid var(--gray-100)',
              fontSize: '0.85rem',
            }}>
              <span>📎</span>
              <span>{f.name}</span>
              <button onClick={() => setPreviewFile({ id: f.id, name: f.name })}
                style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                预览
              </button>
              <Link href={`/api/download/${f.id}`} style={{
                marginLeft: '1rem', fontSize: '0.7rem', color: 'var(--gray-500)',
                textDecoration: 'underline',
              }}>
                下载
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Payment Recording */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem', fontWeight: '600' }}>
          收款记录
        </p>
        <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <div>已收金额：<strong>¥{order.paid_amount || 0}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem' }}>本次收款：</span>
          <input type="number" className="input" value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            style={{ width: '120px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
            placeholder="金额" min="0" />
          <button className="btn btn-accent btn-sm" onClick={async () => {
            const amount = parseFloat(payAmount);
            if (!amount || amount <= 0) { setMessage('请输入有效金额'); return; }
            const res = await fetch('/api/admin/orders', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, paidAmount: amount }),
            });
            if (res.ok) {
              setPayAmount('');
              setMessage(`✅ 已收款 ¥${amount}`);
              onUpdate();
              setTimeout(() => window.location.reload(), 500);
            } else {
              setMessage('❌ 记录失败');
            }
          }}>确认收款</button>
        </div>
      </div>

      {/* Download Authorization */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>下载授权</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem' }}>
            当前状态：
            <strong style={{ color: downloadAllowed ? '#2a9d8f' : 'var(--accent)' }}>
              {downloadAllowed ? '已授权' : '未授权'}
            </strong>
          </span>
          <button className={`btn btn-sm ${downloadAllowed ? 'btn-outline' : 'btn-accent'}`}
            onClick={handleToggleDownload}
            style={{ fontFamily: 'inherit' }}>
            {downloadAllowed ? '撤销授权' : '授权下载'}
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
          授权后用户可在订单详情页下载交付文件
        </p>
      </div>

      {/* Status Control */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>订单状态流转</p>
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

      {/* Upload Delivery Files - with drag & drop */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>
          上传交付文档（拖拽或点击选择，支持多文件和文件夹）
        </p>
        <FileUploadZone
          onFilesSelected={handleFilesSelected}
          label="拖拽交付文档到此处"
        />

        {/* Admin uploaded delivery files */}
        {deliveryFiles.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>
              已上传的交付文档（{deliveryFiles.length} 个）：
            </p>
            {deliveryFiles.map((f, i) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--gray-100)',
                fontSize: '0.8rem',
              }}>
                <span>📦</span>
                <span style={{ flex: 1 }}>{f.name}</span>
                <button onClick={() => setPreviewFile({ id: f.id, name: f.name })}
                  style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginRight: '0.5rem' }}>
                  预览
                </button>
                <Link href={`/api/download/${f.id}`} style={{
                  fontSize: '0.7rem', color: 'var(--gray-500)',
                }}>
                  下载
                </Link>
              </div>
            ))}
          </div>
        )}
        {uploading && <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>上传中...</p>}
      </div>

      {/* Admin Note */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.5rem' }}>管理员备注</p>
        <textarea className="input" value={note} onChange={e => setNote(e.target.value)}
          style={{ minHeight: '80px', marginBottom: '0.75rem' }} />
        <button className="btn btn-outline btn-sm" onClick={handleSaveNote}>保存备注</button>
      </div>

      {message && (
        <p style={{
          fontSize: '0.8rem', marginTop: '0.5rem',
          color: message.startsWith('✅') ? '#2a9d8f' : message.startsWith('❌') ? 'var(--accent)' : 'var(--gray-500)',
        }}>
          {message}
        </p>
      )}

      <FilePreviewModal
        fileId={previewFile?.id || ''}
        fileName={previewFile?.name || ''}
        visible={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
