import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '作业完成助手',
  description: '提交作业需求，获取完成文档。思路解析、框架搭建、资料整理、格式检查。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
