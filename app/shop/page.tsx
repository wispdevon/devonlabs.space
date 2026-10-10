import Image from 'next/image';
import SiteShell, { Arrow, ForwardArrow, pageMetadata } from '../portfolio/site-shell';

export const metadata = pageMetadata('shop', '1337 Sheets, Wisp’s hardware shop, and the illustrated Devon Labs workshop.');

export default function ShopPage() {
  return <SiteShell page="shop">
    <section className="shop-introduction" aria-labelledby="shop-title"><div><h1 id="shop-title">Hardware &amp; curiosities</h1><h2>1337 Sheets</h2><p>My hardware shop. Visit for current products, specifications, and availability.</p><a className="shop-cta" href="https://shop.1337sheets.com/">Visit 1337 Sheets <Arrow /></a></div><div className="hardware-poster" aria-label="1337 Sheets, hardware shop"><p className="mono">Hardware · Shop</p><div className="poster-title"><span>1337</span><span>SHEETS</span></div><p className="mono">Devon Labs</p></div></section>
    <section className="workshop-feature" aria-labelledby="workshop-title"><div><h2 id="workshop-title">The illustrated workshop</h2><p>A little room of curiosities. Explore the work, collect objects, and repair a few things along the way.</p><a className="shop-cta" href="/workshop/">Explore the workshop <ForwardArrow /></a></div><figure><a className="duotone" href="/workshop/" aria-label="Enter the illustrated workshop"><Image src="/workshop/room.webp" alt="The illustrated Devon Labs workshop, filled with photographs, tools, and curiosities" width={1536} height={1024} sizes="(max-width: 700px) 90vw, 700px" /></a><figcaption>An illustrated room of curiosities.</figcaption></figure></section>
  </SiteShell>;
}
