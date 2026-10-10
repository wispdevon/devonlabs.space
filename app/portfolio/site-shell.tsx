import Link from 'next/link';
import type { Metadata } from 'next';
import ThemeToggle from '../theme-toggle';

export type PortfolioPage = 'about' | 'work' | 'software' | 'film' | 'photography' | 'coffee' | 'shop';
const pages: { id: PortfolioPage; label: string; href: string }[] = [
  { id: 'about', label: 'About', href: '/' },
  { id: 'work', label: 'Work', href: '/work/' },
  { id: 'software', label: 'Software', href: '/software/' },
  { id: 'film', label: 'Film', href: '/film/' },
  { id: 'photography', label: 'Photography', href: '/photography/' },
  { id: 'coffee', label: 'Coffee', href: '/coffee/' },
  { id: 'shop', label: 'Shop', href: '/shop/' },
];

const colors: Record<PortfolioPage, [string, string, string]> = {
  about: ['0.204 0.847', '0.133 1', '0.310 0.306'],
  software: ['0.129 0.941', '0.204 0.698', '0.647 0.616'],
  photography: ['0.071 0.929', '0.247 0.612', '0.271 0.529'],
  film: ['0.404 0.965', '0.114 0.741', '0.224 0.522'],
  shop: ['0.094 0.847', '0.302 1', '0.220 0.306'],
  work: ['0.133 0.945', '0.192 0.647', '0.455 0.537'],
  coffee: ['0.302 0.937', '0.173 0.784', '0.133 0.588'],
};

export function pageMetadata(page: PortfolioPage, description: string): Metadata {
  const entry = pages.find(item => item.id === page)!;
  const title = `${entry.label} — Devon Labs`;
  return { title, description, alternates: { canonical: entry.href }, openGraph: { title, description, url: entry.href, siteName: 'Devon Labs', type: 'website' } };
}

export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function ForwardArrow() { return <span aria-hidden="true">→</span>; }

export default function SiteShell({ page, children }: { page: PortfolioPage; children: React.ReactNode }) {
  const [red, green, blue] = colors[page];
  return <div className={`portfolio page-${page}`}>
    <svg className="tone-definitions" width="0" height="0" aria-hidden="true"><defs>
      <filter id={`tone-${page}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer><feFuncR type="table" tableValues={red}/><feFuncG type="table" tableValues={green}/><feFuncB type="table" tableValues={blue}/></feComponentTransfer>
      </filter>
    </defs></svg>
    <div className="portfolio-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="p-header">
        <Link href="/" className="p-wordmark">Devon Labs</Link>
        <div className="p-navigation"><nav aria-label="Main navigation">{pages.map(item => <Link key={item.id} href={item.href} aria-current={item.id === page ? 'page' : undefined}>{item.label}</Link>)}</nav><ThemeToggle /></div>
      </header>
      <main id="main" key={page}>{children}</main>
      <footer className="p-footer"><Link href="/">Devon Labs</Link><div><a href="https://github.com/wispdevon">GitHub</a><a href="https://bsky.app/profile/wispdevon.bsky.social">Bluesky</a><a href="https://www.last.fm/user/wisp-">Last.fm</a></div></footer>
    </div>
  </div>;
}
