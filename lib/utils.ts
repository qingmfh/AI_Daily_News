import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 解析 JSON 字符串为数组，解析失败返回空数组
 */
export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 获取今天 00:00:00 的 ISO 字符串
 */
export function getStartOfToday(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

/**
 * 将采集器提供的各种日期格式统一为 UTC ISO 8601。
 */
export function normalizePublishedDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;

  return new Date(timestamp).toISOString();
}

/**
 * 将日期字符串转为相对时间（如 "3 小时前"）
 */
export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '未知时间';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}
