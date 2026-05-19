import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Support Railway persistent volume: env RAILWAY_VOLUME_MOUNT_PATH or fallback to ./data
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'data')
  : path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'app.db');

// Upload directory — use persistent volume on Railway
export function getUploadDir() {
  return process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
    : path.join(process.cwd(), 'uploads');
}

let db: Database.Database;

export function getDb() {
  if (!db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      password TEXT,
      phone TEXT DEFAULT '',
      school TEXT DEFAULT '',
      invite_code TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      homework_type TEXT NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT NOT NULL,
      current_status TEXT DEFAULT '',
      expected_help TEXT DEFAULT '',
      is_urgent INTEGER DEFAULT 0,
      deadline TEXT DEFAULT '',
      price REAL DEFAULT 15,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending_payment',
      admin_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      paid_at TEXT DEFAULT '',
      delivered_at TEXT DEFAULT '',
      download_allowed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      is_delivery INTEGER DEFAULT 0,
      uploaded_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      code TEXT PRIMARY KEY,
      used_by TEXT DEFAULT '',
      is_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      used_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'pending',
      remark TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      confirmed_at TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
  `);

  // Insert invite codes that don't exist yet (idempotent)
  const insert = db.prepare('INSERT OR IGNORE INTO invite_codes (code) VALUES (?)');
  const codes = Array.from({ length: 100 }, (_, i) => `HELPER${String(i + 1).padStart(2, '0')}`);
  for (const code of codes) {
    insert.run(code);
  }

  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_admin = 1").get() as { c: number };
  if (adminCount.c === 0) {
    db.prepare('INSERT OR IGNORE INTO users (id, nickname, invite_code, is_admin) VALUES (?, ?, ?, 1)').run(uuid(), 'admin', 'ADMIN001');
  } else {
    // Fix admin nickname to ASCII to avoid encoding issues
    db.prepare("UPDATE users SET nickname = 'admin' WHERE is_admin = 1").run();
  }

  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('max_daily_orders', '3')").run();

  // Performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_files_order_id ON files(order_id);
    CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records(order_id);
  `);

  // Add download_allowed column for existing databases (idempotent)
  const columns = db.pragma('table_info(orders)') as any[];
  if (!columns.some((c: any) => c.name === 'download_allowed')) {
    db.exec("ALTER TABLE orders ADD COLUMN download_allowed INTEGER DEFAULT 0");
  }

  // Resource Library tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS resource_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      shape TEXT DEFAULT 'corner-tl',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS resource_files (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (category_id) REFERENCES resource_categories(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resource_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES resource_categories(id)
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_resource_perms_unique ON resource_permissions(user_id, category_id);
    CREATE INDEX IF NOT EXISTS idx_resource_files_category ON resource_files(category_id);
    CREATE INDEX IF NOT EXISTS idx_resource_categories_sort ON resource_categories(sort_order);
  `);
}
