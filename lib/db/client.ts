import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// 数据库文件路径
function getDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('file:')) {
    return url.replace('file:', '');
  }
  if (url) {
    return url;
  }
  return path.join(process.cwd(), 'local.db');
}

const DB_PATH = getDbPath();

// 创建数据库连接
const sqlite = new Database(DB_PATH);

// 启用 WAL 模式以提高性能
sqlite.pragma('journal_mode = WAL');

function ensureCollectionRunProgressColumns() {
  const table = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'collection_runs'")
    .get();

  if (!table) {
    return;
  }

  const columns = new Set(
    (sqlite.prepare('PRAGMA table_info(collection_runs)').all() as Array<{ name: string }>)
      .map((column) => column.name)
  );

  const additions = [
    ['ai_processed', 'INTEGER DEFAULT 0'],
    ['ai_failed', 'INTEGER DEFAULT 0'],
    ['worker_id', "TEXT DEFAULT ''"],
    ['heartbeat_at', "TEXT DEFAULT ''"],
  ] as const;

  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      sqlite.exec(`ALTER TABLE collection_runs ADD COLUMN ${name} ${definition}`);
    }
  }
}

// 兼容已有本地数据库，启动时补齐后台任务进度字段。
ensureCollectionRunProgressColumns();

// 创建 Drizzle 实例
export const db = drizzle(sqlite, { schema });

// 导出原始连接供 seed 脚本使用
export { sqlite };

// 初始化数据库表（仅在 seed 脚本或显式调用时使用）
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      title_cn TEXT,
      summary TEXT,
      summary_cn TEXT,
      content_excerpt TEXT,
      source TEXT NOT NULL,
      source_url TEXT,
      category TEXT DEFAULT 'news',
      tags TEXT DEFAULT '[]',
      key_points TEXT DEFAULT '[]',
      importance INTEGER DEFAULT 3,
      reason TEXT,
      image_url TEXT,
      published_at TEXT,
      collected_at TEXT DEFAULT '',
      processed_at TEXT,
      processing_status TEXT DEFAULT 'pending',
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS collection_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_type TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      started_at TEXT DEFAULT '',
      finished_at TEXT,
      items_found INTEGER DEFAULT 0,
      items_created INTEGER DEFAULT 0,
      items_failed INTEGER DEFAULT 0,
      ai_processed INTEGER DEFAULT 0,
      ai_failed INTEGER DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      worker_id TEXT DEFAULT '',
      heartbeat_at TEXT DEFAULT '',
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category);
    CREATE INDEX IF NOT EXISTS idx_news_items_importance ON news_items(importance DESC);
    CREATE INDEX IF NOT EXISTS idx_news_items_status ON news_items(processing_status);
  `);
}
