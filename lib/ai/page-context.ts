import { categoryLabels } from '@/lib/constants';
import { parseJsonArray } from '@/lib/utils';

type HomePageItemContext = {
  id: number;
  title: string;
  titleCn: string | null;
  summaryCn: string | null;
  source: string;
  category: string | null;
  tags: string | null;
  importance: number | null;
  publishedAt: string | null;
};

type DetailPageItemContext = {
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
  viewCount: number | null;
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) {
    return '未知';
  }

  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatImportance(value: number | null) {
  return `${value || 3}/5`;
}

function formatCategory(value: string | null) {
  return categoryLabels[value || 'news'] || value || '新闻';
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join('、') : '无';
}

export function buildHomePageContext({
  items,
  currentCategory,
  currentImportance,
  currentQuery,
  page,
}: {
  items: HomePageItemContext[];
  currentCategory?: string;
  currentImportance?: string;
  currentQuery?: string;
  page: number;
}) {
  const selectedCategories = (currentCategory || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => formatCategory(value));

  const filters = [
    `分类：${selectedCategories.length > 0 ? selectedCategories.join('、') : '全部'}`,
    `重要性：${currentImportance ? `${currentImportance} 星` : '全部'}`,
    `搜索词：${currentQuery?.trim() || '无'}`,
    `页码：第 ${page} 页`,
  ].join('；');

  const itemLines = items.map((item, index) => {
    const tags = parseJsonArray(item.tags);

    return [
      `${index + 1}. #${item.id} ${item.titleCn || item.title}`,
      `分类：${formatCategory(item.category)}`,
      `来源：${item.source}`,
      `发布时间：${formatDateTime(item.publishedAt)}`,
      `重要性：${formatImportance(item.importance)}`,
      `标签：${formatList(tags)}`,
      `摘要：${item.summaryCn || '暂无摘要'}`,
    ].join('\n');
  });

  return [
    '当前页面：首页情报流',
    `当前筛选条件：${filters}`,
    `当前列表展示 ${items.length} 条情报。以下是页面可见内容：`,
    itemLines.join('\n\n'),
  ].join('\n\n');
}

export function buildItemDetailPageContext(item: DetailPageItemContext) {
  const tags = parseJsonArray(item.tags);
  const keyPoints = parseJsonArray(item.keyPoints);

  return [
    `当前页面：情报详情页 #${item.id}`,
    `标题：${item.titleCn || item.title}`,
    item.titleCn && item.titleCn !== item.title ? `原始标题：${item.title}` : '',
    `分类：${formatCategory(item.category)}`,
    `来源：${item.source}`,
    `发布时间：${formatDateTime(item.publishedAt)}`,
    `重要性：${formatImportance(item.importance)}`,
    `浏览量：${item.viewCount || 0}`,
    item.reason ? `推荐理由：${item.reason}` : '',
    item.summaryCn ? `中文摘要：${item.summaryCn}` : '',
    item.summary ? `原始摘要：${item.summary}` : '',
    keyPoints.length > 0 ? `核心要点：\n${keyPoints.map((point) => `- ${point}`).join('\n')}` : '',
    tags.length > 0 ? `标签：${formatList(tags)}` : '',
    `原文链接：${item.url}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
