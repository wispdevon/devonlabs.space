import media from '../../data/workshop-media.json';
import SiteShell, { Arrow, pageMetadata } from '../portfolio/site-shell';
import Gallery from './gallery';

export const metadata = pageMetadata('photography', 'People, places, and the moments in between. Photographs by Wisp.');

export default function PhotographyPage() {
  return <SiteShell page="photography"><div className="page-heading"><h1>Photography</h1><div className="heading-summary"><p>People, places, and the moments in between.</p><a className="text-link" href={media.source}>Open The Best <Arrow /></a></div></div><Gallery /></SiteShell>;
}
