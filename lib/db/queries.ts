import { and, desc, eq, gte, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from './client';
import { newsItems, collectionRuns } from './schema';
import { getStartOfToday, normalizePublishedDate } from '@/lib/utils';

interface ItemFilters {
  category?: string;
  importance?: string;
  search?: string;
}

function parseCategoryFilter(category?: string): string[] {
  if (!category) {
    return [];
  }

  return Array.from(new Set(
    category
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  ));
}

function parseSearchItemId(search?: string): number | null {
  const match = search?.trim().match(/^#(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number.parseInt(match[1], 10);
  return Number.isNaN(id) ? null : id;
}

/**
 * 获取最新情报列表（支持分类/重要性/搜索筛选 + 分页）
 */
export async function getLatestItems(
  filters: ItemFilters,
  page = 1,
  pageSize = 10
) {
  const conditions: SQL[] = [];

  // 排除链接失效的条目
  conditions.push(sql`${newsItems.processingStatus} != 'invalid'`);

  const selectedCategories = parseCategoryFilter(filters.category);
  if (selectedCategories.length === 1) {
    conditions.push(eq(newsItems.category, selectedCategories[0]));
  } else if (selectedCategories.length > 1) {
    conditions.push(inArray(newsItems.category, selectedCategories));
  }

  if (filters.importance) {
    conditions.push(eq(newsItems.importance, parseInt(filters.importance, 10)));
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    const searchItemId = parseSearchItemId(search);
    const pattern = `%${search}%`;
    const searchCondition = or(
      searchItemId ? eq(newsItems.id, searchItemId) : undefined,
      like(newsItems.title, pattern),
      like(newsItems.titleCn, pattern),
      like(newsItems.summaryCn, pattern),
      like(newsItems.source, pattern)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsItems)
    .where(whereClause);
  const total = totalResult[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const offset = (safePage - 1) * pageSize;

  const items = await db
    .select()
    .from(newsItems)
    .where(whereClause)
    .orderBy(desc(newsItems.publishedAt), desc(newsItems.importance), desc(newsItems.id))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      start: total === 0 ? 0 : offset + 1,
      end: Math.min(offset + items.length, total),
      hasPrevious: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

/**
 * 获取固定顶栏统计数据
 */
export async function getHeaderStats() {
  const todayStr = getStartOfToday();
  const validCondition = sql`${newsItems.processingStatus} != 'invalid'`;

  const [totalResult, todayResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(newsItems).where(validCondition),
    db.select({ count: sql<number>`count(*)` }).from(newsItems).where(and(validCondition, gte(newsItems.publishedAt, todayStr))),
  ]);

  return {
    total: totalResult[0]?.count || 0,
    today: todayResult[0]?.count || 0,
  };
}

/**
 * 获取首页分类数量
 */
export async function getCategoryCounts() {
  const categoryResults = await db
    .select({ category: newsItems.category, count: sql<number>`count(*)` })
    .from(newsItems)
    .where(sql`${newsItems.processingStatus} != 'invalid'`)
    .groupBy(newsItems.category);

  return categoryResults.reduce<Record<string, number>>((acc, row) => {
    acc[row.category || 'news'] = row.count;
    return acc;
  }, {});
}

/**
 * 根据 ID 获取单条情报
 */
export async function getItemById(id: number) {
  const [item] = await db
    .select()
    .from(newsItems)
    .where(eq(newsItems.id, id))
    .limit(1);
  return item || null;
}

/**
 * 增加情报浏览量
 */
export async function incrementViewCount(id: number) {
  await db
    .update(newsItems)
    .set({ viewCount: sql`${newsItems.viewCount} + 1` })
    .where(eq(newsItems.id, id))
    .run();
}

/**
 * 分页查询情报（供 API 路由使用）
 */
export async function getItemsPaginated(
  filters: ItemFilters & { source?: string },
  page: number,
  limit: number
) {
  const conditions: SQL[] = [];

  const selectedCategories = parseCategoryFilter(filters.category);
  if (selectedCategories.length === 1) {
    conditions.push(eq(newsItems.category, selectedCategories[0]));
  } else if (selectedCategories.length > 1) {
    conditions.push(inArray(newsItems.category, selectedCategories));
  }
  if (filters.importance) {
    conditions.push(eq(newsItems.importance, parseInt(filters.importance, 10)));
  }
  if (filters.source) {
    conditions.push(eq(newsItems.source, filters.source));
  }
  if (filters.search) {
    conditions.push(like(newsItems.title, `%${filters.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsItems)
    .where(whereClause);
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const offset = (safePage - 1) * limit;

  const items = await db
    .select()
    .from(newsItems)
    .where(whereClause)
    .orderBy(desc(newsItems.publishedAt), desc(newsItems.importance), desc(newsItems.id))
    .limit(limit)
    .offset(offset);

  return {
    items,
    pagination: {
      page: safePage,
      limit,
      total: count,
      totalPages,
    },
  };
}

// ========== 采集任务相关查询 ==========

export const STALE_COLLECTION_RUN_MS = 45 * 60 * 1000;

/**
 * 获取正在运行的任务
 */
export async function getRunningCollectionRun() {
  const [running] = await db
    .select()
    .from(collectionRuns)
    .where(eq(collectionRuns.status, 'running'))
    .orderBy(desc(collectionRuns.id))
    .limit(1);
  return running || null;
}

/**
 * 获取指定任务；未提供 ID 时优先返回运行中的任务，否则返回最近任务
 */
export async function getCollectionRun(id?: number) {
  if (id) {
    const [run] = await db
      .select()
      .from(collectionRuns)
      .where(eq(collectionRuns.id, id))
      .limit(1);
    return run || null;
  }

  const running = await getRunningCollectionRun();
  if (running) {
    return running;
  }

  const [latest] = await db
    .select()
    .from(collectionRuns)
    .orderBy(desc(collectionRuns.id))
    .limit(1);
  return latest || null;
}

/**
 * 自动结束属于旧进程或长时间没有心跳的遗留任务
 */
export async function recoverStaleCollectionRuns(
  workerId: string,
  staleAfterMs = STALE_COLLECTION_RUN_MS
): Promise<number[]> {
  const cutoff = new Date(Date.now() - staleAfterMs).toISOString();
  const staleCondition = and(
    eq(collectionRuns.status, 'running'),
    sql`(
      ${collectionRuns.workerId} IS NULL
      OR ${collectionRuns.workerId} = ''
      OR ${collectionRuns.workerId} <> ${workerId}
      OR COALESCE(NULLIF(${collectionRuns.heartbeatAt}, ''), ${collectionRuns.startedAt}) < ${cutoff}
    )`
  );

  const staleRuns = await db
    .select({ id: collectionRuns.id })
    .from(collectionRuns)
    .where(staleCondition);

  if (staleRuns.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const ids = staleRuns.map((run) => run.id);
  await db
    .update(collectionRuns)
    .set({
      status: 'failed',
      finishedAt: now,
      heartbeatAt: now,
      error: '任务执行进程已退出或长时间无心跳，系统已自动结束该任务',
    })
    .where(inArray(collectionRuns.id, ids))
    .run();

  return ids;
}

/**
 * 创建新的采集任务记录
 */
export async function createCollectionRun(runType: string, workerId: string) {
  const now = new Date().toISOString();
  const [run] = await db
    .insert(collectionRuns)
    .values({
      runType,
      status: 'running',
      startedAt: now,
      heartbeatAt: now,
      workerId,
    })
    .returning();
  return run;
}

/**
 * 更新任务心跳及阶段进度
 */
export async function touchCollectionRun(
  id: number,
  progress: {
    itemsFound?: number;
    itemsCreated?: number;
    itemsFailed?: number;
  } = {}
) {
  await db
    .update(collectionRuns)
    .set({
      heartbeatAt: new Date().toISOString(),
      ...progress,
    })
    .where(and(eq(collectionRuns.id, id), eq(collectionRuns.status, 'running')))
    .run();
}

/**
 * 记录单条 AI 处理结果，同时刷新任务心跳
 */
export async function incrementCollectionRunAiProgress(id: number, succeeded: boolean) {
  const progress = succeeded
    ? { aiProcessed: sql`${collectionRuns.aiProcessed} + 1` }
    : { aiFailed: sql`${collectionRuns.aiFailed} + 1` };

  await db
    .update(collectionRuns)
    .set({
      heartbeatAt: new Date().toISOString(),
      ...progress,
    })
    .where(and(eq(collectionRuns.id, id), eq(collectionRuns.status, 'running')))
    .run();
}

/**
 * 更新采集任务状态
 */
export async function finishCollectionRun(
  id: number,
  stats: {
    status: 'completed' | 'failed';
    itemsFound: number;
    itemsCreated: number;
    itemsFailed: number;
    error?: string;
  }
) {
  await db
    .update(collectionRuns)
    .set({
      status: stats.status,
      finishedAt: new Date().toISOString(),
      itemsFound: stats.itemsFound,
      itemsCreated: stats.itemsCreated,
      itemsFailed: stats.itemsFailed,
      heartbeatAt: new Date().toISOString(),
      error: stats.error || null,
    })
    .where(eq(collectionRuns.id, id))
    .run();
}

/**
 * 去重插入情报条目（基于 url 唯一约束）
 * 返回 true 表示成功插入，false 表示已存在
 */
export async function insertNewsItemIfNew(item: {
  url: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
}): Promise<boolean> {
  // 先检查是否已存在
  const [existing] = await db
    .select({ id: newsItems.id })
    .from(newsItems)
    .where(eq(newsItems.url, item.url))
    .limit(1);

  if (existing) {
    return false;
  }

  // 插入新条目
  await db.insert(newsItems).values({
    url: item.url,
    title: item.title,
    summary: item.summary,
    source: item.source,
    sourceUrl: item.sourceUrl,
    publishedAt: normalizePublishedDate(item.publishedAt),
    collectedAt: new Date().toISOString(),
    processingStatus: 'pending',
  }).run();

  return true;
}

// ========== AI 处理相关查询 ==========

/**
 * 获取全部待处理的情报条目
 */
export async function getPendingItems() {
  return db
    .select()
    .from(newsItems)
    .where(eq(newsItems.processingStatus, 'pending'))
    .orderBy(desc(newsItems.collectedAt));
}

/**
 * 更新情报条目的 AI 处理结果
 */
export async function updateItemProcessing(
  id: number,
  data: {
    titleCn: string;
    summaryCn: string;
    keyPoints: string[];
    tags: string[];
    category: string;
    importance: number;
    reason: string;
  }
) {
  await db
    .update(newsItems)
    .set({
      titleCn: data.titleCn,
      summaryCn: data.summaryCn,
      keyPoints: JSON.stringify(data.keyPoints),
      tags: JSON.stringify(data.tags),
      category: data.category,
      importance: data.importance,
      reason: data.reason,
      processingStatus: 'processed',
      processedAt: new Date().toISOString(),
    })
    .where(eq(newsItems.id, id))
    .run();
}

/**
 * 标记处理失败
 */
export async function markItemProcessingFailed(id: number, error: string) {
  await db
    .update(newsItems)
    .set({
      processingStatus: 'failed',
      processedAt: new Date().toISOString(),
    })
    .where(eq(newsItems.id, id))
    .run();
  console.error(`条目 ${id} 处理失败:`, error);
}

/**
 * 获取待处理条目数量
 */
export async function getPendingCount(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsItems)
    .where(eq(newsItems.processingStatus, 'pending'));
  return count;
}

/**
 * 获取全部需要重新处理的条目（pending + failed）
 */
export async function getReprocessableItems() {
  return db
    .select()
    .from(newsItems)
    .where(or(
      eq(newsItems.processingStatus, 'pending'),
      eq(newsItems.processingStatus, 'failed')
    ))
    .orderBy(desc(newsItems.collectedAt));
}

/**
 * 获取未处理条目统计
 */
export async function getProcessingStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when ${newsItems.processingStatus} = 'pending' then 1 else 0 end)`,
      processed: sql<number>`sum(case when ${newsItems.processingStatus} = 'processed' then 1 else 0 end)`,
      failed: sql<number>`sum(case when ${newsItems.processingStatus} = 'failed' then 1 else 0 end)`,
      invalid: sql<number>`sum(case when ${newsItems.processingStatus} = 'invalid' then 1 else 0 end)`,
    })
    .from(newsItems);

  return {
    total: stats?.total || 0,
    pending: stats?.pending || 0,
    processed: stats?.processed || 0,
    failed: stats?.failed || 0,
    invalid: stats?.invalid || 0,
  };
}

/**
 * 标记条目 URL 无效（404 等）
 */
export async function markItemInvalid(id: number) {
  await db
    .update(newsItems)
    .set({
      processingStatus: 'invalid',
    })
    .where(eq(newsItems.id, id))
    .run();
}

/**
 * 获取最近插入的条目（用于 URL 验证）
 */
export async function getRecentItems(limit = 50) {
  return db
    .select({ id: newsItems.id, url: newsItems.url })
    .from(newsItems)
    .orderBy(desc(newsItems.collectedAt))
    .limit(limit);
}
