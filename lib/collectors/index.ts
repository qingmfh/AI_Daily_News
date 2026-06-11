/**
 * 统一采集入口 — 汇总所有数据源
 */

import { collectAllFeeds, type RSSItem } from './rss';
import { collectArxiv } from './arxiv';
import { collectGitHub } from './github';

export type { RSSItem };

export type CollectorType = 'rss' | 'arxiv' | 'github' | 'all';

/**
 * 根据类型执行对应的采集器
 */
export async function collect(type: CollectorType = 'all'): Promise<{
  items: RSSItem[];
  stats: { rss: number; arxiv: number; github: number };
}> {
  const stats = { rss: 0, arxiv: 0, github: 0 };
  const allItems: RSSItem[] = [];
  const seenUrls = new Set<string>();

  // 去重辅助函数
  const addUnique = (items: RSSItem[]) => {
    for (const item of items) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allItems.push(item);
      }
    }
  };

  if (type === 'all' || type === 'rss') {
    const rssItems = await collectAllFeeds();
    stats.rss = rssItems.length;
    addUnique(rssItems);
  }

  if (type === 'all' || type === 'arxiv') {
    const arxivItems = await collectArxiv();
    stats.arxiv = arxivItems.length;
    addUnique(arxivItems);
  }

  if (type === 'all' || type === 'github') {
    const githubItems = await collectGitHub();
    stats.github = githubItems.length;
    addUnique(githubItems);
  }

  console.log(`\n📊 采集汇总: RSS=${stats.rss}, arXiv=${stats.arxiv}, GitHub=${stats.github}, 去重后=${allItems.length}`);

  return { items: allItems, stats };
}
