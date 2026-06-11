/**
 * arXiv 采集器 — 获取 AI 相关论文
 * 使用 arXiv API: https://export.arxiv.org/api/query
 */

// arXiv 分类
const ARXIV_CATEGORIES = ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV'];

// 每次获取的论文数量
const MAX_RESULTS = 20;

// 导入 RSSItem 类型（复用结构）
import type { RSSItem } from './rss';
import { normalizeUrl } from './rss';
import { normalizePublishedDate } from '@/lib/utils';

/**
 * 构建 arXiv API 查询 URL
 */
function buildArxivQuery(): string {
  // 查询最近 24 小时内提交的 AI 相关论文
  const catQuery = ARXIV_CATEGORIES.map(c => `cat:${c}`).join('+OR+');
  const params = new URLSearchParams({
    search_query: catQuery,
    start: '0',
    max_results: String(MAX_RESULTS),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  });
  return `https://export.arxiv.org/api/query?${params.toString()}`;
}

/**
 * 解析 arXiv XML 响应
 */
function parseArxivResponse(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // 简单 XML 解析（arXiv 返回 Atom 格式）
  const entries = xml.split('<entry>').slice(1);

  for (const entry of entries) {
    try {
      // 提取字段
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';

      // 提取 PDF 链接
      const pdfLink = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]*)"/)?.[1] || '';

      if (!id || !title) continue;

      const url = normalizeUrl(pdfLink || id);

      items.push({
        url,
        title: title.replace(/\n/g, ' '),
        summary: summary.slice(0, 500),
        source: 'arXiv',
        sourceUrl: 'https://arxiv.org',
        publishedAt: normalizePublishedDate(published),
      });
    } catch {
      // 跳过解析失败的条目
    }
  }

  return items;
}

/**
 * 从 arXiv 获取 AI 论文
 */
export async function collectArxiv(): Promise<RSSItem[]> {
  console.log('📚 正在获取 arXiv AI 论文...');

  try {
    const url = buildArxivQuery();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Daily-Agent/1.0 (Academic Paper Collector)',
      },
    });

    if (!response.ok) {
      throw new Error(`arXiv API 返回 ${response.status}`);
    }

    const xml = await response.text();
    const items = parseArxivResponse(xml);

    console.log(`✅ arXiv: 获取到 ${items.length} 篇论文`);
    return items;
  } catch (error) {
    console.error('❌ arXiv 采集失败:', error);
    return [];
  }
}
