import Parser from 'rss-parser';
import { normalizePublishedDate } from '@/lib/utils';

// RSS 源配置
export const RSS_FEEDS = [
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    sourceUrl: 'https://techcrunch.com',
  },
  {
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    sourceUrl: 'https://www.theverge.com',
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    sourceUrl: 'https://venturebeat.com',
  },
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT',
    sourceUrl: 'https://news.ycombinator.com',
  },
  {
    name: 'MIT Tech Review',
    url: 'https://www.technologyreview.com/feed/',
    sourceUrl: 'https://www.technologyreview.com',
  },
];

// 需要移除的 URL 追踪参数
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'ref', 'source', 'via', 'share',
];

/**
 * 规范化 URL：去除追踪参数、trailing slash、lowercase domain
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // 移除追踪参数
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }
    // 移除 trailing slash（但保留根路径 /）
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * 标准化 RSS 条目
 */
export interface RSSItem {
  url: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
}

/**
 * 从 RSS 条目中提取纯文本摘要
 */
function extractSummary(item: Parser.Item): string {
  // 优先使用 contentSnippet，其次 content
  const raw = item.contentSnippet || item.content || '';
  // 去除 HTML 标签
  return raw.replace(/<[^>]*>/g, '').trim();
}

/**
 * 获取并解析单个 RSS feed
 */
async function fetchFeed(
  feedConfig: (typeof RSS_FEEDS)[number]
): Promise<RSSItem[]> {
  const parser = new Parser({
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-Daily-Agent/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    maxRedirects: 5,
  });

  try {
    console.log(`📡 正在获取 RSS: ${feedConfig.name} ...`);
    const feed = await parser.parseURL(feedConfig.url);
    const items = (feed.items || []).map((item) => ({
      url: normalizeUrl(item.link || item.guid || ''),
      title: (item.title || '').trim(),
      summary: extractSummary(item),
      source: feedConfig.name,
      sourceUrl: feedConfig.sourceUrl,
      publishedAt: normalizePublishedDate(item.isoDate || item.pubDate),
    })).filter((item) => item.url && item.title);

    console.log(`✅ ${feedConfig.name}: 获取到 ${items.length} 条`);
    return items;
  } catch (error) {
    console.error(`❌ 获取 RSS 失败 [${feedConfig.name}]:`, error);
    return [];
  }
}

/**
 * 采集所有 RSS 源
 */
export async function collectAllFeeds(): Promise<RSSItem[]> {
  console.log(`\n🚀 开始采集 ${RSS_FEEDS.length} 个 RSS 源...`);
  const startTime = Date.now();

  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed))
  );

  const items: RSSItem[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
      successCount++;
    } else {
      failCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n📊 RSS 采集完成: ${successCount} 个源成功, ${failCount} 个失败, 共 ${items.length} 条, 耗时 ${elapsed}s`);

  return items;
}
