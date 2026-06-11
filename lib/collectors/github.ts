/**
 * GitHub 采集器 — 获取近期热门 AI 项目
 * 使用 GitHub Search API
 */

import type { RSSItem } from './rss';
import { normalizeUrl } from './rss';
import { normalizePublishedDate } from '@/lib/utils';

// 搜索关键词
const SEARCH_QUERIES = [
  'topic:ai created:>={date}',
  'topic:machine-learning created:>={date}',
  'topic:llm created:>={date}',
];

// 每个查询获取的项目数量
const PER_QUERY_LIMIT = 10;

// 导入 RSSItem 类型

/**
 * 获取 N 天前的日期字符串（YYYY-MM-DD）
 */
function getDaysAgoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * 从 GitHub Search API 获取项目
 */
async function searchGitHub(
  query: string,
  token?: string
): Promise<RSSItem[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${PER_QUERY_LIMIT}`;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-Daily-Agent/1.0',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API 返回 ${response.status}`);
  }

  const data = await response.json();

  return (data.items || []).map((repo: Record<string, unknown>) => {
    const repoData = repo as {
      html_url: string;
      name: string;
      description: string | null;
      stargazers_count: number;
      language: string | null;
      topics: string[];
      created_at: string;
      updated_at: string;
    };

    return {
      url: normalizeUrl(repoData.html_url),
      title: `${repoData.name} — ${repoData.description || 'No description'}`,
      summary: [
        repoData.description || '',
        `⭐ ${repoData.stargazers_count} stars`,
        repoData.language ? `语言: ${repoData.language}` : '',
        repoData.topics?.length ? `标签: ${repoData.topics.slice(0, 5).join(', ')}` : '',
      ].filter(Boolean).join(' | '),
      source: 'GitHub',
      sourceUrl: 'https://github.com',
      publishedAt: normalizePublishedDate(repoData.created_at || repoData.updated_at),
    };
  });
}

/**
 * 从 GitHub 获取热门 AI 项目
 */
export async function collectGitHub(): Promise<RSSItem[]> {
  console.log('🐙 正在获取 GitHub 热门 AI 项目...');

  const token = process.env.GITHUB_TOKEN;
  const dateThreshold = getDaysAgoDate(7); // 最近 7 天

  const queries = SEARCH_QUERIES.map(q => q.replace('{date}', dateThreshold));
  const allItems: RSSItem[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const items = await searchGitHub(query, token);
      for (const item of items) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allItems.push(item);
        }
      }
    } catch (error) {
      console.error(`❌ GitHub 搜索失败 [${query.slice(0, 30)}...]:`, error);
    }
  }

  console.log(`✅ GitHub: 获取到 ${allItems.length} 个项目`);
  return allItems;
}
