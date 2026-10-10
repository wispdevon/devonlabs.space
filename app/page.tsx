import Image from 'next/image';
import media from '../data/workshop-media.json';
import { projects } from '../data/developer-projects';
import ThemeToggle from './theme-toggle';

const summaries: Record<string, string> = {
  GibbonPfp: 'On-device portraits, face-aware crops, RAW development, and batch export.',
  Immichinko: 'Ten photos from your Immich library, every day. Review, favorite, rediscover.',
  'immich-contact': 'Contact sheets from Immich albums, with full-frame grids and film strips.',
  strider: 'Collaborative project boards with passkeys, subtasks, and a Hall of Fame.',
  quester: 'A private photography workspace. Compose without cropping; connect Immich.',
  sharplysearch: 'Find photography gear and specifications from a Wayland shortcut.',
  NoMarky: 'Filter YouTube recommendations by creator with a small browser extension.',
  wifiqr: 'Share your macOS Wi-Fi connection as a QR code from the terminal.',
  sharply: 'Photography gear, specs, and reviews. My fork of the Sharply project.',
};

function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Home() {
  return (
    <div className="portfolio">
      <div className="portfolio-shell">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="identity"><h1>Hello, I’m Wisp.</h1><p className="wordmark">Devon Labs</p></div>
          <div className="navigation">
            <ThemeToggle />
            <nav aria-label="Main navigation">
              <a href="#about">About</a><a href="#software">Software</a><a href="#film">Film</a><a href="#photography">Photography</a><a href="https://shop.1337sheets.com/">Shop</a>
            </nav>
          </div>
        </header>
        <main id="main" className="editorial-columns">
          <section id="software" className="software-column" aria-labelledby="software-heading">
            <h2 id="software-heading">Software</h2>
            <p className="section-intro">Tools for photographs, projects, and everyday life.</p>
            <ul className="project-list">{projects.map(project => <li key={project.repo}>
              <h3><a href={`https://github.com/wispdevon/${project.repo}`}>{project.name}</a></h3>
              <p>{summaries[project.repo] ?? project.description}</p>
              <p className="project-stack">{project.stack.join(' · ')}</p>
            </li>)}</ul>
            <a className="text-link" href="https://github.com/wispdevon?tab=repositories">More on GitHub <Arrow /></a>
          </section>
          <section id="film" className="experiments-column" aria-labelledby="film-heading">
            <h2 id="film-heading">Film &amp; experiments</h2>
            <p className="section-intro">Visual stories, small experiments, and things in between.</p>
            <article className="film-feature">
              <a href="https://photo.devonlabs.space/the-one-camp-26/" className="film-image" aria-label="Watch The One Camp ’26"><Image src="/workshop/camp-poster.jpg" alt="A filmmaker carrying equipment at The One Camp" width={1920} height={1080} sizes="(max-width: 700px) 90vw, 360px" priority /></a>
              <h3><a href="https://photo.devonlabs.space/the-one-camp-26/">The One Camp ’26</a></h3>
              <p>A camp film made with photographers, videographers, and creatives, ready to screen on the third day.</p>
              <p className="project-stack">Film · Collaboration · 2026</p>
            </article>
            <article className="experiment" id="shop">
              <h3><a href="https://shop.1337sheets.com/">1337 Sheets</a></h3>
              <p>My hardware shop. Visit for current products, specifications, and availability.</p>
              <p className="project-stack">Hardware · Shop</p>
            </article>
            <article className="experiment">
              <h3><a href="/workshop/">Illustrated workshop</a></h3>
              <p>A little room of curiosities. Explore the work, collect objects, and repair a few things along the way.</p>
              <p className="project-stack">Interactive · Experiments</p>
              <a className="text-link workshop-link" href="/workshop/">Explore the illustrated workshop <Arrow /></a>
            </article>
          </section>
          <aside className="personal-column" aria-label="About and photography">
            <section id="about" aria-labelledby="about-heading">
              <h2 id="about-heading">About</h2>
              <p className="about-statement">I make software, take photographs, and build things.</p>
              <p className="about-description">Devon Labs is my independent creative workshop in Thailand.</p>
              <div className="profile-links">
                <a href="https://github.com/wispdevon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 18"/></svg><span>Code on GitHub <Arrow /></span></a>
                <a href="https://shop.1337sheets.com/"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10 9-5M12 12 3 7m9 5v10M7.5 4.5l9 5"/></svg><span>Visit the hardware shop <Arrow /></span></a>
              </div>
            </section>
            <section id="photography" className="photography-section" aria-labelledby="photography-heading">
              <h2 id="photography-heading">Photography</h2>
              <p className="section-intro">People, places, and the moments in between.</p>
              <a className="photo-strip" href={media.source} aria-label="View The Best photography collection">{media.photos.slice(0,6).map(photo => <Image key={photo.id} src={photo.image} alt={photo.alt} width={1066} height={1600} sizes="(max-width: 700px) 28vw, 115px" className="photo" />)}</a>
              <a className="text-link collection-link" href={media.source}>The Best <Arrow /></a>
            </section>
          </aside>
        </main>
        <footer><span>Devon Labs</span><span>Made with curiosity.</span></footer>
      </div>
    </div>
  );
}
