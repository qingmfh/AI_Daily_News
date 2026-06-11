import Link from 'next/link';
import { ArrowRight, Clock3, LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImportanceStars } from '@/components/importance-stars';
import { categoryMeta } from '@/lib/constants';
import { parseJsonArray, relativeTime } from '@/lib/utils';

interface ItemCardProps {
  id: number;
  titleCn: string | null;
  title: string;
  summaryCn: string | null;
  source: string;
  category: string | null;
  tags: string | null;
  importance: number | null;
  publishedAt: string | null;
  processingStatus?: string | null;
  returnHref?: string;
}

export function ItemCard({
  id,
  titleCn,
  title,
  summaryCn,
  source,
  category,
  tags,
  importance,
  publishedAt,
  processingStatus,
  returnHref = '/#latest',
}: ItemCardProps) {
  const displayTitle = titleCn || title;
  const displaySummary = summaryCn || '暂无摘要，后续采集任务会补充 AI 处理结果。';
  const parsedTags = parseJsonArray(tags);
  const cat = category || 'news';
  const meta = categoryMeta[cat] || categoryMeta.news;
  const CategoryIcon = meta.icon;
  const isInvalid = processingStatus === 'invalid';
  const itemHref = `/items/${id}?from=${encodeURIComponent(returnHref)}`;

  return (
    <Link href={itemHref} className="group block">
      <article
        className={`grid gap-4 rounded-xl border border-orange-100/80 bg-white p-4 shadow-sm shadow-orange-900/5 transition-all duration-200 hover:border-orange-300 hover:shadow-md hover:shadow-orange-900/10 sm:grid-cols-[92px_minmax(0,1fr)_180px] sm:items-center ${
          isInvalid ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center gap-2 sm:flex-col sm:items-start">
          <span className={`flex size-9 items-center justify-center rounded-lg ${meta.iconBg}`}>
            <CategoryIcon className="size-4" />
          </span>
          <Badge variant="outline" className={`h-6 rounded-md ${meta.badge}`}>
            {meta.label}
          </Badge>
          {isInvalid && (
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-500">
              <LinkIcon className="size-3.5" />
              链接失效
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-stone-950 group-hover:text-orange-800 sm:text-lg">
            {displayTitle}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
            {displaySummary}
          </p>

          {parsedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {parsedTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-orange-50 px-2 py-1 text-xs text-stone-600 ring-1 ring-orange-100"
                >
                  #{tag}
                </span>
              ))}
              {parsedTags.length > 3 && (
                <span className="rounded-md px-2 py-1 text-xs text-stone-400">
                  +{parsedTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-orange-100 pt-3 sm:h-full sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock3 className="size-3.5" />
              <span>{relativeTime(publishedAt)}</span>
            </div>
            <div className="mt-1 truncate text-xs text-stone-500">{source}</div>
            <div className="mt-2">
              <ImportanceStars importance={importance || 3} />
            </div>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center self-end rounded-lg bg-orange-50 text-orange-700 transition-colors group-hover:bg-orange-600 group-hover:text-white">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}
