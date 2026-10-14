'use client';

import Image from '../portfolio/responsive-image';
import { useRef, useState } from 'react';
import type { films } from '../../data/films';

export default function FilmPlayer({ film, priority = false }: { film: (typeof films)[number]; priority?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  async function play() {
    setStarted(true);
    setError(false);
    video.current?.focus();
    try { await video.current?.play(); } catch { setError(true); }
  }

  return <>
    <div className="film-cover duotone"><Image src={film.poster} alt={film.posterAlt} width={film.width} height={film.height} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px" priority={priority} /></div>
    <div className="film-description"><div><h2>{film.title}</h2><p>{film.description}</p></div><div className="film-metadata"><p className="mono">{film.metadata}</p><button type="button" className="text-link" onClick={play}>Watch the film <span aria-hidden="true">→</span></button></div></div>
    <video ref={video} className={`film-video ${started ? 'film-started' : ''}`} style={started ? { aspectRatio: `${film.width} / ${film.height}` } : undefined} width={film.width} height={film.height} src={film.src} aria-label={`${film.title} film`} controls playsInline preload="none" tabIndex={0} onPlay={() => setStarted(true)} onError={() => setError(true)}>
      Your browser does not support embedded video. <a href={film.sourceUrl}>Watch the original film.</a>
    </video>
    {error ? <p className="media-error" role="alert">The film could not start. Try the player controls or <a href={film.sourceUrl}>watch the original film</a>.</p> : null}
  </>;
}
