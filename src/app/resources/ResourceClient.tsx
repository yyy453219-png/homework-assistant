'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string;
  shape: string;
  sort_order: number;
  file_count: number;
  created_at: string;
}

interface FileInfo {
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
  categories: Category[];
  user: User | null;
  permissionMap: Record<string, boolean>;
}

const shapeLabels: Record<string, string> = {
  'corner-tl': '左上角标',
  'corner-tr': '右上角标',
  'corner-bl': '左下角标',
  'corner-br': '右下角标',
  'accent-bottom': '底部强调',
  'accent-left': '左侧强调',
  'diagonal': '对角标记',
  'cross': '十字标记',
};

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ResourceClient({ categories, user, permissionMap }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryFiles, setCategoryFiles] = useState<Record<string, FileInfo[]>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(fileId: string, fileName: string) {
    if (downloadingId === fileId) return;
    setDownloadingId(fileId);
    try {
      const res = await fetch(`/api/resources/download/${fileId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '下载失败');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('下载失败，请重试');
    }
    setDownloadingId(null);
  }

  async function toggleCategory(categoryId: string) {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(categoryId);

    // Fetch files if not already loaded
    if (!categoryFiles[categoryId]) {
      setLoadingFiles(true);
      try {
        const res = await fetch(`/api/resources/categories/${categoryId}`);
        const data = await res.json();
        if (data.files) {
          setCategoryFiles(prev => ({ ...prev, [categoryId]: data.files }));
        }
      } catch {
        // ignore errors
      }
      setLoadingFiles(false);
    }
  }

  const hasPermission = (categoryId: string) => {
    return user?.is_admin || permissionMap[categoryId];
  };

  return (
    <div>
      {categories.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--gray-200)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>暂无资料分类</p>
        </div>
      ) : (
        <div className="resource-grid">
          {categories.map(cat => (
            <div key={cat.id} style={{ cursor: 'pointer' }} onClick={() => toggleCategory(cat.id)}>
              <div
                className={`geo-block${cat.shape !== 'corner-tl' ? ` geo-shape-${cat.shape}` : ''}${cat.shape === 'accent-bottom' || cat.shape === 'accent-left' ? '' : ''}`}
                style={{
                  padding: '1.5rem',
                  transition: 'border-color 0.2s',
                  borderColor: expandedCategory === cat.id ? 'var(--black)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{cat.name}</h3>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--gray-400)',
                    whiteSpace: 'nowrap',
                  }}>
                    {cat.file_count} 个文件
                  </span>
                </div>
                {cat.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    {cat.description}
                  </p>
                )}
                <p style={{
                  fontSize: '0.65rem',
                  color: 'var(--gray-400)',
                  marginTop: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {shapeLabels[cat.shape] || cat.shape}
                </p>
              </div>

              {/* Expanded file list */}
              {expandedCategory === cat.id && (
                <div className="card" style={{
                  borderTop: 'none',
                  padding: '0',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {loadingFiles && !categoryFiles[cat.id] ? (
                    <p style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--gray-400)' }}>加载中...</p>
                  ) : categoryFiles[cat.id]?.length > 0 ? (
                    <div>
                      {categoryFiles[cat.id].map((f, i) => (
                        <div key={f.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderBottom: i < categoryFiles[cat.id].length - 1 ? '1px solid var(--gray-100)' : 'none',
                          fontSize: '0.85rem',
                        }}>
                          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.original_name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                            {formatSize(f.file_size)}
                          </span>
                          {hasPermission(cat.id) ? (
                            <button onClick={() => handleDownload(f.id, f.original_name)}
                              disabled={downloadingId === f.id}
                              className="btn btn-accent btn-sm"
                              style={{
                                fontSize: '0.7rem', padding: '0.25rem 0.75rem',
                                textDecoration: 'none', border: 'none', cursor: downloadingId === f.id ? 'not-allowed' : 'pointer',
                                opacity: downloadingId === f.id ? 0.6 : 1, fontFamily: 'inherit',
                              }}>
                              {downloadingId === f.id ? '下载中...' : '下载'}
                            </button>
                          ) : user ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
                              暂无权限
                            </span>
                          ) : (
                            <Link href="/login"
                              style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline' }}>
                              登录
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--gray-400)' }}>该分类暂无文件</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
