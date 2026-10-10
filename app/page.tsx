import Image from 'next/image';
import Link from 'next/link';
import { Boxes, Code2, Container, Database, Terminal, Webhook } from 'lucide-react';
import { profile } from '../data/profile';
import SiteShell, { ForwardArrow, pageMetadata } from './portfolio/site-shell';
import DiscordHandle from './portfolio/discord-handle';

export const metadata = pageMetadata('about', profile.headline);
const stackIcons = [Code2, Boxes, Database, Container, Terminal, Webhook];

export default function AboutPage() {
  return <SiteShell page="about">
    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-introduction"><h1 id="about-title">Hello, I’m Wisp.</h1><p className="about-lead">{profile.headline}</p><p className="about-summary">{profile.introduction}</p></div>
      <figure className="about-photo"><div className="duotone"><Image src="/workshop/photos/01.webp" alt="Architectural columns and geometric details, in violet and lime duotone" width={1066} height={1600} sizes="(max-width: 700px) 90vw, 640px" priority /></div><figcaption>A frame from <Link href="/photography/">The Best.</Link></figcaption></figure>
    </section>
    <div className="about-details">
      <section aria-labelledby="making-title"><h2 id="making-title">What I make</h2><p>{profile.whatIMake}</p><ul className="principles">{profile.principles.map(principle => <li key={principle}>{principle}</li>)}</ul></section>
      <div className="about-connections">
        <section className="working-with" aria-labelledby="stack-title"><h2 id="stack-title">Working with</h2><ul>{profile.stack.map((item, index) => { const Icon = stackIcons[index]; return <li key={item}><Icon size={20} strokeWidth={1.7} aria-hidden="true" /><span>{item}</span></li>; })}</ul><p>{profile.approach}</p></section>
        <section className="find-me" aria-labelledby="find-title"><h2 id="find-title" className="visually-hidden">Find me</h2><Image className="contact-portrait" src="/developer/profile.jpg" alt="Wisp’s GitHub profile photograph" width={460} height={460} sizes="(max-width: 600px) 90vw, 350px" /><ul>
          <li><a href="https://github.com/wispdevon">GitHub /wispdevon</a></li>
          <li><a href={profile.lastfm}>Last.fm /wisp-</a></li>
          <li className="discord-contact"><a href="https://discord.com/channels/@me">Discord @wispcream</a><DiscordHandle /></li>
          <li><a href="mailto:wisp@devonlabs.space">Email wisp@devonlabs.space</a></li>
        </ul></section>
      </div>
    </div>
    <div className="color-band"><p>{profile.tagline}</p><Link href="/software/">Explore the software <ForwardArrow /></Link></div>
  </SiteShell>;
}
