import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 情报条目表
export const newsItems = sqliteTable('news_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  titleCn: text('title_cn'),
  summary: text('summary'),
  summaryCn: text('summary_cn'),
  contentExcerpt: text('content_excerpt'),
  source: text('source').notNull(),
  sourceUrl: text('source_url'),
  category: text('category').default('news'),
  tags: text('tags').default('[]'),
  keyPoints: text('key_points').default('[]'),
  importance: integer('importance').default(3),
  reason: text('reason'),
  imageUrl: text('image_url'),
  publishedAt: text('published_at'),
  collectedAt: text('collected_at').default(''),
  processedAt: text('processed_at'),
  processingStatus: text('processing_status').default('pending'),
  isFeatured: integer('is_featured').default(0),
  viewCount: integer('view_count').default(0),
  createdAt: text('created_at').default(''),
  updatedAt: text('updated_at').default(''),
});

// 采集任务日志表
export const collectionRuns = sqliteTable('collection_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runType: text('run_type').notNull(),
  status: text('status').default('running'),
  startedAt: text('started_at').default(''),
  finishedAt: text('finished_at'),
  itemsFound: integer('items_found').default(0),
  itemsCreated: integer('items_created').default(0),
  itemsFailed: integer('items_failed').default(0),
  aiProcessed: integer('ai_processed').default(0),
  aiFailed: integer('ai_failed').default(0),
  tokensUsed: integer('tokens_used').default(0),
  workerId: text('worker_id').default(''),
  heartbeatAt: text('heartbeat_at').default(''),
  error: text('error'),
});

// 导出类型
export type NewsItem = typeof newsItems.$inferSelect;
export type NewNewsItem = typeof newsItems.$inferInsert;
export type CollectionRun = typeof collectionRuns.$inferSelect;
export type NewCollectionRun = typeof collectionRuns.$inferInsert;
