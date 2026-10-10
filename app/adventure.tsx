'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Backpack,
  Camera,
  Check,
  ExternalLink,
  Film,
  Github,
  Hand,
  List,
  Monitor,
  Radio,
  Satellite,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import {
  canRepair,
  discoveries,
  emptyProgress,
  photographs,
  puzzles,
  readProgress,
  works,
  type Progress,
} from '@/data/workshop';
import WorkshopPreview from './workshop-previews';

const objects = [
  { id: 'Photography', name: 'Photo studio', x: 15, y: 24, icon: Camera, type: 'category' },
  { id: 'Software', name: 'Software lab', x: 50, y: 40, icon: Monitor, type: 'category' },
  { id: 'Video', name: 'Cinema', x: 79, y: 30, icon: Film, type: 'category' },
  { id: 'Hardware', name: 'Hardware bench', x: 91, y: 68, icon: Wrench, type: 'category' },
  { id: 'negative', name: 'A lost negative', x: 45, y: 54, icon: Film, type: 'item' },
  { id: 'lens', name: 'A spare lens', x: 56, y: 52, icon: Camera, type: 'item' },
  { id: 'signal', name: 'A good signal', x: 64, y: 51, icon: Radio, type: 'item' },
  { id: 'archive', name: 'An old archive', x: 20, y: 73, icon: Archive, type: 'item' },
  { id: 'satellite', name: 'A quiet satellite', x: 70, y: 65, icon: Satellite, type: 'item' },
  { id: 'starlight', name: 'A little starlight', x: 64, y: 69, icon: Sparkles, type: 'item' },
  { id: 'lightbox', name: 'The lightbox', x: 24, y: 51, icon: Camera, type: 'puzzle' },
  { id: 'projector', name: 'The projector', x: 77, y: 48, icon: Film, type: 'puzzle' },
  { id: 'antenna', name: 'The antenna', x: 90, y: 44, icon: Radio, type: 'puzzle' },
  { id: 'sky', name: 'The constellation', x: 50, y: 23, icon: Sparkles, type: 'sky' },
];

export default function Adventure() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      setProgress(readProgress(localStorage.getItem('devon-workshop-v1')));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem('devon-workshop-v1', JSON.stringify(progress));
      } catch {}
    }
  }, [progress, loaded]);
  useEffect(() => {
    const modal = dialog.current;
    if (panel && modal) {
      if (!modal.open) modal.showModal();
      modal.scrollTop = 0;
      modal
        .querySelector<HTMLButtonElement>('[aria-label="Close"]')
        ?.focus({ preventScroll: true });
    } else if (modal?.open) {
      modal.close();
      const target = trigger.current?.isConnected
        ? trigger.current
        : document.querySelector<HTMLButtonElement>('[aria-label="Your pockets"]');
      target?.focus({ preventScroll: true });
    }
  }, [panel]);
  function open(id: string) {
    if (!dialog.current?.open) trigger.current = document.activeElement as HTMLElement;
    setPanel(id);
    if (works.some((w) => w.id === id)) {
      setPhoto(0);
      setProgress((p) => ({ ...p, visited: [...new Set([...p.visited, id])] }));
    }
  }
  function useObject(id: string) {
    setQuery('');
    const puzzle = puzzles.find((p) => p.id === id);
    if (puzzle && held && !progress.repaired.includes(id)) {
      if (canRepair(id, held, progress.discoveries, progress.repaired)) {
        setProgress((p) => ({ ...p, repaired: [...p.repaired, id] }));
        setHeld(null);
        setNotice(puzzle.solved);
      } else setNotice('That does not fit.');
    }
    open(id);
  }
  const work = works.find((w) => w.id === panel);
  const item = discoveries.find((d) => d.id === panel);
  const puzzle = puzzles.find((p) => p.id === panel);
  const heldItem = discoveries.find((d) => d.id === held);
  const title =
    work?.name ||
    item?.name ||
    puzzle?.name ||
    (panel === 'inventory'
      ? 'Your pockets'
      : panel === 'sky'
        ? 'A constellation of experiments'
        : panel === 'index'
          ? 'All work'
          : `${panel || ''} workshop`);
  const listed = works.filter(
    (w) =>
      (panel === 'index' || panel === 'sky' || w.kind === panel) &&
      `${w.name} ${w.description}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <main className="adventure-2d">
      <a className="skip-link" href="#room-objects">
        Explore the workshop
      </a>
      <div className="room-brand">
        Devon Labs<span>Artist. Engineer. Curious.</span>
      </div>
      <div className="painted-room" aria-label="Devon Labs illustrated workshop">
        <Image
          className="room-art"
          src="/workshop/room.webp"
          alt="A painted workshop with photography equipment, a computer, a cinema projector, and a hardware bench."
          width={1536}
          height={1024}
          priority
        />
        <nav id="room-objects" className="room-objects" aria-label="Workshop objects">
          {objects
            .filter((o) => o.type !== 'item' || !progress.discoveries.includes(o.id))
            .map((o) => (
              <button
                key={o.id}
                className={`room-hotspot ${o.type} ${progress.repaired.includes(o.id) ? 'restored' : ''}`}
                style={{ left: `${o.x}%`, top: `${o.y}%` }}
                aria-label={o.name}
                title={o.name}
                onClick={() => useObject(o.id)}
              >
                {progress.repaired.includes(o.id) ? <Check size={17} /> : <o.icon size={17} />}
                <span>{o.name}</span>
              </button>
            ))}
        </nav>
      </div>
      <footer className="room-footer">
        <div className="room-progress">
          {progress.visited.length}/{works.length} explored <span>·</span>{' '}
          {progress.repaired.length}/3 restored
        </div>
        {heldItem ? (
          <button className="holding" onClick={() => setHeld(null)} title="Put away">
            <Hand size={17} />
            {heldItem.name}
            <X size={14} />
          </button>
        ) : null}
        <nav aria-label="Workshop tools">
          <button
            title="All work"
            aria-label="All work"
            onClick={() => {
              setQuery('');
              open('index');
            }}
          >
            <List size={21} />
          </button>
          <button title="Your pockets" aria-label="Your pockets" onClick={() => open('inventory')}>
            <Backpack size={21} />
            <small>{progress.discoveries.length}</small>
          </button>
        </nav>
      </footer>
      <div className="room-notice" role={panel ? undefined : 'status'}>
        {panel ? '' : notice}
      </div>
      <dialog
        ref={dialog}
        className="room-dialog"
        aria-labelledby="room-dialog-title"
        onCancel={() => setPanel(null)}
        onClose={() => setPanel(null)}
      >
        <header>
          <h2 id="room-dialog-title">{title}</h2>
          <button aria-label="Close" title="Close" onClick={() => setPanel(null)}>
            <X size={21} />
          </button>
        </header>
        <div className="room-dialog-body">
          {panel && notice ? (
            <p className="action-feedback" role="status">
              {notice}
            </p>
          ) : null}
          {work ? (
            <article className="work-detail">
              <p>{work.description}</p>
              {work.contribution ? (
                <p className="fork-note">A fork of the community Sharply project.</p>
              ) : null}
              {work.stack ? (
                <div className="work-stack">
                  {work.stack.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              ) : null}
              {work.kind === 'Photography' ? (
                <>
                  <figure className="gallery-photo">
                    <Image
                      src={photographs[photo].image}
                      alt={photographs[photo].alt}
                      width={1200}
                      height={1200}
                    />
                    <figcaption>
                      {photo + 1} / {photographs.length}
                    </figcaption>
                  </figure>
                  <div className="preview-actions">
                    <button
                      title="Previous photograph"
                      aria-label="Previous photograph"
                      onClick={() =>
                        setPhoto((photo + photographs.length - 1) % photographs.length)
                      }
                    >
                      <ArrowLeft />
                    </button>
                    <button
                      title="Next photograph"
                      aria-label="Next photograph"
                      onClick={() => setPhoto((photo + 1) % photographs.length)}
                    >
                      <ArrowRight />
                    </button>
                  </div>
                </>
              ) : null}
              {work.video ? (
                <video
                  className="work-video"
                  src={work.video}
                  poster={work.image}
                  controls
                  playsInline
                  preload="none"
                  onError={() => setNotice('Film unavailable. The original is linked below.')}
                />
              ) : null}
              {work.preview ? (
                <WorkshopPreview key={work.id} kind={work.preview} />
              ) : work.kind === 'Software' && work.image ? (
                <Image
                  className="work-image"
                  src={work.image}
                  alt={`${work.name} workspace`}
                  width={1200}
                  height={750}
                />
              ) : null}
              <div className="work-links">
                <a href={work.href} target="_blank" rel="noopener noreferrer">
                  {work.kind === 'Software' ? <Github size={18} /> : <ExternalLink size={18} />}
                  {work.kind === 'Software'
                    ? 'Source code'
                    : work.kind === 'Hardware'
                      ? 'Visit the shop'
                      : 'View original'}
                </a>
              </div>
            </article>
          ) : item ? (
            <section>
              <p>{item.description}</p>
              <button
                className="text-action"
                disabled={progress.discoveries.includes(item.id)}
                onClick={() => {
                  setProgress((p) => ({
                    ...p,
                    discoveries: [...new Set([...p.discoveries, item.id])],
                  }));
                  setNotice(`${item.name} is in your pockets.`);
                  setPanel(null);
                }}
              >
                <Backpack size={18} />
                {progress.discoveries.includes(item.id) ? 'In your pockets' : 'Take it'}
              </button>
            </section>
          ) : puzzle ? (
            <section>
              <p>{progress.repaired.includes(puzzle.id) ? puzzle.solved : puzzle.hint}</p>
              {progress.repaired.includes(puzzle.id) ? (
                <p className="repair-complete">
                  <Check size={18} />
                  Brought to life
                </p>
              ) : (
                <div className="puzzle-items">
                  {progress.discoveries.length === 0 ? (
                    <p>Your pockets are empty.</p>
                  ) : (
                    progress.discoveries.map((id) => (
                      <button
                        className="text-action"
                        key={id}
                        onClick={() => {
                          if (canRepair(puzzle.id, id, progress.discoveries, progress.repaired)) {
                            setProgress((p) => ({ ...p, repaired: [...p.repaired, puzzle.id] }));
                            setHeld(null);
                            setNotice(puzzle.solved);
                          } else setNotice('That does not fit.');
                        }}
                      >
                        <Hand size={17} />
                        Use {discoveries.find((d) => d.id === id)?.name.toLowerCase()}
                      </button>
                    ))
                  )}
                </div>
              )}
            </section>
          ) : panel === 'inventory' ? (
            <section className="pockets">
              <div className="pocket-items">
                {discoveries.map((d) => (
                  <button
                    key={d.id}
                    disabled={!progress.discoveries.includes(d.id)}
                    aria-pressed={held === d.id}
                    onClick={() => {
                      setHeld(d.id);
                      setPanel(null);
                    }}
                  >
                    <Backpack size={22} />
                    <span>
                      <strong>
                        {progress.discoveries.includes(d.id) ? d.name : 'Not yet found'}
                      </strong>
                      <small>
                        {progress.discoveries.includes(d.id)
                          ? d.description
                          : 'Somewhere in the workshop.'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="field-notes">
                {puzzles.map((p) => (
                  <div key={p.id}>
                    {progress.repaired.includes(p.id) ? <Check size={17} /> : <Wrench size={17} />}
                    {p.name}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section>
              {panel === 'index' ? (
                <input
                  className="room-search"
                  type="search"
                  aria-label="Search projects"
                  placeholder="Search projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              ) : null}
              <div className={panel === 'sky' ? 'paper-constellation' : 'room-projects'}>
                {panel === 'sky' ? (
                  <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      points="18,14 50,14 82,14 82,38 50,38 18,38 18,62 50,62 82,62 82,86 50,86 18,86"
                      fill="none"
                      stroke="#a1c6b4"
                      strokeWidth=".3"
                    />
                  </svg>
                ) : null}
                {listed.map((w, i) => (
                  <button
                    key={w.id}
                    style={
                      panel === 'sky'
                        ? { left: `${18 + (i % 3) * 32}%`, top: `${14 + Math.floor(i / 3) * 24}%` }
                        : undefined
                    }
                    onClick={() => open(w.id)}
                  >
                    <span>
                      {panel === 'sky' ? <Sparkles size={17} /> : String(i + 1).padStart(2, '0')}
                    </span>
                    <strong>{w.name}</strong>
                    <small>{w.kind}</small>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
              {listed.length === 0 ? <p>No matching projects.</p> : null}
            </section>
          )}
        </div>
      </dialog>
      <noscript>
        <nav>
          {works.map((w) => (
            <a key={w.id} href={w.href}>
              {w.name}
            </a>
          ))}
        </nav>
      </noscript>
    </main>
  );
}
