'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUploadZone, { FileListDisplay } from '@/components/FileUploadZone';

const SERVICE_TYPES = [
  '作业思路解析',
  '论文/报告提纲',
  'PPT结构建议',
  '资料整理',
  '初稿修改建议',
  '格式规范检查',
  '编程作业解析',
  '习题思路讲解',
];

const HOMEWORK_TYPES = [
  '普通作业',
  '论文/报告',
  'PPT',
  '编程作业',
  '习题',
  '其他',
];

export default function SubmitPage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState('');
  const [homeworkType, setHomeworkType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [expectedHelp, setExpectedHelp] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('请先同意服务声明');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: courseName,
          homework_type: homeworkType,
          service_type: serviceType,
          description,
          current_status: currentStatus,
          expected_help: expectedHelp,
          is_urgent: isUrgent,
          deadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '提交失败');
        setSubmitting(false);
        return;
      }

      // Upload files if any (batch upload)
      if (files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append('files[]', file);
        }
        formData.append('order_id', data.orderId);
        await fetch('/api/upload', { method: 'POST', body: formData });
      }

      setCreatedOrderId(data.orderId);
    } catch (err) {
      setError('网络错误，请重试');
    }
    setSubmitting(false);
  }

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (createdOrderId) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <span className="section-number">[ 成功 ]</span>
          <h1 style={{ marginBottom: '1rem' }}>需求已提交</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '2rem' }}>
            订单编号：{createdOrderId}<br />
            请等待平台处理，完成后会更新订单状态。
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href={`/order/${createdOrderId}`} className="btn btn-primary">
              查看订单
            </Link>
            <Link href="/orders" className="btn btn-outline">
              我的订单
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
          ← 返回首页
        </Link>
        <span className="section-number">[ 提交 ]</span>
        <h1 style={{ marginBottom: '2.5rem' }}>提交作业需求</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">课程名称</label>
            <input className="input" type="text" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="例如：高等数学" required />
          </div>

          <div className="form-group">
            <label className="label">作业类型</label>
            <select className="select-input" value={homeworkType} onChange={e => setHomeworkType(e.target.value)} required>
              <option value="">请选择</option>
              {HOMEWORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">服务类型</label>
            <select className="select-input" value={serviceType} onChange={e => setServiceType(e.target.value)} required>
              <option value="">请选择</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">作业要求描述</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="请详细描述作业的具体要求和内容..." required />
          </div>

          <div className="form-group">
            <label className="label">当前完成情况</label>
            <textarea className="input" value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} placeholder="目前写到什么程度了？遇到了什么问题？" />
          </div>

          <div className="form-group">
            <label className="label">希望获得什么帮助</label>
            <textarea className="input" value={expectedHelp} onChange={e => setExpectedHelp(e.target.value)} placeholder="需要重点解决哪些问题？" />
          </div>

          <div className="form-group">
            <label className="label">是否加急</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="urgent" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--black)' }} />
              <label htmlFor="urgent" style={{ fontSize: '0.875rem' }}>
                加急（6-12小时优先处理）
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="label">截止时间</label>
            <input className="input" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          {/* File Upload - Now with drag & drop, multi-file, folder support */}
          <div className="form-group">
            <label className="label">上传附件（作业要求文件）</label>
            <FileUploadZone
              onFilesSelected={handleFilesSelected}
              label="拖拽作业文件到此处，或点击选择"
            />
            <FileListDisplay
              files={files.map(f => ({ name: f.name, size: f.size }))}
              onRemove={removeFile}
            />
          </div>

          {/* Agreement */}
          <div className="form-group">
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--gray-200)' }}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', minWidth: '18px', accentColor: 'var(--black)', marginTop: '2px' }} />
              <label htmlFor="agree" style={{ fontSize: '0.75rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>
                我已知晓本平台提供作业思路解析、资料整理、框架建议等服务。最终作业内容由本人独立完成并遵守学术规范。
              </label>
            </div>
          </div>

          {error && <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </form>
      </div>
    </div>
  );
}
