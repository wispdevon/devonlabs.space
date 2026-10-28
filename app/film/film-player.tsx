'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import type { films } from '../../data/films';

export default function FilmPlayer({ film, poster }: { film: (typeof films)[number]; poster: ReactNode }) {
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
    <div className="film-cover duotone">{poster}</div>
    <div className="film-description"><div><h2>{film.title}</h2><p>{film.description}</p></div><div className="film-metadata"><p className="mono">{film.metadata}</p><button type="button" className="text-link" onClick={play}>Watch the film <span aria-hidden="true">→</span></button></div></div>
    <video ref={video} className={`film-video ${started ? 'film-started' : ''}`} style={started ? { aspectRatio: `${film.width} / ${film.height}` } : undefined} width={film.width} height={film.height} src={film.src} aria-label={`${film.title} film`} controls playsInline preload="none" tabIndex={0} onPlay={() => setStarted(true)} onError={() => setError(true)}>
      Your browser does not support embedded video. <a href={film.sourceUrl}>Watch the original film.</a>
    </video>
    {error ? <p className="media-error" role="alert">The film could not start. Try the player controls or <a href={film.sourceUrl}>watch the original film</a>.</p> : null}
  </>;
}
