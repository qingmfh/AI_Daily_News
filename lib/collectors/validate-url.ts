/**
 * URL 可达性验证
 * 采集后异步检查 URL 是否可访问
 */

// 不需要检查的域名（已知可靠）
const SKIP_DOMAINS = [
  'github.com',
  'arxiv.org',
  'huggingface.co',
];

/**
 * 检查 URL 是否可访问（HEAD 请求）
 * 返回 true 表示可达，false 表示不可达
 */
export async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    // 跳过已知可靠的域名
    if (SKIP_DOMAINS.some(d => parsed.hostname.endsWith(d))) {
      return true;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s 超时

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI-Daily-Agent/1.0 (URL Validator)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 批量检查 URL 可达性
 * 返回不可达的 URL 列表
 */
export async function validateUrls(
  items: Array<{ id: number; url: string }>,
  onBatchComplete?: () => void | Promise<void>
): Promise<number[]> {
  const invalidIds: number[] = [];

  // 并发检查，最多 5 个同时
  const concurrency = 5;
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const reachable = await isUrlReachable(item.url);
        return { id: item.id, reachable };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && !result.value.reachable) {
        invalidIds.push(result.value.id);
      }
    }

    await onBatchComplete?.();
  }

  return invalidIds;
}
