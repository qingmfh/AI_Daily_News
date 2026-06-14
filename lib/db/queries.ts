import { and, desc, eq, gte, inArray, like, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from './client';
import { newsItems, collectionRuns } from './schema';
import { getStartOfToday, normalizePublishedDate } from '@/lib/utils';

interface ItemFilters {
  category?: string;
  importance?: string;
  search?: string;
}

export type AssistantReferenceItem = {
  id: number;
  url: string;
  title: string;
  titleCn: string | null;
  summary: string | null;
  summaryCn: string | null;
  source: string;
  category: string | null;
  tags: string | null;
  keyPoints: string | null;
  importance: number | null;
  reason: string | null;
  publishedAt: string | null;
};

const ASSISTANT_REFERENCE_LIMIT = 8;
const ASSISTANT_SIGNAL_TERMS = [
  'Agent',
  'AI',
  'Claude',
  'GPT',
  'OpenAI',
  'Google',
  'Meta',
  'Microsoft',
  '模型',
  '智能体',
  '多模态',
  '推理',
  '安全',
  '训练',
  '数据',
  '芯片',
  '编程',
  '代码',
  '开源',
  '论文',
  '工具',
  '产品',
];

const CATEGORY_ALIASES: Array<{ category: string; aliases: string[] }> = [
  { category: 'paper', aliases: ['论文', 'paper', 'arxiv', '研究'] },
  { category: 'project', aliases: ['开源', '项目', 'github', 'repo', 'repository'] },
  { category: 'tool', aliases: ['工具', '产品', '框架', 'sdk', '库', '平台'] },
  { category: 'opinion', aliases: ['观点', '评论', '分析'] },
  { category: 'news', aliases: ['新闻', '动态', '发布', '进展'] },
];

function inferAssistantCategories(query: string) {
  const normalized = query.toLowerCase();
  return CATEGORY_ALIASES
    .filter(({ aliases }) => aliases.some((alias) => normalized.includes(alias.toLowerCase())))
    .map(({ category }) => category);
}

function inferAssistantSince(query: string): string | null {
  if (/今天|今日/.test(query)) {
    return getStartOfToday();
  }

  if (/本周|一周|7\s*天|七天/.test(query)) {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  return null;
}

function extractAssistantSearchTerms(query: string) {
  const normalized = query.trim();
  const terms = new Set<string>();

  for (const match of normalized.matchAll(/[A-Za-z][A-Za-z0-9._-]{1,}/g)) {
    terms.add(match[0]);
  }

  const lowerQuery = normalized.toLowerCase();
  for (const term of ASSISTANT_SIGNAL_TERMS) {
    if (lowerQuery.includes(term.toLowerCase())) {
      terms.add(term);
    }
  }

  return Array.from(terms).slice(0, 8);
}

function hasAssistantReferenceIntent(query: string) {
  return /重点|重要|总结|日报|清单|推荐|有哪些|有什么|比较|对比|趋势|动态|进展|本周|今天|今日/.test(query);
}

function selectAssistantReferenceFields() {
  return {
    id: newsItems.id,
    url: newsItems.url,
    title: newsItems.title,
    titleCn: newsItems.titleCn,
    summary: newsItems.summary,
    summaryCn: newsItems.summaryCn,
    source: newsItems.source,
    category: newsItems.category,
    tags: newsItems.tags,
    keyPoints: newsItems.keyPoints,
    importance: newsItems.importance,
    reason: newsItems.reason,
    publishedAt: newsItems.publishedAt,
  };
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
 * 为 AI 助手检索一小组可引用情报。
 *
 * 这是轻量级 SQL 检索，不做向量召回；优先服务“今天/本周/某主题/某分类”
 * 这类情报问答，并把当前详情页条目放在引用列表首位。
 */
export async function getAssistantReferenceItems({
  query,
  itemId,
  limit = ASSISTANT_REFERENCE_LIMIT,
}: {
  query: string;
  itemId?: number;
  limit?: number;
}): Promise<AssistantReferenceItem[]> {
  const references: AssistantReferenceItem[] = [];
  const seenIds = new Set<number>();

  if (itemId) {
    const currentItem = await getItemById(itemId);
    if (currentItem && currentItem.processingStatus !== 'invalid') {
      references.push(currentItem);
      seenIds.add(currentItem.id);
    }
  }

  const categories = inferAssistantCategories(query);
  const since = inferAssistantSince(query);
  const terms = extractAssistantSearchTerms(query);
  const shouldSearch = Boolean(since || categories.length > 0 || terms.length > 0 || hasAssistantReferenceIntent(query));

  if (!shouldSearch || references.length >= limit) {
    return references.slice(0, limit);
  }

  const conditions: SQL[] = [
    sql`${newsItems.processingStatus} != 'invalid'`,
  ];

  if (seenIds.size > 0) {
    conditions.push(notInArray(newsItems.id, Array.from(seenIds)));
  }

  if (since) {
    conditions.push(gte(newsItems.publishedAt, since));
  }

  if (categories.length === 1) {
    conditions.push(eq(newsItems.category, categories[0]));
  } else if (categories.length > 1) {
    conditions.push(inArray(newsItems.category, categories));
  }

  if (terms.length > 0) {
    const termConditions = terms.flatMap((term) => {
      const pattern = `%${term}%`;
      return [
        like(newsItems.title, pattern),
        like(newsItems.titleCn, pattern),
        like(newsItems.summary, pattern),
        like(newsItems.summaryCn, pattern),
        like(newsItems.tags, pattern),
        like(newsItems.source, pattern),
      ];
    });
    const searchCondition = or(...termConditions);
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const items = await db
    .select(selectAssistantReferenceFields())
    .from(newsItems)
    .where(and(...conditions))
    .orderBy(desc(newsItems.importance), desc(newsItems.publishedAt), desc(newsItems.id))
    .limit(Math.max(0, limit - references.length));

  for (const item of items) {
    if (!seenIds.has(item.id)) {
      references.push(item);
      seenIds.add(item.id);
    }
  }

  return references;
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
