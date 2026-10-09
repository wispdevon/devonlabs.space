'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, ChevronLeft, ChevronRight, GitFork, List, Network, Search, Star, X } from 'lucide-react';
import { areProjectsConnected, categories, githubSnapshot, projects } from '@/data/developer-projects';
import ProjectConstellation from './project-constellation';

type RepoMetadata = { stars: number; url: string; license: string | null; updatedAt: string; fork: boolean };
const metadata = githubSnapshot as Record<string, RepoMetadata>;

export default function ProjectDirectory() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [view, setView] = useState<'constellation' | 'list'>('constellation');
  const [selected, setSelected] = useState<string | null>(null);
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = projects.filter(project => (category === 'All' || project.category === category) && [project.name, project.description, ...project.stack].join(' ').toLowerCase().includes(normalizedQuery));
  const filtered = category !== 'All' || query !== '';
  const selectedProject = visible.find(project => project.repo === selected);
  const selectedIndex = visible.findIndex(project => project.repo === selected);
  const related = selectedProject ? projects.filter(project => project.repo !== selectedProject.repo && areProjectsConnected(project, selectedProject)) : [];
  function reset() { setCategory('All'); setQuery(''); setSelected(null); }
  function chooseCategory(item: string) { setCategory(item); setSelected(null); }
  function selectProject(repo: string) {
    if (!visible.some(project => project.repo === repo)) { setCategory('All'); setQuery(''); }
    setSelected(repo);
  }
  function closeProject() {
    setSelected(null);
    document.querySelector<HTMLButtonElement>(`[data-project="${selected}"]`)?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (selected) detailTitle.current?.focus({ preventScroll: window.innerWidth > 760 });
  }, [selected]);

  return <section id="projects" className={`directory directory-${view}`} aria-labelledby="projects-title" onKeyDown={event => { if (event.key === 'Escape' && selected) { event.preventDefault(); closeProject(); } }}>
    <div className="directory-head"><h2 id="projects-title">Things I&apos;ve built<span className="heading-period">.</span></h2><div className="directory-controls"><div className="view-switch" role="group" aria-label="Project view"><button type="button" aria-label="Constellation view" title="Constellation view" aria-pressed={view === 'constellation'} onClick={() => { setView('constellation'); setSelected(null); }}><Network size={17} /></button><button type="button" aria-label="List view" title="List view" aria-pressed={view === 'list'} onClick={() => { setView('list'); setSelected(null); }}><List size={17} /></button></div><label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Search projects</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setSelected(null); }} placeholder="Search projects" autoComplete="off" />{query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" title="Clear search"><X size={16} /></button> : null}</label></div></div>
    <div className="filters" role="group" aria-label="Filter projects by category">{categories.map(item => <button key={item} type="button" aria-pressed={item === category} onClick={() => chooseCategory(item)}>{item}</button>)}</div>
    <div className="directory-status"><p role="status" aria-live="polite">{visible.length} {visible.length === 1 ? 'project' : 'projects'}<span> / independent work &amp; open source</span></p>{filtered ? <button type="button" className="reset-link" onClick={reset}>Reset filters <X size={13} /></button> : <a href="https://github.com/wispdevon?tab=repositories">All repositories <ArrowUpRight size={14} /></a>}</div>
    {view === 'constellation' ? <div className={`constellation-workspace${selectedProject ? ' has-selection' : ''}`}>
      <ProjectConstellation matches={visible.map(project => project.repo)} selected={selectedProject?.repo || null} onSelect={selectProject} />
      {visible.length === 0 ? <div className="constellation-empty empty-state"><h3>No projects found.</h3><p>Try another search or category.</p><button type="button" onClick={reset}>Show all projects <ArrowUpRight size={16} /></button></div> : null}
      {selectedProject ? <aside className="project-inspector" aria-labelledby="inspector-title">
        <div className="inspector-top"><span>{selectedProject.category}</span><button className="icon-button" type="button" aria-label="Close project" title="Close project" onClick={closeProject}><X size={17} /></button></div>
        <h3 id="inspector-title" tabIndex={-1} ref={detailTitle}>{selectedProject.name}</h3>
        <p className="inspector-description">{selectedProject.description}</p>
        {selectedProject.image ? <a className="inspector-image" href={selectedProject.image} target="_blank" rel="noopener noreferrer" aria-label={`Open ${selectedProject.name} screenshot`}><Image src={selectedProject.image} alt={selectedProject.imageAlt || selectedProject.name} width={1200} height={750} sizes="(max-width: 760px) 100vw, 340px" /><span>Open screenshot <ArrowUpRight size={12} /></span></a> : null}
        <div className="inspector-stack">{selectedProject.stack.map(tool => <span key={tool}>{tool}</span>)}</div>
        {selectedProject.contribution ? <p className="inspector-credit"><GitFork size={13} /> Fork / community project</p> : null}
        <a className="inspector-source" href={metadata[selectedProject.repo]?.url || `https://github.com/wispdevon/${selectedProject.repo}`}>View source on GitHub <ArrowUpRight size={17} /></a>
        {related.length ? <div className="inspector-related"><h4>Connected projects</h4>{related.map(project => <button type="button" key={project.repo} onClick={() => selectProject(project.repo)}>{project.name}<ArrowUpRight size={13} /></button>)}</div> : null}
        <div className="inspector-pagination"><button className="icon-button" type="button" aria-label="Previous project" title="Previous project" onClick={() => selectProject(visible[(selectedIndex - 1 + visible.length) % visible.length].repo)}><ChevronLeft size={18} /></button><span>{String(selectedIndex + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')}</span><button className="icon-button" type="button" aria-label="Next project" title="Next project" onClick={() => selectProject(visible[(selectedIndex + 1) % visible.length].repo)}><ChevronRight size={18} /></button></div>
      </aside> : null}
    </div> : <div className="project-list">{visible.map((project, index) => {
      const repo = metadata[project.repo];
      const source = repo?.url || `https://github.com/wispdevon/${project.repo}`;
      return <article className="project-row" key={project.repo}>
        <div className="project-identity"><span className="project-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3><a href={source}>{project.name}</a></h3><p>{project.contribution ? 'Fork / community project' : 'By Wisp / Devon Labs'}</p></div></div>
        <div className="project-description"><p>{project.description}</p><button className="category-link" type="button" onClick={() => chooseCategory(project.category)}>{project.category}</button>{project.image ? <button className="preview-toggle" type="button" aria-expanded={preview === project.repo} aria-controls={`preview-${project.repo}`} onClick={() => setPreview(preview === project.repo ? null : project.repo)}>{preview === project.repo ? 'Close preview' : 'Preview'} <span aria-hidden="true">{preview === project.repo ? '-' : '+'}</span></button> : null}</div>
        <div className="project-stack">{project.stack.map(tool => <span key={tool}>{tool}</span>)}{repo?.license ? <span className="license">{repo.license}</span> : null}</div>
        <div className="project-actions"><a href={source}>Source <ArrowUpRight size={17} /></a>{repo && repo.stars > 0 ? <span className="star-count"><Star size={12} /> {repo.stars}</span> : null}</div>
        {project.image ? <div className="project-preview" id={`preview-${project.repo}`} hidden={preview !== project.repo}><Image src={project.image} alt={project.imageAlt || project.name} width={1200} height={750} sizes="(max-width: 760px) 100vw, 900px" /></div> : null}
      </article>;
    })}{visible.length === 0 ? <div className="empty-state"><h3>No projects found.</h3><p>Try another search or category.</p><button type="button" onClick={reset}>Show all projects <ArrowUpRight size={16} /></button></div> : null}</div>}
    <a className="photo-note" href="https://photo.devonlabs.space"><span>I also make photographs.</span> Photo journal <ArrowUpRight size={15} /></a>
  </section>;
}
