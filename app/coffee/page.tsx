import SiteShell, { pageMetadata } from '../portfolio/site-shell';
import BrewRatio from './brew-ratio';
import OriginMap from './origin-map';
import { coffeeGear, coffeeMethods } from '../../data/coffee';
import { Camera, Video } from 'lucide-react';

export const metadata = pageMetadata('coffee', 'Wisp’s coffee notebook: an origin atlas, brewing gear, methodologies, a photo and video journal, and a brew-ratio calculator.');

export default function CoffeePage() {
  return <SiteShell page="coffee">
    <div className="page-heading"><h1>Coffee</h1><p>A slower kind of notebook.</p></div>
    <p className="editorial-intro">Brews, beans, and small observations. A place for my coffee interests and brewing notes.</p>
    <div className="coffee-still" aria-hidden="true"><svg viewBox="0 0 800 420"><ellipse cx="400" cy="342" rx="160" ry="22" fill="#4d2c22" opacity=".12" /><ellipse cx="400" cy="310" rx="142" ry="26" fill="#f4f1eb" /><path d="M486 170h40c85 0 85 101 0 101h-40" fill="none" stroke="#f4f1eb" strokeWidth="25" /><path d="M285 156h230v112q0 51-115 51t-115-51Z" fill="#f4f1eb" /><ellipse cx="400" cy="156" rx="115" ry="23" fill="#4d2c22" /><ellipse cx="400" cy="152" rx="105" ry="15" fill="#81543b" /><path d="M379 112c-30-25 27-43 0-71m44 71c-30-25 27-43 0-71" fill="none" stroke="#4d2c22" strokeWidth="5" opacity=".35" strokeLinecap="round" /><path d="M305 187v75q0 20 23 29" stroke="white" strokeWidth="8" opacity=".4" fill="none" /></svg><p className="mono">Coffee / Devon Labs</p></div>
    <section className="coffee-section" aria-labelledby="origin-title"><p className="mono coffee-section-number">01 / Origins</p><h2 id="origin-title">Around the world, by the cup.</h2><p>An origin checklist, with room for tasting notes. Select a country on the map or in the list, and check it off when you’ve tried it.</p><OriginMap /></section>
    <section className="coffee-section" aria-labelledby="gear-title"><p className="mono coffee-section-number">02 / Gear</p><h2 id="gear-title">On the counter.</h2><p>My current coffee setup, from hand grinding to filter brews and manual espresso.</p><div className="coffee-detail-list">{coffeeGear.map(item => <article key={item.name}><h3>{item.name}</h3><p>{item.kind}</p></article>)}</div></section>
    <section className="coffee-section" aria-labelledby="method-title"><p className="mono coffee-section-number">03 / Methodologies</p><h2 id="method-title">Making the next cup.</h2><p>A place to document my brewing methods, recipes, and the little changes between cups.</p><div className="coffee-detail-list coffee-method-list">{coffeeMethods.map(item => <article key={item.name}><h3>{item.name}</h3><p>{item.note}</p></article>)}</div><BrewRatio /></section>
    <section className="coffee-section" aria-labelledby="coffee-journal-title"><p className="mono coffee-section-number">04 / Photo &amp; video</p><h2 id="coffee-journal-title">Coffee, in the making.</h2><p>Photos and films of my brewing process, from the first grind to the finished cup.</p><div className="coffee-media"><figure><div className="coffee-media-placeholder"><Camera size={40} strokeWidth={1.3} aria-hidden="true" /><span>Photographs to come</span></div><figcaption>The brewing photo journal.</figcaption></figure><figure><div className="coffee-media-placeholder"><Video size={40} strokeWidth={1.3} aria-hidden="true" /><span>Brewing videos to come</span></div><figcaption>Methods, movement, and a cup at the end.</figcaption></figure></div></section>
    <section className="coffee-conversation" aria-labelledby="coffee-chat-title"><h2 id="coffee-chat-title">Let’s talk coffee.</h2><p>Beans you love, a recipe worth trying, or a question about brewing? I’d like to hear it.</p><div><a href="mailto:wisp@devonlabs.space?subject=Let%E2%80%99s%20talk%20coffee">Email me →</a><a href="https://bsky.app/profile/wispdevon.bsky.social">Find me on Bluesky ↗</a></div></section>
  </SiteShell>;
}
