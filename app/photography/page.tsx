import media from '../../data/workshop-media.json';
import SiteShell, { Arrow, pageMetadata } from '../portfolio/site-shell';
import Gallery from './gallery';
import bundles from '../../data/photography-bundles.json';
import ResponsiveImage from '../portfolio/responsive-image';
import EventCoverage from './event-coverage';

export const metadata = pageMetadata('photography', 'People, places, and the moments in between. Photographs by Wisp.');

export default function PhotographyPage() {
  return <SiteShell page="photography"><div className="page-heading"><h1>Photography</h1><div className="heading-summary"><p>People, places, and the moments in between.</p><a className="text-link" href={media.source}>Open The Best <Arrow /></a></div></div><EventCoverage /><Gallery />
    <section className="photo-bundles" aria-labelledby="photo-bundles-heading">
      <h2 id="photo-bundles-heading">Photo bundles</h2>
      <p>Latest photo stories from The Depot.</p>
      {bundles.map(bundle => <article className="photo-bundle" key={bundle.url}>
        <div className="photo-bundle-heading"><h3><a href={bundle.url}>{bundle.title} <Arrow /></a></h3><time dateTime={new Date(bundle.publishedAt).toISOString().slice(0, 10)}>{new Date(bundle.publishedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</time></div>
        <div className="photo-bundle-images">{bundle.photos.map((photo, index) => <ResponsiveImage key={photo.image} src={photo.image} alt={photo.alt} width={1600} height={1067} sizes={`${index === 2 ? "(max-width: 600px) calc(100vw - 40px)" : "(max-width: 600px) calc((100vw - 52px) / 2)"}, (max-width: 850px) calc((100vw - 100px) / 3), (max-width: 1280px) calc((100vw - 384px - clamp(60px, 8vw, 140px)) / 3), 275px`} />)}</div>
        <a className="text-link" href={bundle.url}>View the full photo bundle <Arrow /></a>
      </article>)}
    </section>
  </SiteShell>;
}
