import Image from '../portfolio/responsive-image';
import { projects } from '../../data/developer-projects';
import { portfolioSummaries } from '../../data/portfolio-summaries';
import SiteShell, { Arrow, pageMetadata } from '../portfolio/site-shell';

export const metadata = pageMetadata('software', 'Photography tools, self-hosted workflows, and practical software by Wisp.');

export default function SoftwarePage() {
  return <SiteShell page="software">
    <div className="page-heading"><h1>Software</h1><div className="heading-summary"><div><h2>Small tools. Clear jobs.</h2><p>Photography, self-hosting, and practical software.</p></div><span className="mono">09 projects</span></div></div>
    <div className="featured-projects">{projects.filter(project => project.image).map(project => <article className={`featured-project ${project.website ? 'website-project' : ''}`} key={project.repo}>
      <figure><a className={project.website ? 'website-preview' : 'duotone'} href={project.website ?? `https://github.com/wispdevon/${project.repo}`}><Image src={project.image!} alt={project.imageAlt!} width={1200} height={750} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px" priority={project.repo === 'GibbonPfp'} /></a><figcaption>{project.website ? new URL(project.website).hostname : 'Interface study'}</figcaption></figure>
      <div><h2>{project.name}</h2><p>{portfolioSummaries[project.repo] ?? project.description}</p><p className="project-stack">{project.stack.join(' · ')}</p><div className="project-links">{project.website ? <a className="text-link" href={project.website}>Visit website <Arrow /></a> : null}<a className="text-link" href={`https://github.com/wispdevon/${project.repo}`}>View on GitHub <Arrow /></a></div></div>
    </article>)}</div>
    <section className="more-tools" aria-labelledby="more-tools-title"><h2 id="more-tools-title">More tools</h2><ul>{projects.filter(project => !project.image).map(project => <li key={project.repo}><h3><a href={`https://github.com/wispdevon/${project.repo}`}>{project.name}</a></h3><p>{portfolioSummaries[project.repo] ?? project.description}</p><p className="project-stack">{project.stack.join(' · ')}</p><a className="text-link" href={`https://github.com/wispdevon/${project.repo}`}>View on GitHub <Arrow /></a></li>)}</ul></section>
  </SiteShell>;
}
