import { Search } from 'lucide-react';
import { AssistantPageContextBridge } from '@/components/assistant-page-context';
import { FilterBar } from '@/components/filter-bar';
import { ItemCard } from '@/components/item-card';
import { Pagination } from '@/components/pagination';
import { buildHomePageContext } from '@/lib/ai/page-context';
import { getCategoryCounts, getLatestItems } from '@/lib/db/queries';

type SearchParams = {
  category?: string;
  importance?: string;
  q?: string;
  page?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const returnParams = new URLSearchParams();

  if (params.category) {
    returnParams.set('category', params.category);
  }
  if (params.importance) {
    returnParams.set('importance', params.importance);
  }
  if (params.q) {
    returnParams.set('q', params.q);
  }
  if (params.page && page > 1) {
    returnParams.set('page', String(page));
  }

  const listReturnHref = returnParams.toString()
    ? `/?${returnParams.toString()}#latest`
    : '/#latest';

  const [{ items: latestItems, pagination }, categoryCounts] = await Promise.all([
    getLatestItems(
      {
        category: params.category,
        importance: params.importance,
        search: params.q,
      },
      page
    ),
    getCategoryCounts(),
  ]);
  const pageContext = buildHomePageContext({
    items: latestItems,
    currentCategory: params.category,
    currentImportance: params.importance,
    currentQuery: params.q,
    page: pagination.page,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <AssistantPageContextBridge scopeKey={listReturnHref} content={pageContext} />
      <section id="latest">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-stone-950">
            {params.q ? `搜索："${params.q}"` : '按时间和重要性整理'}
          </h2>
        </div>

        <FilterBar
          currentCategory={params.category}
          currentImportance={params.importance}
          currentQuery={params.q}
          categoryCounts={categoryCounts}
        />

        {latestItems.length > 0 ? (
          <>
            <div className="space-y-3">
              {latestItems.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  titleCn={item.titleCn}
                  title={item.title}
                  summaryCn={item.summaryCn}
                  source={item.source}
                  category={item.category}
                  tags={item.tags}
                  importance={item.importance}
                  publishedAt={item.publishedAt}
                  processingStatus={item.processingStatus}
                  returnHref={listReturnHref}
                />
              ))}
            </div>

            <Pagination {...pagination} />
          </>
        ) : (
          <div className="surface-soft rounded-lg px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <Search className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-stone-950">没有找到匹配的情报</h3>
            <p className="mt-2 text-sm text-stone-500">换一个关键词，或清空筛选条件后再试。</p>
          </div>
        )}
      </section>
    </div>
  );
}
