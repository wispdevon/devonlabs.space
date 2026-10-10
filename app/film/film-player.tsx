'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

export default function FilmPlayer() {
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
    <div className="film-cover duotone"><Image src="/workshop/camp-poster.jpg" alt="A filmmaker carrying equipment at The One Camp" width={1920} height={1080} sizes="90vw" priority /></div>
    <div className="film-description"><div><h2>The One Camp ’26</h2><p>A camp film made with photographers, videographers, and creatives, ready to screen on the third day.</p></div><div className="film-metadata"><p className="mono">2026 / Collaborative film</p><button type="button" className="text-link" onClick={play}>Watch the film <span aria-hidden="true">→</span></button></div></div>
    <video ref={video} className={`film-video ${started ? 'film-started' : ''}`} src="https://photo.devonlabs.space/content/media/2026/08/Highlights-1.mp4" aria-label="The One Camp ’26 film" controls playsInline preload="none" tabIndex={0} onPlay={() => setStarted(true)} onError={() => setError(true)}>
      Your browser does not support embedded video. <a href="https://photo.devonlabs.space/the-one-camp-26/">Watch the film on the photography site.</a>
    </video>
    {error ? <p className="media-error" role="alert">The film could not start. Try the player controls or <a href="https://photo.devonlabs.space/the-one-camp-26/">watch it on the photography site</a>.</p> : null}
  </>;
}
