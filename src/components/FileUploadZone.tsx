'use client';

import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress?: 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

interface Props {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  allowFolder?: boolean;
  maxSize?: number; // in bytes
  label?: string;
}

export default function FileUploadZone({ onFilesSelected, accept, multiple = true, allowFolder = true, maxSize = 50 * 1024 * 1024, label = '拖拽文件到此处，或点击选择' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [packing, setPacking] = useState(false);

  const processFiles = useCallback(async (fileList: FileList) => {
    // Check if files come from a folder (webkitRelativePath is set)
    const isFolder = fileList.length > 0 && fileList[0].webkitRelativePath !== '';

    if (isFolder) {
      // Collect folder files, preserving relative paths
      setPacking(true);
      try {
        const zip = new JSZip();

        let totalSize = 0;
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i];
          if (f.size > maxSize) {
            alert(`文件 ${f.name} 超过 ${maxSize / 1024 / 1024}MB 限制`);
            setPacking(false);
            return;
          }
          totalSize += f.size;
          // Use webkitRelativePath to preserve folder structure inside zip
          zip.file(f.webkitRelativePath, f);
        }

        if (totalSize > 500 * 1024 * 1024) {
          alert('文件夹总大小超过 500MB，请减小后重试');
          setPacking(false);
          return;
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Extract folder name from the first file's relative path
        const folderName = fileList[0].webkitRelativePath.split('/')[0] || 'folder';
        const zipFile = new File([zipBlob], `${folderName}.zip`, { type: 'application/zip' });

        onFilesSelected([zipFile]);
      } catch (err) {
        console.error('Zip error:', err);
        alert('打包文件夹失败，请尝试压缩为 ZIP 后直接上传');
      }
      setPacking(false);
    } else {
      const files: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.size > maxSize) {
          alert(`文件 ${f.name} 超过 ${maxSize / 1024 / 1024}MB 限制`);
          continue;
        }
        files.push(f);
      }
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  }, [maxSize, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `${dragOver ? '2px solid var(--accent)' : '1px dashed var(--gray-300)'}`,
          background: dragOver ? 'var(--gray-50)' : 'transparent',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderRadius: 0,
        }}
      >
        <div style={{ fontSize: '0.875rem', color: dragOver ? 'var(--accent)' : 'var(--gray-500)', marginBottom: '0.5rem' }}>
          {packing ? '正在打包文件夹...' : (dragOver ? '释放文件以上传' : label)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
          {packing ? '请稍候，文件夹压缩中' : `支持多个文件${allowFolder ? '和文件夹' : ''} · 每个最大 ${maxSize / 1024 / 1024}MB`}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept || '*'}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {allowFolder && (
        <input
          ref={folderInputRef}
          type="file"
          multiple
          // @ts-ignore
          webkitdirectory=""
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}

      {allowFolder && (
        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
            style={{
              background: 'none', border: 'none', fontSize: '0.75rem',
              color: 'var(--gray-400)', cursor: 'pointer', textDecoration: 'underline',
              fontFamily: 'inherit',
            }}
          >
            选择文件夹上传
          </button>
          {packing && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginLeft: '0.75rem' }}>
              正在打包文件夹...
            </span>
          )}
          <div style={{ fontSize: '0.65rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
            文件夹将自动打包为 ZIP 文件上传，内部目录结构保持不变
          </div>
        </div>
      )}
    </div>
  );
}

// File list display component
export function FileListDisplay({ files, onRemove, maxHeight }: {
  files: { id?: string; name: string; size?: number; isDelivery?: boolean }[];
  onRemove?: (index: number) => void;
  maxHeight?: string;
}) {
  if (files.length === 0) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const getIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return '🖼️';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
    if (['ppt', 'pptx'].includes(ext || '')) return '📽️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
    if (['py', 'js', 'ts', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext || '')) return '💻';
    return '📎';
  };

  return (
    <div style={{ maxHeight: maxHeight || '300px', overflowY: 'auto', marginTop: '0.75rem' }}>
      {files.map((f, i) => (
        <div key={f.id || i} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--gray-100)',
          fontSize: '0.85rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{getIcon(f.name)}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.name}
            {f.isDelivery && (
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', marginLeft: '0.5rem', border: '1px solid var(--accent)', padding: '0 0.35rem' }}>
                交付
              </span>
            )}
          </span>
          {f.size && (
            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
              {formatSize(f.size)}
            </span>
          )}
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.85rem', fontFamily: 'inherit' }}>
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
