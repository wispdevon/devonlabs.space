import type { Metadata } from 'next';
import { pages, type PortfolioPage } from './site-config';

export function pageMetadata(page: PortfolioPage, description: string): Metadata {
  const entry = pages.find(item => item.id === page)!;
  const title = `${entry.label} — Devon Labs`;
  return { title, description, twitter: { card: 'summary_large_image', title, description, images: ['/developer/immichinko.webp'] }, alternates: { canonical: entry.href }, openGraph: { title, description, url: entry.href, siteName: 'Devon Labs', type: 'website' } };
}

