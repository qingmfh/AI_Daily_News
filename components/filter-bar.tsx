'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RotateCcw, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categories, importanceLevels } from '@/lib/constants';

interface FilterBarProps {
  currentCategory?: string;
  currentImportance?: string;
  currentQuery?: string;
  categoryCounts: Record<string, number>;
}

export function FilterBar({
  currentCategory,
  currentImportance,
  currentQuery,
  categoryCounts,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery || '');
  const selectedCategories = useMemo(
    () => (currentCategory || '').split(',').filter(Boolean),
    [currentCategory]
  );
  const totalCategoryCount = useMemo(
    () => Object.values(categoryCounts).reduce((total, count) => total + count, 0),
    [categoryCounts]
  );

  const hasActiveFilters = useMemo(
    () => Boolean(selectedCategories.length || currentImportance || currentQuery),
    [selectedCategories.length, currentImportance, currentQuery]
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(params.toString() ? `/?${params.toString()}#latest` : '/#latest');
  };

  const toggleCategory = (value: string) => {
    if (!value) {
      updateParam('category', '');
      return;
    }

    const nextCategories = selectedCategories.includes(value)
      ? selectedCategories.filter((category) => category !== value)
      : [...selectedCategories, value];

    updateParam('category', nextCategories.join(','));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParam('q', query.trim());
  };

  const clearFilters = () => {
    setQuery('');
    router.push('/#latest');
  };

  return (
    <div className="surface-soft mb-6 rounded-lg p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
          <SlidersHorizontal className="size-4 text-orange-600" />
          筛选情报
        </div>

        <form onSubmit={handleSearch} className="flex w-full gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、摘要、来源"
              className="h-9 rounded-lg border-orange-100 bg-white pl-9 text-sm focus-visible:border-orange-300 focus-visible:ring-orange-200"
            />
          </div>
          <Button type="submit" className="h-9 bg-orange-600 px-3 text-white hover:bg-orange-700">
            <Search className="size-4" />
            搜索
          </Button>
        </form>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
              <Filter className="size-3.5" />
              类型
            </span>
            {categories.map((cat) => {
              const count = cat.value ? categoryCounts[cat.value] || 0 : totalCategoryCount;
              const active = cat.value ? selectedCategories.includes(cat.value) : selectedCategories.length === 0;
              return (
                <button
                  key={cat.value}
                  type="button"
                  title={cat.value ? `${cat.label} ${count} 条` : `全部 ${count} 条`}
                  aria-pressed={active}
                  onClick={() => toggleCategory(cat.value)}
                  className={`h-8 rounded-lg border px-3 text-sm transition-colors ${
                    active
                      ? 'border-orange-300 bg-orange-100 text-orange-900'
                      : 'border-orange-100 bg-white text-stone-600 hover:border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
              <Star className="size-3.5" />
              重要性
            </span>
            {importanceLevels.map((level) => {
              const active = (currentImportance || '') === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateParam('importance', level.value)}
                  className={`h-8 rounded-lg border px-3 text-sm transition-colors ${
                    active
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-orange-100 bg-white text-stone-600 hover:border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
          className="h-9 border-orange-100 bg-white text-stone-600 hover:bg-orange-50"
        >
          <RotateCcw className="size-4" />
          清空
        </Button>
      </div>
    </div>
  );
}
