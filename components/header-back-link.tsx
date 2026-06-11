'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function getSafeReturnHref(from: string | null): string {
  if (!from) {
    return '/#latest';
  }

  if (from === '/' || from.startsWith('/?') || from.startsWith('/#')) {
    return from;
  }

  return '/#latest';
}

export function HeaderBackLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnHref = getSafeReturnHref(searchParams.get('from'));

  if (!pathname.startsWith('/items/')) {
    return null;
  }

  return (
    <Link
      href={returnHref}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-orange-100 bg-white/80 px-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
      aria-label="返回情报流"
    >
      <ArrowLeft className="size-4" />
      <span className="hidden sm:inline">返回情报流</span>
    </Link>
  );
}
