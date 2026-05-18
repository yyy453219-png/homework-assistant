# Word/PPT 预览 + 微信性能优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 支持 Word/PPT 浏览器内预览 + 优化微信浏览器加载和运行速度

**Architecture:** 前端通过 mammoth.js（docx→HTML）和 pptxjs（pptx→SVG）在浏览器中动态渲染文件预览弹窗，懒加载避免影响首屏。性能优化通过移除 Google Fonts、移除 Tailwind、开启压缩、拆分服务端组件实现。

**Tech Stack:** Next.js 16.2.6, React 19.2.4, mammoth.js, pptxjs

---

## 文件改动总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/app/layout.tsx` | 修改 | 移除 Google Fonts 导入 |
| `src/app/globals.css` | 修改 | 替换 font-family 为系统字体，移除 @import tailwind |
| `next.config.ts` | 修改 | 开启 compress: true |
| `package.json` | 修改 | 移除 tailwindcss、@tailwindcss/postcss；添加 mammoth、pptxjs |
| `postcss.config.mjs` | 删除 | 不再需要 |
| `src/components/FilePreviewModal.tsx` | **新建** | Word/PPT/PDF/图片 预览弹窗 |
| `src/app/order/[id]/OrderDetailClient.tsx` | 修改 | 文件列表加"预览"按钮 |
| `src/app/admin/AdminClient.tsx` | 修改 | 文件列表加"预览"按钮 |
| `src/components/Header.tsx` | 修改 | 移除 'use client'，转为服务端组件 |

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 mammoth 和 pptxjs**

```bash
cd /c/Users/70671/homework-assistant
npm install mammoth pptxjs
```

预期输出：添加 `"mammoth"` 和 `"pptxjs"` 到 package.json 的 dependencies。

- [ ] **Step 2: 提交依赖更新**

```bash
git add package.json
git commit -m "chore: add mammoth and pptxjs dependencies"
```

---

### Task 2: 移除 Tailwind CSS

**Files:**
- Modify: `package.json`
- Delete: `postcss.config.mjs`
- Modify: `src/app/globals.css`（第1行 `@import "tailwindcss"`）

- [ ] **Step 1: 从 package.json 移除 tailwind 依赖**

删除 `package.json` 的 devDependencies 中的 `"@tailwindcss/postcss": "^4"` 和 `"tailwindcss": "^4"`。

```bash
# 卸载包
npm uninstall tailwindcss @tailwindcss/postcss
```

- [ ] **Step 2: 删除 postcss.config.mjs**

```bash
rm /c/Users/70671/homework-assistant/postcss.config.mjs
```

- [ ] **Step 3: 从 globals.css 移除 tailwind 导入**

编辑 `src/app/globals.css`，删除第 1 行：
```diff
- @import "tailwindcss";
```

- [ ] **Step 4: 提交**

```bash
git add package.json postcss.config.mjs src/app/globals.css
git commit -m "perf: remove unused Tailwind CSS dependency"
```

---

### Task 3: 移除 Google Fonts + 开启压缩

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `next.config.ts`

- [ ] **Step 1: 修改 layout.tsx**

编辑 `src/app/layout.tsx`，移除 Geist 字体导入和引用：

```diff
- import { Geist, Geist_Mono } from 'next/font/google';
- 
- const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
- const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
- 
  export const metadata: Metadata = {
    title: '作业完成助手',
    description: '提交作业需求，获取完成文档。思路解析、框架搭建、资料整理、格式检查。',
  };

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
-     <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
+     <html lang="zh-CN">
        <body>{children}</body>
      </html>
    );
  }
```

- [ ] **Step 2: 修改 globals.css 的 font-family**

编辑 `src/app/globals.css`，将 font-family 变量改为系统字体：

```diff
  :root {
    ...
-   --font-sans: var(--font-geist-sans);
+   --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
-   --font-mono: var(--font-geist-mono);
+   --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    ...
  }
```

- [ ] **Step 3: 修改 next.config.ts**

编辑 `next.config.ts`，开启压缩：

```diff
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
-   /* config options here */
+   compress: true,
  };

  export default nextConfig;
```

- [ ] **Step 4: 构建验证**

```bash
cd /c/Users/70671/homework-assistant
npm run build
```

预期：构建成功，没有字体相关错误。

- [ ] **Step 5: 提交**

```bash
git add src/app/layout.tsx src/app/globals.css next.config.ts
git commit -m "perf: remove Google Fonts, enable compression"
```

---

### Task 4: 新建 FilePreviewModal 组件

**Files:**
- Create: `src/components/FilePreviewModal.tsx`

- [ ] **Step 1: 创建 FilePreviewModal 组件**

创建 `src/components/FilePreviewModal.tsx`：

```tsx
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
  const [content, setContent] = useState<React.ReactNode>(null);
  const [error, setError] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  const [slides, setSlides] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const loadFile = useCallback(async () => {
    setLoading(true);
    setError('');
    setContent(null);
    setSlides([]);
    setSlideIndex(0);

    try {
      const res = await fetch(`/api/download/${fileId}`);
      if (!res.ok) throw new Error('文件加载失败');
      const arrayBuffer = await res.arrayBuffer();

      // Image preview
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        setContent(
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <img src={url} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        );
        setLoading(false);
        return;
      }

      // PDF preview
      if (ext === 'pdf') {
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setContent(
          <embed src={url} type="application/pdf" style={{ width: '100%', height: '70vh' }} />
        );
        setLoading(false);
        return;
      }

      // DOCX preview
      if (['doc', 'docx'].includes(ext)) {
        const mammoth = await import('mammoth');
        const result = await mammoth.default.convertToHtml({ arrayBuffer: new Uint8Array(arrayBuffer) });
        setContent(
          <div style={{ padding: '2rem', fontSize: '0.9rem', lineHeight: 1.8, maxHeight: '70vh', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: result.value }} />
        );
        setLoading(false);
        return;
      }

      // PPTX preview
      if (['ppt', 'pptx'].includes(ext)) {
        const pptxjs = await import('pptxjs');
        const slidesData = await pptxjs.default.render(new Uint8Array(arrayBuffer));
        // pptxjs returns slides as SVG strings array
        const slideSvgs: string[] = slidesData || [];
        if (slideSvgs.length === 0) throw new Error('PPT 解析失败');
        setSlides(slideSvgs);
        setLoading(false);
        return;
      }

      setError('暂不支持预览此文件类型');
    } catch (e: any) {
      setError(e.message || '预览加载失败');
    }
    setLoading(false);
  }, [fileId, fileName, ext]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setContent(null);
      setSlides([]);
      setSlideIndex(0);
      setError('');
      loadFile();
    }
  }, [visible, loadFile]);

  // Keyboard navigation for PPT
  useEffect(() => {
    if (!visible || slides.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setSlideIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setSlideIndex(i => Math.min(slides.length - 1, i + 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, slides, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!visible) return null;

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--white)',
        width: '100%', maxWidth: '800px',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--gray-200)',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {fileName}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--gray-500)', lineHeight: 1,
            fontFamily: 'inherit',
          }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              加载中...
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '3rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent)' }}>
              {error}
            </div>
          )}

          {content}

          {/* PPT slide display */}
          {slides.length > 0 && !loading && (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div
                dangerouslySetInnerHTML={{ __html: slides[slideIndex] }}
                style={{ maxHeight: '55vh', overflow: 'auto' }}
              />
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0}
                  className="btn btn-outline btn-sm" style={{ fontFamily: 'inherit', padding: '0.25rem 0.75rem' }}>
                  上一页
                </button>
                <span style={{ color: 'var(--gray-500)' }}>{slideIndex + 1} / {slides.length}</span>
                <button onClick={() => setSlideIndex(i => Math.min(slides.length - 1, i + 1))} disabled={slideIndex === slides.length - 1}
                  className="btn btn-outline btn-sm" style={{ fontFamily: 'inherit', padding: '0.25rem 0.75rem' }}>
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/FilePreviewModal.tsx
git commit -m "feat: add FilePreviewModal for Word/PPT/PDF/image preview"
```

---

### Task 5: 集成到用户订单详情页

**Files:**
- Modify: `src/app/order/[id]/OrderDetailClient.tsx`

- [ ] **Step 1: 添加 FilePreviewModal 导入和状态**

在 `OrderDetailClient.tsx` 顶部添加导入：

```diff
  import { useState } from 'react';
  import Link from 'next/link';
  import { useRouter } from 'next/navigation';
+ import FilePreviewModal from '@/components/FilePreviewModal';
```

在组件函数内添加预览状态：

```diff
  const [paymentNotified, setPaymentNotified] = useState(false);
+ const [previewFile, setPreviewFile] = useState<{ id: string; name: string } | null>(null);
```

- [ ] **Step 2: 在用户上传文件列表添加"预览"按钮**

在用户文件列表（files.map 循环）的下载按钮旁边加预览按钮。找到约第 231 行的下载按钮，在其后面添加：

```diff
-             <Link href={`/api/download/${f.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
-               下载
-             </Link>
+             <div style={{ display: 'flex', gap: '0.25rem' }}>
+               <button onClick={() => setPreviewFile({ id: f.id, name: f.original_name })}
+                 className="btn btn-outline btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', fontFamily: 'inherit' }}>
+                 预览
+               </button>
+               <Link href={`/api/download/${f.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
+                 下载
+               </Link>
+             </div>
```

- [ ] **Step 3: 在交付文件列表添加"预览"按钮**

同样在交付文件列表（deliveries.map 循环，约第 261 行）的下载按钮旁边添加预览按钮：

```diff
-             <Link href={`/api/download/${d.id}`} className="btn btn-accent btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
-               下载
-             </Link>
+             <div style={{ display: 'flex', gap: '0.25rem' }}>
+               <button onClick={() => setPreviewFile({ id: d.id, name: d.original_name })}
+                 className="btn btn-outline btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', fontFamily: 'inherit' }}>
+                 预览
+               </button>
+               <Link href={`/api/download/${d.id}`} className="btn btn-accent btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
+                 下载
+               </Link>
+             </div>
```

- [ ] **Step 4: 在组件底部（</div>前）添加 FilePreviewModal**

在 return 语句结束前添加：

```diff
+       <FilePreviewModal
+         fileId={previewFile?.id || ''}
+         fileName={previewFile?.name || ''}
+         visible={!!previewFile}
+         onClose={() => setPreviewFile(null)}
+       />
      </div>
    );
  }
```

- [ ] **Step 5: 提交**

```bash
git add src/app/order/\[id\]/OrderDetailClient.tsx
git commit -m "feat: integrate file preview into order detail page"
```

---

### Task 6: 集成到管理后台

**Files:**
- Modify: `src/app/admin/AdminClient.tsx`

- [ ] **Step 1: 添加 FilePreviewModal 导入和状态**

在 `AdminClient.tsx` 顶部添加导入：

```diff
  import FileUploadZone, { FileListDisplay } from '@/components/FileUploadZone';
+ import FilePreviewModal from '@/components/FilePreviewModal';
```

在 OrderDetailPanel 组件函数内添加预览状态：

```diff
  const [payAmount, setPayAmount] = useState('');
+ const [previewFile, setPreviewFile] = useState<{ id: string; name: string } | null>(null);
```

- [ ] **Step 2: 在用户上传文件列表添加"预览"按钮**

找到用户文件列表（约第 350 行，`userFiles.map` 循环），在下载链接旁边加预览按钮：

```diff
-             <Link href={`/api/download/${f.id}`} style={{
-               marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gray-500)',
-               textDecoration: 'underline',
-             }}>
-               下载
-             </Link>
+             <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
+               <button onClick={() => setPreviewFile({ id: f.id, name: f.name })}
+                 style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
+                 预览
+               </button>
+               <Link href={`/api/download/${f.id}`} style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline' }}>
+                 下载
+               </Link>
+             </div>
```

- [ ] **Step 3: 在交付文件列表添加"预览"按钮**

找到交付文件列表（约第 448 行，`deliveryFiles.map` 循环），在下载链接旁加预览按钮：

```diff
-               <Link href={`/api/download/${f.id}`} style={{ fontSize: '0.7rem', color: 'var(--gray-500)', }}>下载</Link>
+               <button onClick={() => setPreviewFile({ id: f.id, name: f.name })}
+                 style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginRight: '0.5rem' }}>
+                 预览
+               </button>
+               <Link href={`/api/download/${f.id}`} style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>下载</Link>
```

- [ ] **Step 4: 在 OrderDetailPanel return 底部添加 FilePreviewModal**

在 `</div>`（最外层 div 结尾）之前添加：

```diff
        {message && (...)}
+       <FilePreviewModal
+         fileId={previewFile?.id || ''}
+         fileName={previewFile?.name || ''}
+         visible={!!previewFile}
+         onClose={() => setPreviewFile(null)}
+       />
      </div>
    );
  }
```

- [ ] **Step 5: 提交**

```bash
git add src/app/admin/AdminClient.tsx
git commit -m "feat: integrate file preview into admin panel"
```

---

### Task 7: Header 优化（转为服务端组件）

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: 修改 Header.tsx 为服务端组件**

将 Header.tsx 改为服务端组件。移除 `'use client'` 指令和 `useState` 导入，保留所有展示逻辑：

```diff
- 'use client';
- 
- import { useState } from 'react';
  import Link from 'next/link';
  
  interface User {
    id: string;
    nickname: string;
    is_admin: number;
  }
  
  export default function Header({ user }: { user: User | null }) {
-   const [menuOpen, setMenuOpen] = useState(false);
  
    return (
      <header style={{...}}>
```

注意：`menuOpen` 变量已声明但未在 JSX 中实际使用（请确认），因此可以安全删除。

- [ ] **Step 2: 构建验证**

```bash
cd /c/Users/70671/homework-assistant
npm run build
```

预期：构建成功，没有类型或编译错误。

- [ ] **Step 3: 提交**

```bash
git add src/components/Header.tsx
git commit -m "perf: convert Header to server component"
```

---

### Task 8: 最终构建验证 + 推送

- [ ] **Step 1: 完整构建**

```bash
cd /c/Users/70671/homework-assistant
npm run build
```

预期：构建成功，无错误和警告。

- [ ] **Step 2: 推送到 GitHub 触发 Railway 部署**

```bash
git push
```

- [ ] **Step 3: 验证**（手动测试清单）
1. 首页加载速度是否有改善（微信浏览器测试）
2. 用户订单详情页 docx 文件点击"预览"是否能正常显示
3. 用户订单详情页 pptx 文件点击"预览"是否能翻页
4. 管理后台同样操作
5. 图片和 PDF 预览是否正常
6. 文件拖拽上传是否仍正常工作

---

## 回滚方案

如果出现问题：
- Google Fonts 移除：恢复 `layout.tsx` 和 `globals.css` 的 font-family 设置
- Tailwind 移除：重新 `npm install tailwindcss @tailwindcss/postcss`，恢复 `postcss.config.mjs` 和 globals.css 的导入
- 其他改动均为增量添加 FilePreviewModal，不影响现有功能
