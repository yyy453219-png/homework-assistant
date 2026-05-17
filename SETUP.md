# 作业完成助手 - 部署指南

## 项目简介

移动端 Web 应用，用于提交作业需求、管理订单、交付文档。

## 技术栈

- **框架**: Next.js 16 (React)
- **数据库**: SQLite
- **样式**: 自定义 CSS（解构主义设计）
- **部署**: 支持 VPS / Railway / Fly.io

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 数据文件会自动创建在 data/ 目录下
npm run dev
```

首次启动会自动：
- 创建 SQLite 数据库和所有数据表
- 生成 10 个邀请码（HELPER01 ~ HELPER10）
- 创建默认管理员账号

### 3. 设置管理员密码

首次启动后，访问：

```
http://localhost:3000/admin/setup
```

设置管理员密码。然后使用昵称 `管理员` + 你设置的密码登录。

### 4. 配置收款码

在订单详情页中，替换收款码图片：
- 打开 `src/app/order/[id]/OrderDetailClient.tsx`
- 找到 `收款码放置区域` 部分
- 替换为你自己的微信收款码图片

### 5. 配置客服微信

在 `src/app/order/[id]/OrderDetailClient.tsx` 中：
- 找到 `微信：your_wechat_id`
- 替换为你的微信号

## 部署到生产

### 方案一：Railway（推荐，免费额度足够）

1. 将代码推送到 GitHub
2. 在 [railway.app](https://railway.app) 创建新项目
3. 选择 Deploy from GitHub repo
4. 构建设置：
   - Build Command: `npm run build`
   - Start Command: `npm run start`
5. Railway 会自动分配域名

### 方案二：云服务器（VPS）

```bash
# 安装 Node.js 18+
# 上传代码到服务器

npm install
npm run build

# 使用 PM2 守护进程
npm install -g pm2
pm2 start npm --name "homework-assistant" -- start
pm2 save
pm2 startup

# 使用 Nginx 反向代理
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方案三：Fly.io

```bash
# 安装 flyctl
# 在项目目录运行
fly launch
fly deploy
```

## 默认邀请码

| 邀请码 | 状态 |
|--------|------|
| HELPER01 ~ HELPER10 | 可用，每个限用 1 次 |

## 管理员登录

- 昵称：`管理员`
- 密码：你通过 `/admin/setup` 设置的密码

## 管理后台功能

- 查看所有订单
- 按状态筛选订单
- 修改订单状态（待付款 → 已付款 → 处理中 → 已交付 → 已完成）
- 上传交付文档
- 添加管理员备注
- 查看用户列表

## 文件说明

```
homework-assistant/
├── src/
│   ├── app/           # 页面和 API 路由
│   │   ├── page.tsx           # 首页
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   ├── submit/            # 提交需求页
│   │   ├── orders/            # 订单列表页
│   │   ├── order/[id]/        # 订单详情页
│   │   └── admin/             # 管理后台
│   ├── components/    # 共享组件
│   └── lib/           # 工具库（数据库、认证）
├── data/              # SQLite 数据库文件
├── uploads/           # 用户上传文件
└── SETUP.md           # 本文件
```
