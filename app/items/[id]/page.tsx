import { notFound } from 'next/navigation';
import { Clock3, ExternalLink, Eye, FileText, Lightbulb, Star, Tags } from 'lucide-react';
import { AssistantPageContextBridge } from '@/components/assistant-page-context';
import { Badge } from '@/components/ui/badge';
import { ImportanceStars } from '@/components/importance-stars';
import { buildItemDetailPageContext } from '@/lib/ai/page-context';
import { categoryMeta } from '@/lib/constants';
import { parseJsonArray } from '@/lib/utils';
import { getItemById, incrementViewCount } from '@/lib/db/queries';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '未知时间';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (Number.isNaN(itemId)) {
    notFound();
  }

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // 浏览量自增
  await incrementViewCount(itemId);

  const tags = parseJsonArray(item.tags);
  const keyPoints = parseJsonArray(item.keyPoints);
  const cat = item.category || 'news';
  const meta = categoryMeta[cat] || categoryMeta.news;
  const CategoryIcon = meta.icon;
  const pageContext = buildItemDetailPageContext(item);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AssistantPageContextBridge scopeKey={`/items/${item.id}`} content={pageContext} />
      <article className="surface-soft rounded-lg p-5 sm:p-7">
        <header className="mb-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`h-6 rounded-md ${meta.badge}`}>
              <CategoryIcon className="size-3.5" />
              {meta.label}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              <Clock3 className="size-3.5" />
              {formatDate(item.publishedAt)}
            </span>
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-3xl">
            {item.titleCn || item.title}
          </h1>

          {item.titleCn && item.title !== item.titleCn && (
            <p className="mt-4 text-sm leading-6 text-stone-500">{item.title}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-500">
            <span>来源：{item.source}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-4" />
              浏览 {item.viewCount || 0}
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="size-4 text-amber-500" />
              <ImportanceStars importance={item.importance || 3} />
            </span>
          </div>
        </header>

        {item.reason && (
          <section className="mb-6 rounded-lg border border-orange-100 bg-orange-50/70 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-900">
              <Lightbulb className="size-4" />
              推荐理由
            </h2>
            <p className="text-sm leading-6 text-stone-700">{item.reason}</p>
          </section>
        )}

        {keyPoints.length > 0 && (
          <section className="mb-7">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-950">
              <FileText className="size-4 text-orange-700" />
              核心要点
            </h2>
            <ul className="grid gap-2">
              {keyPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-lg border border-orange-100 bg-white px-3 py-2 text-sm leading-6 text-stone-700"
                >
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.summaryCn && (
          <section className="mb-7">
            <h2 className="mb-3 text-base font-semibold text-stone-950">内容摘要</h2>
            <p className="whitespace-pre-wrap rounded-lg border border-orange-100 bg-white p-4 text-sm leading-7 text-stone-700">
              {item.summaryCn}
            </p>
          </section>
        )}

        {tags.length > 0 && (
          <section className="mb-7">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-stone-950">
              <Tags className="size-4 text-orange-700" />
              标签
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="h-7 rounded-md border-orange-100 bg-orange-50 text-stone-600">
                  #{tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-orange-100 pt-5">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-3 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            <ExternalLink className="size-4" />
            查看原文
          </a>
        </div>
      </article>
    </div>
  );
}
