'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  return <div className="p-navigation"><nav aria-label="Main navigation">{pages.map(item => <Link prefetch={false} key={item.id} href={item.href} aria-current={item.id === page ? 'page' : undefined}>{item.label}</Link>)}</nav><ThemeToggle /></div>;
}
