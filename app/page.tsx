import Image from 'next/image';
import Link from 'next/link';
import { profile } from '../data/profile';
import SiteShell, { ForwardArrow, pageMetadata } from './portfolio/site-shell';

export const metadata = pageMetadata('about', profile.headline);

export default function AboutPage() {
  return <SiteShell page="about">
    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-introduction"><h1 id="about-title">Hello, I’m Wisp.</h1><p className="about-lead">{profile.headline}</p><p className="about-summary">{profile.introduction}</p></div>
      <figure className="about-photo"><div className="duotone"><Image src="/workshop/photos/01.webp" alt="Architectural columns and geometric details, in violet and lime duotone" width={1066} height={1600} sizes="(max-width: 700px) 90vw, 340px" priority /></div><figcaption>A frame from <Link href="/photography/">The Best.</Link></figcaption></figure>
    </section>
    <div className="about-details">
      <section aria-labelledby="making-title"><h2 id="making-title">What I make</h2><p>{profile.whatIMake}</p><ul className="principles">{profile.principles.map(principle => <li key={principle}>{principle}</li>)}</ul></section>
      <section className="working-with" aria-labelledby="stack-title"><h2 id="stack-title">Working with</h2><ul>{profile.stack.map(item => <li key={item}>{item}</li>)}</ul><p>{profile.approach}</p></section>
    </div>
    <section className="about-elsewhere" aria-labelledby="elsewhere-title"><h2 id="elsewhere-title">Elsewhere</h2><p>I build under Devon Labs, share code on <a href="https://github.com/wispdevon">GitHub</a>, and keep the soundtrack running on <a href={profile.lastfm}>Last.fm</a>.</p><a className="text-link profile-source" href={profile.source}>More about me on GitHub <ForwardArrow /></a></section>
    <div className="color-band"><p>{profile.tagline}</p><Link href="/software/">Explore the software <ForwardArrow /></Link></div>
  </SiteShell>;
}
