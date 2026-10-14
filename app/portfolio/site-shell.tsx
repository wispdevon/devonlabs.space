import Link from 'next/link';
import { PageFrame, MainNavigation } from './route-shell';
import { colors } from './site-config';

export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function ForwardArrow() { return <span aria-hidden="true">→</span>; }

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return <PageFrame>
    <svg className="tone-definitions" width="0" height="0" aria-hidden="true"><defs>
      {Object.entries(colors).map(([page, [red, green, blue]]) => <filter key={page} id={`tone-${page}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer><feFuncR type="table" tableValues={red}/><feFuncG type="table" tableValues={green}/><feFuncB type="table" tableValues={blue}/></feComponentTransfer>
      </filter>)}
    </defs></svg>
    <div className="portfolio-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="p-header">
        <Link prefetch={false} href="/" className="p-wordmark">Devon Labs</Link>
        <MainNavigation />
      </header>
      <main id="main">{children}</main>
      <footer className="p-footer"><Link prefetch={false} href="/">Devon Labs</Link><div><a href="https://github.com/wispdevon">GitHub</a><a href="https://bsky.app/profile/wispdevon.bsky.social">Bluesky</a><a href="https://www.last.fm/user/wisp-">Last.fm</a></div></footer>
    </div>
  </PageFrame>;
}
