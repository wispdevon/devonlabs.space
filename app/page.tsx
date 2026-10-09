import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import ProjectDirectory from './project-directory';

export default function Home() {
  return <>
    <a className="skip-link" href="#projects">Skip to projects</a>
    <main className="wrap">
      <section className="introduction" aria-labelledby="site-title">
        <div>
          <h1 id="site-title">Devon Labs<span className="cursor" aria-hidden="true">_</span></h1>
          <p className="intro-line">Useful software. Built around real life.</p>
        </div>
        <a className="portrait-link" href="https://github.com/wispdevon" aria-label="Wisp on GitHub"><Image src="/developer/wisp.jpg" alt="Wisp, developer behind Devon Labs" width={112} height={112} priority /><span>@wispdevon</span></a>
      </section>
      <ProjectDirectory />
      <section className="closing" aria-labelledby="contact-title"><div><h2 id="contact-title">Have something worth building?</h2><p>Web apps, photography tools, integrations, and infrastructure you can own.</p></div><a className="contact-link" href="mailto:wispdevon@proton.me">Let&apos;s talk <ArrowUpRight size={19} /></a></section>
      <footer><span>Devon Labs <span className="footer-location">/ Thailand</span></span><div><a href="https://tooexpensive.dev">TooExpensive.dev <ArrowUpRight size={13} /></a><a href="https://photo.devonlabs.space">Photography <ArrowUpRight size={13} /></a><a href="https://github.com/wispdevon">GitHub <ArrowUpRight size={13} /></a></div></footer>
    </main>
  </>;
}
