'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Search, Star, X } from 'lucide-react';
import { categories, githubSnapshot, projects } from '@/data/developer-projects';

type RepoMetadata = { stars: number; url: string; license: string | null; updatedAt: string; fork: boolean };
const metadata = githubSnapshot as Record<string, RepoMetadata>;

export default function ProjectDirectory() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = projects.filter(project => (category === 'All' || project.category === category) && [project.name, project.description, ...project.stack].join(' ').toLowerCase().includes(normalizedQuery));
  const filtered = category !== 'All' || query !== '';
  function reset() { setCategory('All'); setQuery(''); }
  return <section id="projects" className="directory" aria-labelledby="projects-title">
    <div className="directory-head"><h2 id="projects-title">Things I&apos;ve built<span className="heading-period">.</span></h2><label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Search projects</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects" autoComplete="off" />{query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" title="Clear search"><X size={16} /></button> : null}</label></div>
    <div className="filters" role="group" aria-label="Filter projects by category">{categories.map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="directory-status"><p role="status" aria-live="polite">{visible.length} {visible.length === 1 ? 'project' : 'projects'}<span> / independent work &amp; open source</span></p>{filtered ? <button type="button" className="reset-link" onClick={reset}>Reset filters <X size={13} /></button> : <a href="https://github.com/wispdevon?tab=repositories">All repositories <ArrowUpRight size={14} /></a>}</div>
    <div className="project-list">{visible.map((project, index) => {
      const repo = metadata[project.repo];
      const source = repo?.url || `https://github.com/wispdevon/${project.repo}`;
      return <article className="project-row" key={project.repo}>
        <div className="project-identity"><span className="project-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3><a href={source}>{project.name}</a></h3><p>{project.contribution ? 'Fork / community project' : 'By Wisp / Devon Labs'}</p></div></div>
        <div className="project-description"><p>{project.description}</p><button className="category-link" type="button" onClick={() => setCategory(project.category)}>{project.category}</button>{project.image ? <button className="preview-toggle" type="button" aria-expanded={preview === project.repo} aria-controls={`preview-${project.repo}`} onClick={() => setPreview(preview === project.repo ? null : project.repo)}>{preview === project.repo ? 'Close preview' : 'Preview'} <span aria-hidden="true">{preview === project.repo ? '-' : '+'}</span></button> : null}</div>
        <div className="project-stack">{project.stack.map(tool => <span key={tool}>{tool}</span>)}{repo?.license ? <span className="license">{repo.license}</span> : null}</div>
        <div className="project-actions"><a href={source}>Source <ArrowUpRight size={17} /></a>{repo && repo.stars > 0 ? <span className="star-count"><Star size={12} /> {repo.stars}</span> : null}</div>
        {project.image ? <div className="project-preview" id={`preview-${project.repo}`} hidden={preview !== project.repo}><Image src={project.image} alt={project.imageAlt || project.name} width={1200} height={750} sizes="(max-width: 760px) 100vw, 900px" /></div> : null}
      </article>;
    })}{visible.length === 0 ? <div className="empty-state"><h3>No projects found.</h3><p>Try another search or category.</p><button type="button" onClick={reset}>Show all projects <ArrowUpRight size={16} /></button></div> : null}</div>
    <a className="photo-note" href="https://photo.devonlabs.space"><span>I also make photographs.</span> Photo journal <ArrowUpRight size={15} /></a>
  </section>;
}
