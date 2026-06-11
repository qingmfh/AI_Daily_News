import Database from 'better-sqlite3';
import path from 'path';

function getDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('file:')) return url.replace('file:', '');
  if (url) return url;
  return path.join(process.cwd(), 'local.db');
}

const database = new Database(getDbPath());
const rows = database
  .prepare('SELECT id, published_at FROM news_items WHERE published_at IS NOT NULL')
  .all() as Array<{ id: number; published_at: string }>;

const updateDate = database.prepare(
  'UPDATE news_items SET published_at = ? WHERE id = ?'
);
const clearDate = database.prepare(
  'UPDATE news_items SET published_at = NULL WHERE id = ?'
);

let normalized = 0;
let cleared = 0;

const migrate = database.transaction(() => {
  for (const row of rows) {
    const timestamp = Date.parse(row.published_at);

    if (Number.isNaN(timestamp)) {
      clearDate.run(row.id);
      cleared++;
      continue;
    }

    const isoDate = new Date(timestamp).toISOString();
    if (isoDate !== row.published_at) {
      updateDate.run(isoDate, row.id);
      normalized++;
    }
  }
});

migrate();
const clearedFeatured = database
  .prepare('UPDATE news_items SET is_featured = 0 WHERE is_featured != 0')
  .run().changes;
database.close();

console.log(
  `数据迁移完成：标准化发布时间 ${normalized} 条，清空无效日期 ${cleared} 条，取消重点标记 ${clearedFeatured} 条。`
);
