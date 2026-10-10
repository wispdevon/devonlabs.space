import SiteShell, { pageMetadata } from '../portfolio/site-shell';
import FilmPlayer from './film-player';

export const metadata = pageMetadata('film', 'The One Camp ’26 — a collaborative camp film by Wisp and fellow creatives.');

export default function FilmPage() {
  return <SiteShell page="film"><div className="page-heading"><h1>Film</h1><p>Stories made together.</p></div><FilmPlayer /></SiteShell>;
}
