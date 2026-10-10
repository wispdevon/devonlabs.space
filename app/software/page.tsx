import Image from 'next/image';
import { projects } from '../../data/developer-projects';
import { portfolioSummaries } from '../../data/portfolio-summaries';
import SiteShell, { Arrow, pageMetadata } from '../portfolio/site-shell';

export const metadata = pageMetadata('software', 'Photography tools, self-hosted workflows, and practical software by Wisp.');

export default function SoftwarePage() {
  return <SiteShell page="software">
    <div className="page-heading"><h1>Software</h1><div className="heading-summary"><div><h2>Small tools. Clear jobs.</h2><p>Photography, self-hosting, and practical software.</p></div><span className="mono">09 projects</span></div></div>
    <div className="featured-projects">{projects.slice(0, 3).map(project => <article className="featured-project" key={project.repo}>
      <figure><a className="duotone" href={`https://github.com/wispdevon/${project.repo}`}><Image src={project.image!} alt={project.imageAlt!} width={1200} height={750} sizes="(max-width: 700px) 90vw, 600px" priority={project.repo === 'GibbonPfp'} /></a><figcaption>Interface study</figcaption></figure>
      <div><h2>{project.name}</h2><p>{portfolioSummaries[project.repo] ?? project.description}</p><p className="project-stack">{project.stack.join(' · ')}</p><a className="text-link" href={`https://github.com/wispdevon/${project.repo}`}>View on GitHub <Arrow /></a></div>
    </article>)}</div>
    <section className="more-tools" aria-labelledby="more-tools-title"><h2 id="more-tools-title">More tools</h2><ul>{projects.slice(3).map(project => <li key={project.repo}><h3><a href={`https://github.com/wispdevon/${project.repo}`}>{project.name}</a></h3><p>{portfolioSummaries[project.repo] ?? project.description}</p><p className="project-stack">{project.stack.join(' · ')}</p><a className="text-link" href={`https://github.com/wispdevon/${project.repo}`}>View on GitHub <Arrow /></a></li>)}</ul></section>
  </SiteShell>;
}
