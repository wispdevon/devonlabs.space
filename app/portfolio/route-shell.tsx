'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '../theme-toggle';
import { pages } from './site-config';

function useCurrentPage() {
  const pathname = usePathname();
  const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`;
  return pages.find(page => page.href === normalized)?.id;
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  const page = useCurrentPage();
  return <div className={`portfolio${page ? ` page-${page}` : ''}`}>{children}</div>;
}

export function MainNavigation() {
  const page = useCurrentPage();
  const [prefetchHref, setPrefetchHref] = useState<string>();

  function prepareNavigation(href: string) {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')) return;
    setPrefetchHref(href);
  }

  return <div className="p-navigation"><nav aria-label="Main navigation">{pages.map(item => <Link prefetch={prefetchHref === item.href ? null : false} key={item.id} href={item.href} onMouseEnter={() => { if (item.id !== page) prepareNavigation(item.href); }} onFocus={() => { if (item.id !== page) prepareNavigation(item.href); }} aria-current={item.id === page ? 'page' : undefined}>{item.label}</Link>)}</nav><ThemeToggle /></div>;
}
