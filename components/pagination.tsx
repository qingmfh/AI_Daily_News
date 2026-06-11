'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  page,
  total,
  totalPages,
  start,
  end,
  hasPrevious,
  hasNext,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visiblePages = getVisiblePages(page, totalPages);

  const goToPage = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    router.push(`/?${params.toString()}#latest`);
  };

  return (
    <nav
      aria-label="情报分页"
      className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 sm:flex-row"
    >
      <p className="text-xs text-stone-500">
        第 {start}-{end} 条，共 {total} 条
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => goToPage(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-orange-100 bg-white px-2.5 text-sm text-stone-600 transition-colors hover:bg-orange-50 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          上一页
        </button>

        {visiblePages.map((visiblePage, index) => {
          const previousPage = visiblePages[index - 1];
          const showEllipsis = previousPage && visiblePage - previousPage > 1;

          return (
            <span key={visiblePage} className="contents">
              {showEllipsis && <span className="px-1 text-stone-400">...</span>}
              <button
                type="button"
                aria-current={visiblePage === page ? 'page' : undefined}
                onClick={() => goToPage(visiblePage)}
                className={`size-8 rounded-lg border text-sm transition-colors ${
                  visiblePage === page
                    ? 'border-orange-500 bg-orange-600 text-white'
                    : 'border-orange-100 bg-white text-stone-600 hover:bg-orange-50'
                }`}
              >
                {visiblePage}
              </button>
            </span>
          );
        })}

        <label className="ml-1 inline-flex items-center gap-1 text-xs text-stone-500">
          跳至
          <select
            value={page}
            onChange={(event) => goToPage(Number(event.target.value))}
            className="h-8 rounded-lg border border-orange-100 bg-white px-2 text-sm text-stone-700 outline-none focus:border-orange-300"
          >
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <option key={pageNumber} value={pageNumber}>
                {pageNumber}
              </option>
            ))}
          </select>
          页
        </label>

        <button
          type="button"
          disabled={!hasNext}
          onClick={() => goToPage(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-orange-100 bg-white px-2.5 text-sm text-stone-600 transition-colors hover:bg-orange-50 disabled:pointer-events-none disabled:opacity-40"
        >
          下一页
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}
