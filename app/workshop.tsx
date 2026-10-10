'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ExternalLink,
  Flag,
  Github,
  Map,
  Moon,
  Navigation,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  circuit,
  discoveries,
  emptyProgress,
  photographs,
  readProgress,
  works,
  type Progress,
  type WorkKind,
} from '@/data/workshop';
import type { WorldEvent, WorldHandle, WorldSettings } from './workshop-scene';
import WorkshopPreview from './workshop-previews';

type Panel = 'map' | 'index' | 'settings' | 'achievements' | 'work' | null;
const formatTime = (value: number) =>
  `${Math.floor(value / 60)}:${(value % 60).toFixed(1).padStart(4, '0')}`;

export default function Workshop() {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<WorldHandle | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const progressRef = useRef<Progress>(emptyProgress());
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState(works[0].id);
  const [nearby, setNearby] = useState<string | null>(null);
  const [night, setNight] = useState(false);
  const [sound, setSound] = useState(false);
  const [quality, setQuality] = useState<'low' | 'high'>('high');
  const [reduced, setReduced] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<WorkKind | 'All'>('All');
  const [photo, setPhoto] = useState(0);
  const [notice, setNotice] = useState('');
  const [race, setRace] = useState<{
    elapsed: number;
    checkpoint: number;
    finished?: boolean;
  } | null>(null);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const joystickOrigin = useRef<{ x: number; y: number } | null>(null);
  const state = useRef<WorldSettings>({
    night: false,
    sound: false,
    quality: 'high',
    paused: false,
    reduced: false,
  });
  state.current = {
    night,
    sound,
    quality,
    paused: panel !== null,
    reduced,
    discovered: progress.discoveries,
  };
  const save = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    try {
      localStorage.setItem('devon-workshop-v1', JSON.stringify(next));
    } catch {
      /* Private browsing can disallow persistence. */
    }
  }, []);
  const show = useCallback((next: Panel) => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPanel(next);
  }, []);
  const openWork = useCallback(
    (id: string) => {
      if (!works.some((work) => work.id === id)) return;
      setSelected(id);
      setPhoto(0);
      show('work');
      const current = progressRef.current;
      if (!current.visited.includes(id)) save({ ...current, visited: [...current.visited, id] });
    },
    [save, show]
  );
  const close = useCallback(() => {
    setPanel(null);
    window.setTimeout(() => {
      const element = returnFocus.current;
      if (element?.isConnected) element.focus({ preventScroll: true });
      else host.current?.querySelector('canvas')?.focus({ preventScroll: true });
    }, 0);
  }, []);
  const onEvent = useCallback(
    (event: WorldEvent) => {
      if (event.type === 'nearby') setNearby(event.id);
      if (event.type === 'open') openWork(event.id);
      if (event.type === 'jump') {
        const p = progressRef.current;
        if (!p.jumped) save({ ...p, jumped: true });
      }
      if (event.type === 'discovery') {
        const p = progressRef.current;
        if (!p.discoveries.includes(event.id)) {
          save({ ...p, discoveries: [...p.discoveries, event.id] });
          setNotice(discoveries.find((d) => d.id === event.id)?.name || 'Discovery');
        }
      }
      if (event.type === 'race') {
        setRace(event.checkpoint < 0 ? null : event);
        if (event.finished) {
          const p = progressRef.current;
          save({ ...p, best: p.best === null ? event.elapsed : Math.min(p.best, event.elapsed) });
          setNotice(`Circuit complete · ${formatTime(event.elapsed)}`);
        }
      }
    },
    [openWork, save]
  );
  useEffect(() => {
    try {
      const p = readProgress(localStorage.getItem('devon-workshop-v1'));
      progressRef.current = p;
      setProgress(p);
    } catch {}
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener('change', update);
    let cancelled = false;
    let mounted: WorldHandle | null = null;
    const container = host.current!;
    void (async () => {
      try {
        await document.fonts.ready;
        const { mountWorkshop } = await import('./workshop-scene');
        if (cancelled) return;
        mounted = await mountWorkshop(container, state.current, onEvent, () => {
          setFallback(true);
          setReady(false);
        });
        if (cancelled) {
          mounted.dispose();
          return;
        }
        engine.current = mounted;
        mounted.update(state.current);
        setReady(true);
      } catch {
        if (!cancelled) {
          setFallback(true);
          container.dataset.renderer = 'fallback';
        }
      }
    })();
    return () => {
      cancelled = true;
      mounted?.dispose();
      engine.current = null;
      preference.removeEventListener('change', update);
    };
  }, [onEvent]);
  useEffect(() => {
    engine.current?.update(state.current);
  }, [night, sound, quality, panel, reduced, progress.discoveries]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 4200);
    return () => clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (panel && !element.open) element.showModal();
    else if (!panel && element.open) element.close();
    if (panel) {
      element.scrollTop = 0;
      element.querySelector<HTMLButtonElement>('.dialog-top button')?.focus({ preventScroll: true });
    }
  }, [panel, selected]);
  const selectedWork = works.find((work) => work.id === selected)!;
  const nearest = works.find((work) => work.id === nearby);
  const filtered = works.filter(
    (work) =>
      (kind === 'All' || work.kind === kind) &&
      `${work.name} ${work.description} ${work.stack?.join(' ') || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const achievements = [
    { name: 'First flight', done: progress.jumped, detail: 'Take the rover off the ground.' },
    {
      name: 'A curious mind',
      done: progress.visited.length === works.length,
      detail: `${progress.visited.length}/${works.length} destinations visited`,
    },
    {
      name: 'Collector of curiosities',
      done: progress.discoveries.length === discoveries.length,
      detail: `${progress.discoveries.length}/${discoveries.length} discoveries`,
    },
    {
      name: 'One good lap',
      done: progress.best !== null,
      detail:
        progress.best === null
          ? 'Complete the circuit.'
          : `Personal best · ${formatTime(progress.best)}`,
    },
  ];
  const travel = (id: string) => {
    engine.current?.teleport(id);
    close();
  };
  const steer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!joystickOrigin.current) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - joystickOrigin.current.x) / 38));
    const y = Math.max(-1, Math.min(1, (event.clientY - joystickOrigin.current.y) / 38));
    setJoystick({ x, y });
    engine.current?.steer(-x, -y);
  };
  const stopSteering = () => {
    joystickOrigin.current = null;
    setJoystick({ x: 0, y: 0 });
    engine.current?.steer(0, 0);
  };
  const reset = () => {
    save(emptyProgress());
    engine.current?.reset();
    setRace(null);
    setNotice('A fresh start');
  };
  const startRace = () => {
    engine.current?.race();
    close();
  };
  return (
    <main className={`workshop ${night ? 'night' : ''}`} aria-label="Devon Labs planetary workshop">
      <a
        className="skip-link"
        href="#project-index"
        onClick={(event) => {
          event.preventDefault();
          show('index');
        }}
      >
        Skip to projects
      </a>
      <div className="world" ref={host} aria-busy={!ready && !fallback} />
      {!ready && !fallback ? (
        <div className="world-loading" role="status">
          <span className="loading-orbit" />
          <span>Opening the workshop</span>
        </div>
      ) : null}
      <div className="world-signature">
        <span>
          Devon Labs<span className="signature-dot">.</span>
        </span>
        <small>Wisp / Thailand</small>
      </div>
      <nav className="world-tools" aria-label="Workshop tools">
        <button title="Map" aria-label="Open map" onClick={() => show('map')}>
          <Map size={21} />
        </button>
        <button title="Projects" aria-label="Open project index" onClick={() => show('index')}>
          <BookOpen size={21} />
        </button>
        <button
          title="Achievements"
          aria-label="Open achievements"
          onClick={() => show('achievements')}
        >
          <Trophy size={21} />
        </button>
        <button
          title={night ? 'Day' : 'Night'}
          aria-label={night ? 'Switch to day' : 'Switch to night'}
          aria-pressed={night}
          onClick={() => setNight(!night)}
        >
          {night ? <Sun size={21} /> : <Moon size={21} />}
        </button>
        <button
          title={sound ? 'Mute' : 'Sound'}
          aria-label={sound ? 'Mute sound' : 'Enable sound'}
          aria-pressed={sound}
          disabled={!ready}
          onClick={() => setSound(!sound)}
        >
          {sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
        </button>
        <button title="Settings" aria-label="Open settings" onClick={() => show('settings')}>
          <Settings size={21} />
        </button>
      </nav>
      {fallback ? (
        <section className="world-fallback" id="project-index">
          <h1>Devon Labs</h1>
          <p>Software, photographs, films, and things I make.</p>
          <div className="fallback-works">
            {works.map((work) => (
              <button key={work.id} onClick={() => openWork(work.id)}>
                <span>{work.name}</span>
                <small>{work.kind}</small>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {ready ? (
        <>
          <div className="world-status">
            <span className="status-dot" />
            <span>
              {progress.visited.length.toString().padStart(2, '0')} / {works.length} explored
            </span>
            <span className="status-divider" />
            <span>{progress.discoveries.length} / 6 discoveries</span>
          </div>
          <div className="world-actions">
            <button
              title="Start circuit"
              aria-label="Start circuit"
              onClick={() => {
                engine.current?.race();
                host.current?.querySelector('canvas')?.focus();
              }}
            >
              <Flag size={21} />
            </button>
            <button
              title="Respawn"
              aria-label="Respawn rover"
              onClick={() => {
                engine.current?.respawn();
                host.current?.querySelector('canvas')?.focus();
              }}
            >
              <RotateCcw size={21} />
            </button>
          </div>
          {nearest && panel === null ? (
            <button className="nearby-work" onClick={() => openWork(nearest.id)}>
              <span className="nearby-dot" style={{ background: nearest.color }} />
              <span>
                <small>{nearest.kind}</small>
                {nearest.name}
              </span>
              <ArrowUpRight size={20} />
            </button>
          ) : null}
          {race ? (
            <div className="race-status" role="status">
              <Flag size={16} />
              <span>
                {race.finished ? 'Finished' : `Gate ${race.checkpoint} / ${circuit.length - 1}`}
              </span>
              <strong>{formatTime(race.elapsed)}</strong>
              <button
                aria-label="End circuit"
                title="End circuit"
                onClick={() => {
                  engine.current?.cancelRace();
                  setRace(null);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}
          <div className="touch-controls" aria-label="Rover controls">
            <div
              className="joystick"
              aria-label="Steer rover"
              role="group"
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                joystickOrigin.current = {
                  x: rect.x + rect.width / 2,
                  y: rect.y + rect.height / 2,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                steer(event);
              }}
              onPointerMove={steer}
              onPointerUp={stopSteering}
              onPointerCancel={stopSteering}
            >
              <div
                className="joystick-thumb"
                style={{ transform: `translate(${joystick.x * 30}px,${joystick.y * 30}px)` }}
              >
                <Navigation size={19} />
              </div>
            </div>
            <div className="touch-actions">
              <button title="Jump" aria-label="Jump rover" onClick={() => engine.current?.jump()}>
                <ArrowUpRight size={23} />
              </button>
              <button
                title="Boost"
                aria-label="Boost rover"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  engine.current?.boost(true);
                }}
                onPointerUp={() => engine.current?.boost(false)}
                onPointerCancel={() => engine.current?.boost(false)}
                onLostPointerCapture={() => engine.current?.boost(false)}
              >
                <Zap size={23} />
              </button>
            </div>
          </div>
        </>
      ) : null}
      <div className={`world-notice ${notice ? 'visible' : ''}`} role="status" aria-live="polite">
        <Trophy size={17} />
        {notice}
      </div>
      <dialog
        ref={dialog}
        aria-label={
          panel === 'work'
            ? selectedWork.name
            : panel === 'map'
              ? 'Constellation map'
              : panel === 'index'
                ? 'Project index'
                : panel === 'achievements'
                  ? 'Achievements'
                  : 'Workshop settings'
        }
        className={`world-dialog ${panel === 'map' ? 'map-dialog' : ''}`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="dialog-top">
          <span>
            {panel === 'work'
              ? selectedWork.kind
              : panel === 'map'
                ? 'The constellation'
                : panel === 'index'
                  ? 'Things I make'
                  : panel === 'achievements'
                    ? 'Small victories'
                    : 'Workshop settings'}
          </span>
          <button autoFocus aria-label="Close panel" title="Close" onClick={close}>
            <X size={22} />
          </button>
        </div>
        {panel === 'work' ? (
          <article className="work-detail">
            <h1>{selectedWork.name}</h1>
            <p>{selectedWork.description}</p>
            {selectedWork.contribution ? (
              <p className="fork-note">A fork of the community Sharply project.</p>
            ) : null}
            {selectedWork.stack ? (
              <div className="work-stack">
                {selectedWork.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
            {selectedWork.kind === 'Photography' ? (
              <>
                <figure className="gallery-photo">
                  <Image
                    src={photographs[photo].image}
                    alt={photographs[photo].alt}
                    width={1200}
                    height={1200}
                  />
                  <figcaption>
                    <span>{photographs[photo].date}</span>
                    <span>
                      {photo + 1} / {photographs.length}
                    </span>
                  </figcaption>
                </figure>
                <div className="gallery-controls">
                  <button
                    title="Previous photograph"
                    aria-label="Previous photograph"
                    onClick={() => setPhoto((photo - 1 + photographs.length) % photographs.length)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="gallery-thumbnails">
                    {photographs.map((item, i) => (
                      <button
                        key={item.id}
                        aria-label={`Show photograph ${i + 1}`}
                        aria-pressed={photo === i}
                        onClick={() => setPhoto(i)}
                      >
                        <Image src={item.image} alt="" width={70} height={70} />
                      </button>
                    ))}
                  </div>
                  <button
                    title="Next photograph"
                    aria-label="Next photograph"
                    onClick={() => setPhoto((photo + 1) % photographs.length)}
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </>
            ) : null}
            {selectedWork.video ? (
              <video
                key={selectedWork.video}
                className="work-video"
                src={selectedWork.video}
                poster={selectedWork.image}
                controls
                playsInline
                preload="none"
                onError={() => setNotice('Film unavailable. The original is linked below.')}
              />
            ) : null}
            {selectedWork.preview ? (
              <WorkshopPreview key={selectedWork.id} kind={selectedWork.preview} />
            ) : selectedWork.image && selectedWork.kind === 'Software' ? (
              <Image
                className="work-image"
                src={selectedWork.image}
                alt={`${selectedWork.name} workspace`}
                width={1200}
                height={750}
              />
            ) : null}
            <div className="work-links">
              <a href={selectedWork.href} target="_blank" rel="noopener noreferrer">
                {selectedWork.kind === 'Software' ? (
                  <Github size={18} />
                ) : (
                  <ExternalLink size={18} />
                )}{' '}
                {selectedWork.kind === 'Software'
                  ? 'Source code'
                  : selectedWork.kind === 'Hardware'
                    ? 'Visit the shop'
                    : selectedWork.kind === 'Photography'
                      ? 'Full collection'
                      : 'Original film'}{' '}
                <ArrowUpRight size={16} />
              </a>
              {ready ? (
                <button onClick={() => travel(selectedWork.id)}>
                  <Navigation size={16} />
                  Visit station
                </button>
              ) : null}
            </div>
          </article>
        ) : null}
        {panel === 'index' ? (
          <section className="work-index">
            <h1>A collection of curiosities.</h1>
            <div className="index-search">
              <Search size={18} />
              <input
                aria-label="Search projects"
                placeholder="Find something"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <button aria-label="Clear search" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <fieldset className="kind-filter">
              <legend>Work type</legend>
              {(['All', 'Software', 'Photography', 'Video', 'Hardware'] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="work-kind"
                    checked={kind === value}
                    onChange={() => setKind(value)}
                  />
                  {value}
                </label>
              ))}
            </fieldset>
            <div className="index-rows">
              {filtered.map((work) => (
                <button key={work.id} data-project={work.id} onClick={() => openWork(work.id)}>
                  <span className="index-number">
                    {String(works.indexOf(work) + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <strong>{work.name}</strong>
                    <small>{work.kind}</small>
                  </span>
                  {progress.visited.includes(work.id) ? (
                    <Check size={16} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                </button>
              ))}
              {!filtered.length ? <p>No matching work.</p> : null}
            </div>
            <div className="index-contact">
              <a href="mailto:wispdevon@proton.me">
                Say hello <ArrowUpRight size={15} />
              </a>
              <a href="https://github.com/wispdevon">
                GitHub <ArrowUpRight size={15} />
              </a>
              <a href="https://photo.devonlabs.space">
                Photo journal <ArrowUpRight size={15} />
              </a>
            </div>
          </section>
        ) : null}
        {panel === 'map' ? (
          <section className="world-map">
            <h1>Follow your curiosity.</h1>
            <div className="constellation-map">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {works.slice(1).map((work, i) => (
                  <line
                    key={work.id}
                    x1={((works[i].position[0] + 35) / 70) * 100}
                    y1={((works[i].position[1] + 35) / 70) * 100}
                    x2={((work.position[0] + 35) / 70) * 100}
                    y2={((work.position[1] + 35) / 70) * 100}
                  />
                ))}
              </svg>
              {works.map((work) => (
                <button
                  key={work.id}
                  className={`map-star ${progress.visited.includes(work.id) ? 'visited' : ''}`}
                  title={work.name}
                  aria-label={`Travel to ${work.name}`}
                  disabled={!ready}
                  style={
                    {
                      left: `${((work.position[0] + 35) / 70) * 100}%`,
                      top: `${((work.position[1] + 35) / 70) * 100}%`,
                      '--star-color': work.color,
                    } as React.CSSProperties
                  }
                  onClick={() => travel(work.id)}
                >
                  <span />
                </button>
              ))}
            </div>
            <div className="map-destinations">
              {works.map((work) => (
                <button key={work.id} disabled={!ready} onClick={() => travel(work.id)}>
                  <span style={{ background: work.color }} />
                  {work.name}
                  <Navigation size={14} />
                </button>
              ))}
            </div>
            {ready ? (
              <button className="text-action" onClick={startRace}>
                <Flag size={17} />
                Take the circuit
              </button>
            ) : null}
          </section>
        ) : null}
        {panel === 'achievements' ? (
          <section className="achievements">
            <h1>Small victories.</h1>
            <p>
              {achievements.filter((item) => item.done).length} / {achievements.length} earned
            </p>
            {achievements.map((item) => (
              <div className={`achievement ${item.done ? 'earned' : ''}`} key={item.name}>
                {item.done ? <Trophy size={24} /> : <Flag size={24} />}
                <div>
                  <h2>{item.name}</h2>
                  <p>{item.detail}</p>
                </div>
                {item.done ? <Check size={18} /> : null}
              </div>
            ))}
            <div className="discovery-list">
              {discoveries.map((item) => (
                <span key={item.id}>
                  {progress.discoveries.includes(item.id) ? item.name : 'Undiscovered'}
                </span>
              ))}
            </div>
          </section>
        ) : null}
        {panel === 'settings' ? (
          <section className="world-settings">
            <h1>Make yourself at home.</h1>
            <label className="setting-row">
              Night{' '}
              <input
                type="checkbox"
                checked={night}
                onChange={(event) => setNight(event.target.checked)}
              />
            </label>
            <label className="setting-row">
              Sound{' '}
              <input
                type="checkbox"
                disabled={!ready}
                checked={sound}
                onChange={(event) => setSound(event.target.checked)}
              />
            </label>
            <label className="setting-row">
              Rendering{' '}
              <select
                aria-label="Rendering quality"
                value={quality}
                onChange={(event) => setQuality(event.target.value as 'low' | 'high')}
              >
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </label>
            <div className="controls-legend">
              <span>Drive</span>
              <kbd>W A S D / ↑ ↓ ← →</kbd>
              <span>Jump</span>
              <kbd>Space</kbd>
              <span>Boost</span>
              <kbd>Shift</kbd>
              <span>Open station</span>
              <kbd>Enter</kbd>
              <span>Respawn</span>
              <kbd>R</kbd>
            </div>
            <button
              className="text-action"
              onClick={() => {
                engine.current?.respawn();
                close();
              }}
              disabled={!ready}
            >
              <RotateCcw size={16} />
              Respawn rover
            </button>
            <button
              className="text-action reset-progress"
              onClick={() => {
                if (window.confirm('Reset discoveries, achievements, and your circuit record?'))
                  reset();
              }}
            >
              Reset progress
            </button>
          </section>
        ) : null}
      </dialog>
      <noscript>
        <section className="noscript-index">
          <h1>Devon Labs</h1>
          {works.map((work) => (
            <a href={work.href} key={work.id}>
              {work.name} <span>{work.kind}</span>
            </a>
          ))}
        </section>
      </noscript>
    </main>
  );
}
