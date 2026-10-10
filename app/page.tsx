import Image from 'next/image';
import Link from 'next/link';
import { projects } from '../data/developer-projects';
import media from '../data/workshop-media.json';

const summaries: Record<string, string> = {
  GibbonPfp: 'Consistent portraits, entirely on your device. Face-aware crops, RAW development, and batch export.',
  Immichinko: 'Rediscover your photo library, ten photographs at a time. Review, favorite, and come back tomorrow.',
  'immich-contact': 'Turn an Immich album into a contact sheet. Full-frame grids, film strips, and export previews.',
  strider: 'A collaborative home for projects. Kanban boards, passkeys, and a Hall of Fame for finished work.',
  quester: 'A private photography quest workspace. Compose without cropping and connect your Immich library.',
  sharplysearch: 'Photography gear, one Wayland shortcut away. Find cameras, lenses, and their specifications.',
  NoMarky: 'A small browser extension that filters YouTube recommendations by creator.',
  wifiqr: 'Share your current Wi-Fi connection as a QR code, straight from the macOS terminal.',
  sharply: 'A community database for photography gear, specifications, and reviews. My fork of Sharply.',
};

function ProjectList({ start, end }: { start: number; end: number }) {
  return <ul className="project-list">{projects.slice(start, end).map(project => (
    <li key={project.repo}>
      <h3><a href={`https://github.com/wispdevon/${project.repo}`}>{project.name}</a></h3>
      <p>{summaries[project.repo] ?? project.description}</p>
    </li>
  ))}</ul>;
}

export default function Home() {
  return (
    <div className="portfolio">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Devon Labs home">Devon Labs</Link>
        <nav aria-label="Main navigation">
          <a href="#software">Software</a><a href="#photography">Photography</a><a href="#elsewhere">Elsewhere</a>
        </nav>
      </header>
      <main id="main">
        <section className="intro" aria-labelledby="intro-heading">
          <h1 id="intro-heading">Hello, I’m Wisp.</h1>
          <p className="intro-lead">I make software, take photographs, and build things.</p>
          <p className="intro-about">Devon Labs is my independent creative workshop in Thailand.</p>
          <a className="intro-link" href="https://github.com/wispdevon">Find me on GitHub <span aria-hidden="true">↗</span></a>
        </section>
        <section className="work-section" id="software" aria-labelledby="software-heading">
          <div className="section-label"><h2 id="software-heading">01 / Software</h2><p>Tools for photographs,<br className="desktop-break" /> projects, and everyday life.</p></div>
          <div className="software-columns"><ProjectList start={0} end={5} /><ProjectList start={5} end={9} /></div>
        </section>
        <section className="work-section" id="photography" aria-labelledby="photography-heading">
          <div className="section-label"><h2 id="photography-heading">02 / Photography</h2><p>People, places, and the moments in between.</p></div>
          <div>
            <a className="photo-strip" href={media.source} aria-label="View The Best photography collection">
              {media.photos.slice(0, 3).map(photo => <Image key={photo.id} src={photo.image} alt={photo.alt} width={1066} height={1600} sizes="(max-width: 600px) 30vw, 220px" loading="lazy" className="photo" />)}
            </a>
            <a className="collection-link" href={media.source}>The Best <span aria-hidden="true">↗</span></a>
          </div>
        </section>
        <section className="work-section elsewhere" id="elsewhere" aria-labelledby="elsewhere-heading">
          <div className="section-label"><h2 id="elsewhere-heading">03 / Elsewhere</h2><p>Films, hardware, and ongoing experiments.</p></div>
          <ul className="project-list">
            <li><h3><a href="https://photo.devonlabs.space/the-one-camp-26/">The One Camp ’26 <span aria-hidden="true">↗</span></a></h3><p>A camp film made with photographers, videographers, and creatives.</p></li>
            <li><h3><a href="https://shop.1337sheets.com/">1337 Sheets <span aria-hidden="true">↗</span></a></h3><p>My hardware shop. Current products, specifications, and availability.</p></li>
            <li><h3><a href="https://github.com/wispdevon">GitHub <span aria-hidden="true">↗</span></a></h3><p>Code, experiments, and ongoing projects.</p></li>
          </ul>
        </section>
      </main>
      <footer><span>Devon Labs</span><a href="/workshop/">Explore the illustrated workshop <span aria-hidden="true">↗</span></a><span>Made with curiosity.</span></footer>
    </div>
  );
}
