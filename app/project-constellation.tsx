'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Camera, Code2, Compass, Film, GitFork, ImageIcon, Minus, Pause, Play, RotateCcw, Search, Terminal, ZoomIn, ZoomOut } from 'lucide-react';
import { categoryColors, projects } from '@/data/developer-projects';
import type { SceneHandle, SceneState } from './constellation-scene';

const icons = [Camera, ImageIcon, Film, Code2, Compass, Search, Code2, Terminal, GitFork];

export default function ProjectConstellation({ matches, selected, onSelect }: { matches: string[]; selected: string | null; onSelect: (repo: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const engine = useRef<SceneHandle | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const current = useRef<SceneState>({ matches, selected, hovered, paused });

  useEffect(() => {
    current.current = { matches, selected, hovered, paused };
    engine.current?.update(current.current);
  }, [matches, selected, hovered, paused]);

  useEffect(() => {
    let cancelled = false;
    const target = host.current;
    if (!target) return;
    import('./constellation-scene').then(({ mountConstellation }) => {
      if (cancelled) return;
      try {
        engine.current = mountConstellation(target, buttons.current, current.current, () => setReady(false));
        setReady(true);
      } catch {
        target.dataset.renderer = 'fallback';
      }
    });
    return () => { cancelled = true; engine.current?.dispose(); engine.current = null; };
  }, []);

  function resetCamera() { engine.current?.reset(); }
  return <div className="constellation-surface">
    <div className="constellation-field" ref={host} tabIndex={0} role="group" aria-label="Project constellation" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => engine.current?.rotate(-.05, 0), ArrowRight: () => engine.current?.rotate(.05, 0),
        ArrowUp: () => engine.current?.rotate(0, -.04), ArrowDown: () => engine.current?.rotate(0, .04),
        '+': () => engine.current?.zoom(1.1), '=': () => engine.current?.zoom(1.1), '-': () => engine.current?.zoom(.9), Home: resetCamera
      };
      if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    }}>
      <div className="constellation-targets">
        {projects.map((project, index) => {
          const Icon = icons[index] || Code2;
          const matching = matches.includes(project.repo);
          return <button key={project.repo} ref={element => { if (element) buttons.current.set(project.repo, element); else buttons.current.delete(project.repo); }} type="button"
            className={`constellation-node${matching ? '' : ' is-dimmed'}`} style={{ '--node-color': categoryColors[project.category] } as CSSProperties}
            data-project={project.repo} aria-label={`Explore ${project.name}`} aria-pressed={selected === project.repo} disabled={!matching}
            onClick={() => onSelect(project.repo)} onPointerEnter={() => setHovered(project.repo)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(project.repo)} onBlur={() => setHovered(null)}>
            <span className="node-symbol">{project.image ? <Image src={project.image} alt="" width={54} height={54} draggable={false} /> : <Icon size={23} strokeWidth={1.4} />}</span>
            <span className="node-name">{project.name}</span><span className="node-category">{project.category}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="scene-toolbar" role="group" aria-label="Constellation controls">
      <button type="button" aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => engine.current?.zoom(.9)}><ZoomOut size={17} /></button>
      <button type="button" aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => engine.current?.zoom(1.1)}><ZoomIn size={17} /></button>
      <span className="tool-divider" aria-hidden="true" />
      <button type="button" aria-label="Reset constellation" title="Reset constellation" disabled={!ready} onClick={resetCamera}><RotateCcw size={16} /></button>
      <button type="button" aria-label={paused ? 'Resume motion' : 'Pause motion'} title={paused ? 'Resume motion' : 'Pause motion'} aria-pressed={paused} disabled={!ready} onClick={() => setPaused(!paused)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>
    </div>
    <div className="scene-caption" aria-hidden="true"><span className="scene-marker"><Minus size={10} />{String(matches.length).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><span>{selected ? projects.find(project => project.repo === selected)?.name : 'Devon Labs'}</span></div>
  </div>;
}
