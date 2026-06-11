import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  GitBranch,
  Lightbulb,
  Newspaper,
  Wrench,
} from 'lucide-react';

// ========== 分类元数据 ==========

export const categoryMeta: Record<
  string,
  { label: string; icon: LucideIcon; badge: string; iconBg: string }
> = {
  news: {
    label: '新闻',
    icon: Newspaper,
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    iconBg: 'bg-orange-100 text-orange-700',
  },
  paper: {
    label: '论文',
    icon: BookOpen,
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
  tool: {
    label: '工具',
    icon: Wrench,
    badge: 'border-teal-200 bg-teal-50 text-teal-700',
    iconBg: 'bg-teal-100 text-teal-700',
  },
  project: {
    label: '开源',
    icon: GitBranch,
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  opinion: {
    label: '观点',
    icon: Lightbulb,
    badge: 'border-stone-200 bg-stone-50 text-stone-700',
    iconBg: 'bg-stone-100 text-stone-700',
  },
};

// ========== 分类标签映射 ==========

export const categoryLabels: Record<string, string> = {
  news: '新闻',
  paper: '论文',
  tool: '工具',
  project: '开源',
  opinion: '观点',
};

// ========== 筛选选项 ==========

export const categories = [
  { value: '', label: '全部' },
  { value: 'news', label: '新闻' },
  { value: 'paper', label: '论文' },
  { value: 'tool', label: '工具' },
  { value: 'project', label: '开源' },
  { value: 'opinion', label: '观点' },
];

export const importanceLevels = [
  { value: '', label: '全部' },
  { value: '5', label: '5 星' },
  { value: '4', label: '4 星' },
  { value: '3', label: '3 星' },
];
