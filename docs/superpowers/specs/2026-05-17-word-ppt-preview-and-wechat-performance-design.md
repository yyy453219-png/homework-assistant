# Word/PPT 预览 + 微信性能优化 设计文档

## 概述

在现有作业完成助手 Web App 上增加两个能力：
1. Word/PPT 文件在浏览器内直接预览（类似聊天软件点开文件查看）
2. 优化微信浏览器（X5 内核）的加载速度和操作流畅度

---

## 一、Word/PPT 网页预览

### 目标
用户在订单详情页和管理后台可以直接点击预览 Word（.doc/.docx）和 PPT（.pptx）文件，在弹窗中查看内容，无需下载到本地再用其他应用打开。

### 方案：前端动态渲染

| 文件类型 | 渲染方式 | 使用的库 | 体积 |
|---------|---------|---------|------|
| .docx | 解析为格式化 HTML | `mammoth.js` | ~30KB gzip |
| .pptx | 逐页解析为 SVG/图片序列 | `pptxjs` | ~50KB gzip |
| .pdf | 浏览器原生 `<embed>` | 无需库 | 0 |
| 图片 (jpg/png/gif) | 放大显示 | 无需库 | 0 |

### 新增组件

#### `FilePreviewModal`（新文件）
- 功能：弹窗展示文件内容
- 行为：
  - 根据文件扩展名自动选择渲染方式
  - mammoth 和 pptxjs 通过 `next/dynamic` 懒加载，首次点击预览时才下载
  - 支持键盘左右键翻页（PPT 模式）
  - 点击遮罩层或关闭按钮退出
- Props：
  ```ts
  interface FilePreviewModalProps {
    fileId: string;
    fileName: string;
    visible: boolean;
    onClose: () => void;
  }
  ```

#### 渲染逻辑
```
用户点击"预览"
  → 根据扩展名判断类型
  → 动态 import 对应渲染库
  → fetch /api/download/[fileId] 获取文件二进制
  → 渲染到弹窗中
```

#### docx 渲染
- 用 `mammoth.convertToHtml()` 将 docx 转为 HTML
- 支持：段落、标题、列表、图片、表格、加粗/斜体
- 将 HTML 通过 `dangerouslySetInnerHTML` 注入预览区域（mammoth 已做 XSS 过滤）

#### pptx 渲染
- 用 `pptxjs` 解析 pptx 文件
- 逐页提取内容，每页渲染为一个 slide
- 底部加页码导航（"上一页 / 下一页" + 页码指示）
- 支持拖拽文件到预览弹窗区域上传

### 集成位置

| 页面 | 文件 | 改动 |
|------|------|------|
| 用户订单详情 | `OrderDetailClient.tsx` | 文件列表每行加"预览"按钮 |
| 管理后台详情 | `AdminClient.tsx` | 用户文件和交付文件每行加"预览"按钮 |

### 文件拖拽上传（预览弹窗内）
- 预览弹窗区域也支持拖拽 Word/PPT 文件
- 拖入文件后自动触发上传流程（复用现有 `FileUploadZone` 逻辑）
- 与聊天软件"看到文件直接拖进去"的体验一致

---

## 二、微信浏览器性能优化

### 目标
改善微信内置浏览器（X5 内核）的页面加载速度和操作响应速度。

### 问题诊断
微信 X5 内核基于较旧 Chromium 版本（~Chrome 69），主要瓶颈：
1. Google Fonts 加载阻塞渲染（微信访问 Google 服务慢）
2. 大型 JS Bundle 解析耗时
3. Tailwind CSS v4 生成大量未使用的 CSS 规则
4. 无请求缓存策略

### 具体优化项

#### 1. 移除 Google Fonts（最高优先级）
- **现状**：`layout.tsx` 中加载 `Geist` + `Geist_Mono` 两套 Google Fonts
- **改为**：只使用系统字体堆栈 `system-ui, -apple-system, sans-serif`
- **原因**：微信浏览器访问 Google Fonts CDN 非常慢，经常阻塞渲染 1-3 秒
- **改动文件**：`src/app/layout.tsx`
- **效果**：减少 2 个外部资源请求，首屏渲染时间预计减少 500ms-2s

```diff
- import { Geist, Geist_Mono } from 'next/font/google';
- const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
- const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
- <html className={`${geistSans.variable} ${geistMono.variable}`}>
+ <html>
```

同时在 CSS 中将 `--font-sans` 和 `--font-mono` 改为使用系统字体。

#### 2. 移除 Tailwind CSS（高优先级）
- **现状**：项目引入了 `tailwindcss` v4 和 `@tailwindcss/postcss`，但实际代码几乎全部使用手写 CSS（globals.css + inline styles），几乎没有用到 tailwind class
- **改为**：移除 tailwind 依赖和 postcss 配置
- **原因**：Tailwind v4 在构建时生成大量 CSS（即使未使用的 class 也会生成基础样式），增加 CSS 文件体积
- **改动文件**：`package.json`、`postcss.config.js`（如存在）、`globals.css`

#### 3. 开启 Next.js 压缩（中优先级）
- **现状**：`next.config.ts` 为空，没有开启任何优化
- **改为**：启用 `compress: true`
- **原因**：gzip 压缩可减少 ~70% 传输体积
- **改动文件**：`next.config.ts`

#### 4. 客户端组件懒加载（中优先级）
- **现状**：`Header.tsx` 是 'use client' 组件，导致整个首页需要加载 React 客户端 JS
- **改为**：将 Header 拆分为纯展示的服务器组件，客户端交互部分（如菜单切换）用 `next/dynamic` 隔离
- **效果**：首页 HTML 直出，减少客户端 JS 执行时间

#### 5. 图片优化（低优先级）
- **现状**：QR 码直接用 `<img src="/images/qr-code.jpg">`，无优化
- **改为**：压缩二维码图片体积（实际不需要高质量），添加 loading="lazy"

### 预期效果
| 优化项 | 预计收益 |
|-------|---------|
| 移除 Google Fonts | 首屏渲染 +500ms~2s |
| 移除 Tailwind | CSS 体积减少 ~80% |
| 开启压缩 | 传输体积减少 ~70% |
| 组件懒加载 | 首屏 JS 减少 ~40% |

---

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/app/layout.tsx` | 修改 | 移除 Google Fonts |
| `src/app/globals.css` | 修改 | 修改 font-family 变量 |
| `next.config.ts` | 修改 | 开启 compress |
| `package.json` | 修改 | 移除 tailwindcss |
| `postcss.config.js` | 删除 | 不再需要 |
| `src/components/FilePreviewModal.tsx` | **新建** | Word/PPT 预览弹窗 |
| `src/app/order/[id]/OrderDetailClient.tsx` | 修改 | 文件列表加预览按钮 |
| `src/app/admin/AdminClient.tsx` | 修改 | 文件列表加预览按钮 |
| `src/components/Header.tsx` | 修改 | 拆分为服务端组件 |

---

## 关键风险

1. **mammoth.js 在微信浏览器兼容性**：mammoth 输出标准 HTML，X5 内核可正常渲染。如果遇到样式兼容问题，降级为纯文本显示。
2. **pptxjs 在大文件性能**：超过 50 页的 PPT 解析可能较慢。加 loading 状态提示，首次渲染后缓存结果。
3. **移除 Tailwind 影响**：需要确认项目确实没有使用 tailwind class（从代码 review 来看确实没有）。万一有遗漏，构建时会报错，很容易发现和修复。
