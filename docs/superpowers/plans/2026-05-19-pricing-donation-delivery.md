# 打赏制与管理员授权下载 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 取消固定价格改为用户自愿打赏，并将交付文件下载权限改为管理员手动授权

**Architecture:** Next.js 16 App Router + SQLite (better-sqlite3)。所有改动集中在 orders 表新增 download_allowed 字段、移除定价逻辑、付款流程改为用户输入打赏金额、管理后台增加授权下载开关。

**Tech Stack:** Next.js 16, React 19, better-sqlite3, TypeScript

---

### Task 1: 数据库迁移 — 新增 download_allowed 字段，移除定价配置

**Files:**
- Modify: `src/lib/db.ts:124-126`, `src/lib/db.ts:33-44`

- [ ] **Step 1: 在 orders 表 CREATE TABLE 中添加 download_allowed 列**

在 `src/lib/db.ts` 的 `initTables()` 函数中，在 orders 表的 `delivered_at` 字段后添加新列：

编辑 `src/lib/db.ts`，在 `is_admin` 所在 CREATE TABLE orders 部分，在 `delivered_at` 行（line 63）之后添加：

Edit: Replace `delivered_at TEXT DEFAULT ''` with `delivered_at TEXT DEFAULT '', download_allowed INTEGER DEFAULT 0`

```sql
-- 修改前
delivered_at TEXT DEFAULT '',
FOREIGN KEY (user_id) REFERENCES users(id)

-- 修改后
delivered_at TEXT DEFAULT '',
download_allowed INTEGER DEFAULT 0,
FOREIGN KEY (user_id) REFERENCES users(id)
```

- [ ] **Step 2: 添加 ALTER TABLE 迁移，兼容已有数据库**

在 `initTables()` 函数末尾（indexes 之后），添加兼容迁移：

```typescript
// Add download_allowed column for existing databases
try {
  db.exec("ALTER TABLE orders ADD COLUMN download_allowed INTEGER DEFAULT 0");
} catch {
  // Column already exists — ignore
}
```

替换 `src/lib/db.ts` 原有 lines 124-126 的三行 settings 插入：

Edit: Replace these three lines:
```typescript
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('default_price', '15')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('urgent_price', '25')").run();
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('max_daily_orders', '3')").run();
```

With:
```typescript
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('max_daily_orders', '3')").run();
```

- [ ] **Step 3: 验证**

重新审视 `db.ts` 确保没有其他引用 `default_price` 或 `urgent_price` 的代码。确认迁移的 try/catch 不会阻止应用启动。

- [ ] **Step 4: 提交**

```bash
git add src/lib/db.ts
git commit -m "feat: add download_allowed column, remove fixed price settings"
```

---

### Task 2: 订单创建 API — 价格设为 0

**Files:**
- Modify: `src/app/api/orders/route.ts:17`

- [ ] **Step 1: 修改 price 计算逻辑**

Edit: Replace `const price = data.is_urgent ? 25 : 15;` with `const price = 0;`

```typescript
// 修改前 (line 17)
const price = data.is_urgent ? 25 : 15;

// 修改后
const price = 0;
```

- [ ] **Step 2: 验证**

确认 `price` 仍然作为参数传入 INSERT 查询中（line 22 的 `price` 参数）。它现在总是 0，但 SQL 列定义仍然接受它。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: set order price to 0 (donation model)"
```

---

### Task 3: 提交订单页面 — 删除价格展示，更新加急文案

**Files:**
- Modify: `src/app/submit/page.tsx:126`, `src/app/submit/page.tsx:176-181`, `src/app/submit/page.tsx:202-211`

- [ ] **Step 1: 删除价格计算行**

Edit: Remove line `const price = isUrgent ? 25 : 15;` (line 126)

```typescript
// 删除这一整行:
const price = isUrgent ? 25 : 15;
```

- [ ] **Step 2: 修改加急文案**

Edit in `src/app/submit/page.tsx`:

Replace:
```tsx
<label htmlFor="urgent" style={{ fontSize: '0.875rem' }}>
  加急（6-12小时交付，加收 10 元）
</label>
```

With:
```tsx
<label htmlFor="urgent" style={{ fontSize: '0.875rem' }}>
  加急（6-12小时优先处理）
</label>
```

- [ ] **Step 3: 删除价格展示区块**

Delete the entire price display block (lines 202-211):

```tsx
{/* Price Display */}
<div className="geo-block" style={{ marginBottom: '1.5rem' }}>
  <span className="section-number" style={{ marginBottom: '0.25rem' }}>价格</span>
  <div className="price-large">
    <span className="currency">¥</span>{price}
  </div>
  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
    {isUrgent ? '加急服务 · 6-12小时交付' : '标准服务 · 24-48小时交付'}
  </p>
</div>
```

- [ ] **Step 4: 提交**

```bash
git add src/app/submit/page.tsx
git commit -m "feat: remove fixed price display from submit page, update urgent label"
```

---

### Task 4: 付款确认 API — 接受用户输入的金额

**Files:**
- Modify: `src/app/api/payment/confirm/route.ts:30-34`

- [ ] **Step 1: 修改 API 接受 amount 参数**

Edit `src/app/api/payment/confirm/route.ts`:

```typescript
// 修改前: 从 order.price 读取金额
const { orderId } = await request.json();

// 修改后: 从请求体中接受 amount
const { orderId, amount } = await request.json();

if (!orderId) {
  return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
}

const donation = parseFloat(amount);
if (!donation || donation <= 0) {
  return NextResponse.json({ error: '请输入有效的打赏金额' }, { status: 400 });
}
```

- [ ] **Step 2: 修改 INSERT 使用 donation 替代 order.price**

Edit the INSERT query to use `donation` instead of `order.price`:

Replace:
```typescript
`).run(paymentId, orderId, user.id, order.price);
```

With:
```typescript
`).run(paymentId, orderId, user.id, donation);
```

Also remove the `const order = ...` query if it's only used for `order.price`. Check: the `order` variable is also used for existence check (`if (!order)`) and ownership check (`order.user_id !== user.id`), so keep those reads.

- [ ] **Step 3: 更新响应消息**

The response message can stay the same since it's already generic:
```typescript
return NextResponse.json({
  success: true,
  message: '已通知管理员，请等待确认',
});
```

- [ ] **Step 4: 提交**

```bash
git add src/app/api/payment/confirm/route.ts
git commit -m "feat: accept user-entered donation amount in payment confirm API"
```

---

### Task 5: 订单详情页 — 打赏输入 + 条件下载按钮

**Files:**
- Modify: `src/app/order/[id]/OrderDetailClient.tsx:124-160` (payment section), `src/app/order/[id]/OrderDetailClient.tsx:246-277` (deliveries section)

- [ ] **Step 1: 在 state 中增加 donationAmount**

在 OrderDetailClient 组件中 state 声明区域添加：

```typescript
const [donationAmount, setDonationAmount] = useState('');
```

在 `handlePaymentConfirm` 函数中，修改 fetch body 传入用户输入的金额：

```typescript
async function handlePaymentConfirm() {
  const amount = parseFloat(donationAmount);
  if (!amount || amount <= 0) {
    setMessage('请输入打赏金额');
    return;
  }
  setConfirming(true);
  try {
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, amount }),
    });
    // ...rest unchanged
  }
}
```

- [ ] **Step 2: 修改付款区块 — 价格显示改为打赏输入框**

Replace the payment section (lines 124-160) with:

```tsx
{/* Payment Section */}
{order.status === 'pending_payment' && !paymentNotified && (
  <div className="geo-block" style={{ marginBottom: '2rem' }}>
    <span className="section-number" style={{ marginBottom: '0.5rem' }}>打赏支持</span>
    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
      本平台采用打赏制，请自由输入你想支持的金额
    </p>
    {order.is_urgent ? (
      <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
        加急订单，建议适当增加打赏金额
      </p>
    ) : null}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <span style={{ fontSize: '1.5rem', fontWeight: '600' }}>¥</span>
      <input type="number" className="input" value={donationAmount}
        onChange={e => setDonationAmount(e.target.value)}
        style={{ width: '180px', padding: '0.6rem 0.75rem', fontSize: '1.1rem' }}
        placeholder="输入金额" min="0" step="0.01" />
    </div>
    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
      请扫描以下二维码付款，付款后点击确认
    </p>
    <div style={{
      width: '200px', height: '200px',
      background: 'var(--gray-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '1rem',
      border: '1px solid var(--gray-200)',
      fontSize: '0.7rem', color: 'var(--gray-400)',
      overflow: 'hidden',
    }}>
      <img src="/images/qr-code.jpg" alt="微信收款码"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
          (e.target as HTMLElement).parentElement!.innerText = '请替换 public/images/qr-code.jpg';
        }}
      />
    </div>
    <button className="btn btn-primary btn-sm" onClick={handlePaymentConfirm} disabled={confirming}>
      {confirming ? '确认中...' : '我已付款'}
    </button>
    {message && <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>{message}</p>}
  </div>
)}
```

- [ ] **Step 3: 修改订单信息区域的价格显示**

Replace the "价格" line in order info (approx line 193-195):

```tsx
<div>
  <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>打赏金额</p>
  <p style={{ fontWeight: '600' }}>¥{order.paid_amount || 0}</p>
</div>
```

- [ ] **Step 4: 修改交付文档区块 — 根据 download_allowed 条件显示下载按钮**

Replace the delivery download link (lines 267-269) with conditional rendering:

```tsx
{order.download_allowed ? (
  <Link href={`/api/download/${d.id}`} className="btn btn-accent btn-sm" style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem' }}>
    下载
  </Link>
) : (
  <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
    等待管理员授权
  </span>
)}
```

Note: We also need to add `download_allowed` to the Order interface (line 36):

```typescript
interface Order {
  // ...existing fields
  download_allowed: number;
}
```

- [ ] **Step 5: 提交**

```bash
git add src/app/order/\[id\]/OrderDetailClient.tsx
git commit -m "feat: donation input on payment page, conditional download button"
```

---

### Task 6: 下载 API — 改用 download_allowed 校验

**Files:**
- Modify: `src/app/api/download/[fileId]/route.ts:27-33`

- [ ] **Step 1: 修改下载权限校验逻辑**

Replace the delivery file permission check (lines 27-33):

```typescript
// 修改前:
// Delivery files require full payment
if (file.is_delivery) {
  const paid = order.paid_amount || 0;
  if (paid < order.price) {
    return NextResponse.json({ error: '请先完成付款' }, { status: 403 });
  }
}

// 修改后:
// Delivery files require admin authorization
if (file.is_delivery) {
  if (!order.download_allowed) {
    return NextResponse.json({ error: '管理员尚未授权下载' }, { status: 403 });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/download/\[fileId\]/route.ts
git commit -m "feat: check download_allowed instead of payment status for file download"
```

---

### Task 7: 管理后台 API — 新增 downloadAllowed 处理，移除 auto-paid

**Files:**
- Modify: `src/app/api/admin/orders/route.ts:30-63`

- [ ] **Step 1: 新增 downloadAllowed 参数处理**

在 PUT handler 中，destructure `downloadAllowed` 参数（line 30）：

```typescript
const { orderId, status, admin_note, paidAmount, downloadAllowed } = await request.json();
```

在 lines 47-63 的 if 链后添加：

```typescript
if (downloadAllowed !== undefined) {
  db.prepare('UPDATE orders SET download_allowed = ? WHERE id = ?').run(downloadAllowed ? 1 : 0, orderId);
}
```

- [ ] **Step 2: 移除 auto-paid 逻辑**

Remove the auto-paid check (lines 56-62):

```typescript
// 删除以下代码块 (lines 56-62):
if (paidAmount !== undefined) {
  // ...
  // Auto-mark as paid if fully paid
  const updated = db.prepare('SELECT paid_amount, price FROM orders WHERE id = ?').get(orderId) as any;
  if (updated && updated.paid_amount >= updated.price) {
    db.prepare('UPDATE orders SET status = ?, paid_at = COALESCE(paid_at, datetime(\'now\',\'localtime\')) WHERE id = ?').run('paid', orderId);
  }
}
```

保留 `paidAmount` 的处理逻辑（只记录付款金额，不再自动判断是否"付清"）。修改后的 paidAmount 处理：

```typescript
if (paidAmount !== undefined) {
  const amount = parseFloat(paidAmount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: '无效金额' }, { status: 400 });
  }
  // Accumulate paid_amount
  db.prepare('UPDATE orders SET paid_amount = COALESCE(paid_amount, 0) + ? WHERE id = ?').run(amount, orderId);
}
```

- [ ] **Step 3: 提交**

```bash
git add src/app/api/admin/orders/route.ts
git commit -m "feat: add downloadAllowed support, remove auto-paid logic"
```

---

### Task 8: 管理后台界面 — 授权下载开关 + 更新收款显示

**Files:**
- Modify: `src/app/admin/AdminClient.tsx:220-501`

- [ ] **Step 1: 增加 downloadAllowed state**

在 `OrderDetailPanel` 组件中，将 `order` 的 `download_allowed` 提取为 state：

在 `newStatus` state 声明附近添加：
```typescript
const [downloadAllowed, setDownloadAllowed] = useState(order.download_allowed ? true : false);
```

移除 `remaining` 计算 (line 231)：
```typescript
// 删除这一行:
const remaining = Math.max(0, order.price - (order.paid_amount || 0));
```

- [ ] **Step 2: 添加授权下载的处理函数**

在 `handleSaveNote` 函数之后添加：

```typescript
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
```

- [ ] **Step 3: 修改订单信息区域的价格显示**

Replace lines 323-324 (价格/已付金额显示):

```tsx
<div><span style={{ color: 'var(--gray-400)' }}>打赏金额:</span> ¥{order.paid_amount || 0}</div>
```

Remove the separate "已付金额" line since we merged it.

- [ ] **Step 4: 替换收款管理区块**

Replace the entire "Payment Validation" section (lines 375-416):

```tsx
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
```

- [ ] **Step 5: 添加授权下载开关区块**

在"收款记录"区块之后、"状态流转"区块之前添加：

```tsx
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
```

- [ ] **Step 6: 修改订单列表的价格列显示**

In the orders table header (line 138), change "金额" to "打赏":

And in the table body (line 151), change `¥{o.price}` to `¥{o.paid_amount || 0}`:

```tsx
<td>¥{o.paid_amount || 0}</td>
```

- [ ] **Step 7: 添加 download_allowed 到 Order interface**

在 Order interface (lines 22-39) 中添加：
```typescript
download_allowed: number;
```

- [ ] **Step 8: 提交**

```bash
git add src/app/admin/AdminClient.tsx
git commit -m "feat: add download authorization toggle, update payment display"
```

---

### Task 9: 订单列表页 — 显示已付金额

**Files:**
- Modify: `src/app/orders/page.tsx:60-61`

- [ ] **Step 1: 修改价格显示**

Replace line 61 `¥{order.price}` with `¥{order.paid_amount || 0}`:

```tsx
<p style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '0.25rem' }}>
  ¥{order.paid_amount || 0}
</p>
```

- [ ] **Step 2: 提交**

```bash
git add src/app/orders/page.tsx
git commit -m "feat: show paid_amount instead of price in orders list"
```

---

### Task 10: 端到端验证

- [ ] **Step 1: 确认项目可以正常构建**

```bash
cd C:/Users/70671/homework-assistant && npm run build
```

如果没有 build script，运行 `npm run dev` 并确认无编译错误。

- [ ] **Step 2: 验证核心功能流程**

1. 提交新订单 — 确认没有价格显示，加急文案正确
2. 查看订单详情 — 确认显示打赏输入框而非固定价格
3. 输入金额后点击"我已付款" — 确认提示已通知管理员
4. 管理员登录后台 — 确认订单列表显示打赏金额而非价格
5. 管理员确认收款 — 确认金额累加到 paid_amount
6. 管理员上传交付文件 — 确认上传功能正常
7. 管理员点击"授权下载" — 确认状态切换
8. 用户刷新订单详情 — 确认下载按钮可点击（已授权时）
9. 用户尝试下载未授权的文件 — 确认收到 403 错误

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "chore: finalize donation model and admin download authorization"
```
