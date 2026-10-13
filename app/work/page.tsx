import Image from '../portfolio/responsive-image';
import Link from 'next/link';
import { profile } from '../../data/profile';
import SiteShell, { ForwardArrow, pageMetadata } from '../portfolio/site-shell';

export const metadata = pageMetadata('work', 'Product design, software, photography, and collaborative film by Wisp.');

export default function WorkPage() {
  return <SiteShell page="work">
    <div className="page-heading"><h1>Work</h1><p>From first idea to final detail.</p></div>
    <p className="editorial-intro">{profile.whatIMake}</p>
    <section className="work-index" aria-label="Areas of work">
      <article className="work-entry"><span className="mono work-number">01 / Software</span><div><h2>Tools with a clear job.</h2><p>Photography workflows, self-hosted services, and focused browser interfaces. From Immich Contact Sheet to Strider, small tools built around real tasks.</p><p className="work-disciplines mono">Product design · Interfaces · Backend · Deployment</p><Link prefetch={false} className="text-link" href="/software/">Explore the software <ForwardArrow /></Link></div></article>
      <article className="work-entry"><span className="mono work-number">02 / Photography</span><div><h2>People, places, in between.</h2><figure className="work-photo"><Link prefetch={false} className="duotone" href="/photography/"><Image src="/workshop/photos/06.webp" alt="Birds in flight above city architecture" width={1066} height={1600} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px" /></Link><figcaption>A frame from The Best.</figcaption></figure><p>A selection from my public photograph collection.</p><Link prefetch={false} className="text-link" href="/photography/">See the photographs <ForwardArrow /></Link></div></article>
      <article className="work-entry"><span className="mono work-number">03 / Film</span><div><h2>Stories made together.</h2><p>The One Camp ’26: a collaborative film made with photographers, videographers, and creatives, ready to screen on the third day.</p><Link prefetch={false} className="text-link" href="/film/">Watch the film <ForwardArrow /></Link></div></article>
      <article className="work-entry"><span className="mono work-number">04 / Hardware</span><div><h2>Bjorn The Cyber Viking</h2><p>An autonomous network reconnaissance device with an e-ink cyber-pet interface. A small companion for exploring networks in a lab, bringing embedded tools and a playful display together.</p><p className="work-disciplines mono">Embedded hardware · Network research · E-ink interface</p><a className="text-link" href="https://shop.1337sheets.com/products/bjorn-the-cyber-viking">Explore Bjorn <ForwardArrow /></a></div></article>
      <article className="work-entry"><span className="mono work-number">05 / Hardware</span><div><h2>Blackhole Badge</h2><p>A wireless research badge built around an ESP32 and dual nRF24 radios for 2.4 GHz spectrum testing. Modular options span a bare PCB, a DIY kit, and assembled versions, with an optional OLED display.</p><p className="work-disciplines mono">Embedded hardware · Wireless research · Modular builds</p><a className="text-link" href="https://shop.1337sheets.com/products/blackhole-badge">Explore Blackhole Badge <ForwardArrow /></a></div></article>
    </section>
    <div className="work-contact"><p>Get in touch.</p>{/* Cloudflare's email rewriting changes server markup before hydration. This trusted, static HTML opts this public link out. */}<span dangerouslySetInnerHTML={{ __html: '<!--email_off--><a href="mailto:wisp@devonlabs.space">wisp@devonlabs.space <span aria-hidden="true">→</span></a><!--/email_off-->' }} /></div>
  </SiteShell>;
}
