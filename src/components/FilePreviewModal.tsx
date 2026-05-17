'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface FilePreviewModalProps {
  fileId: string;
  fileName: string;
  visible: boolean;
  onClose: () => void;
}

export default function FilePreviewModal({ fileId, fileName, visible, onClose }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPpt, setIsPpt] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pptContainerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);

  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const loadFile = useCallback(async () => {
    setLoading(true);
    setError('');
    setHtmlContent('');
    setImageUrl('');
    setIsPpt(false);

    try {
      const res = await fetch(`/api/download/${fileId}`);
      if (!res.ok) throw new Error('文件加载失败');
      const arrayBuffer = await res.arrayBuffer();

      // Image preview
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setLoading(false);
        return;
      }

      // PDF preview
      if (ext === 'pdf') {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setLoading(false);
        return;
      }

      // DOCX preview
      if (['doc', 'docx'].includes(ext)) {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        setLoading(false);
        return;
      }

      // PPTX preview
      if (['ppt', 'pptx'].includes(ext)) {
        setIsPpt(true);
        // Wait for the DOM container to be available, then render
        setTimeout(async () => {
          if (!pptContainerRef.current) {
            setLoading(false);
            setError('PPT 预览容器未就绪');
            return;
          }
          try {
            const pptxPreview = await import('pptx-preview');
            // Clear container
            pptContainerRef.current.innerHTML = '';
            const previewer = pptxPreview.init(pptContainerRef.current, { mode: 'slide' });
            previewerRef.current = previewer;
            await previewer.preview(arrayBuffer);
          } catch (e: any) {
            setError('PPT 解析失败：' + (e.message || ''));
          }
          setLoading(false);
        }, 50);
        return;
      }

      setError('暂不支持预览此文件类型');
    } catch (e: any) {
      setError(e.message || '预览加载失败');
    }
    setLoading(false);
  }, [fileId, fileName, ext]);

  // Reset and load when modal opens
  useEffect(() => {
    if (visible) {
      loadFile();
    }
    // Cleanup
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (previewerRef.current) {
        try { previewerRef.current.destroy(); } catch {}
        previewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Keyboard support
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  if (!visible) return null;

  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--white)',
        width: '100%', maxWidth: '900px',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--gray-200)',
        }}>
          <span style={{
            fontSize: '0.85rem', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {fileName}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--gray-500)', lineHeight: 1,
            fontFamily: 'inherit', padding: '0.25rem', marginLeft: '1rem',
          }}>
            ✕
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              加载中...
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent)' }}>
              ❌ {error}
            </div>
          )}

          {/* Image preview */}
          {imageUrl && isImage && !loading && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <img src={imageUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
          )}

          {/* PDF preview */}
          {imageUrl && isPdf && !loading && (
            <embed src={imageUrl} type="application/pdf" style={{ width: '100%', height: '75vh' }} />
          )}

          {/* DOCX preview */}
          {htmlContent && !loading && (
            <div style={{
              padding: '2rem',
              fontSize: '0.9rem',
              lineHeight: 1.8,
              maxHeight: '70vh',
              overflowY: 'auto',
            }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          )}

          {/* PPTX preview via pptx-preview */}
          {isPpt && !loading && !error && (
            <div ref={pptContainerRef} style={{
              padding: '1rem',
              minHeight: '50vh',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}
