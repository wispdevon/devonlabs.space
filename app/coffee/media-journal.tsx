'use client';

/* eslint-disable @next/next/no-img-element */
import Image from '../portfolio/responsive-image';
import { useEffect, useRef, useState } from 'react';
import media from '../../data/coffee-media.json';

export default function MediaJournal() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photo = media.photos[selected];
  const move = (delta: number) => setSelected(index => (index + delta + media.photos.length) % media.photos.length);

  return <>
    <div className="coffee-media coffee-videos">{media.videos.map(item => <figure key={item.src}><video controls playsInline preload="none" poster={item.poster} width={item.width} height={item.height} aria-label={item.title}><source src={item.src} type={item.codec === 'av1' ? 'video/mp4; codecs="av01.0.12M.08, opus"' : 'video/mp4'} />Your browser cannot play this video. <a href={item.src}>Open the original video</a></video><figcaption><span>{item.title}</span><a href={item.src}>Watch original · {item.width} × {item.height} ↗</a></figcaption></figure>)}</div>
    <div className="coffee-media coffee-photos">{media.photos.map((item, index) => <button type="button" key={item.image} className="gallery-photo" aria-label={`Open coffee photograph ${index + 1}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); setOpen(true); }}><Image src={item.image} alt={item.alt} width={item.width} height={item.height} sizes={index === 0 ? '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px' : '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc((100vw - 100px) / 3), (max-width: 1280px) calc((100vw - 336px - clamp(60px, 8vw, 140px)) / 3), 281px'} /></button>)}</div>

    <a className="text-link" href={media.source}>View the Home Coffee album ↗</a>
    <dialog ref={dialog} className="photo-dialog" aria-labelledby="coffee-photo-title" onClose={() => { setOpen(false); trigger.current?.focus(); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
      <div className="dialog-heading"><h2 id="coffee-photo-title">Home Coffee <span className="mono">{selected + 1} / {media.photos.length}</span></h2><form method="dialog"><button type="submit" className="dialog-close">Close <span aria-hidden="true">×</span></button></form></div>
      {open ? <img key={photo.image} src={photo.image} alt={photo.alt} width={photo.width} height={photo.height} className="expanded-photo" /> : null}
      <div className="dialog-actions"><button type="button" onClick={() => move(-1)}>Previous photograph</button><span className="mono">Original photograph</span><button type="button" onClick={() => move(1)}>Next photograph</button></div>
    </dialog>
  </>;
}
