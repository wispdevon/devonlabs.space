'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import media from '../../data/coffee-media.json';

export default function MediaJournal() {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photo = media.photos[selected];
  const move = (delta: number) => setSelected(index => (index + delta + media.photos.length) % media.photos.length);

  return <>
    <div className="coffee-media coffee-photos">{media.photos.map((item, index) => <button type="button" key={item.image} className="gallery-photo" aria-label={`Open coffee photograph ${index + 1}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); dialog.current?.showModal(); }}><Image src={item.image} alt={item.alt} width={item.width} height={item.height} sizes="(max-width: 600px) 90vw, 350px" /></button>)}</div>
    <div className="coffee-media coffee-videos">{media.videos.map(item => <figure key={item.src}><video controls playsInline preload="none" poster={item.poster} width={item.width} height={item.height} aria-label={item.title}><source src={item.src} type="video/mp4" /></video><figcaption>{item.title}</figcaption></figure>)}</div>
    <a className="text-link" href={media.source}>View the Home Coffee album ↗</a>
    <dialog ref={dialog} className="photo-dialog" aria-labelledby="coffee-photo-title" onClose={() => trigger.current?.focus()} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
      <div className="dialog-heading"><h2 id="coffee-photo-title">Home Coffee <span className="mono">{selected + 1} / {media.photos.length}</span></h2><form method="dialog"><button type="submit" className="dialog-close">Close <span aria-hidden="true">×</span></button></form></div>
      <Image key={photo.image} src={photo.image} alt={photo.alt} width={photo.width} height={photo.height} sizes="90vw" className="expanded-photo" />
      <div className="dialog-actions"><button type="button" onClick={() => move(-1)}>Previous photograph</button><span className="mono">Original photograph</span><button type="button" onClick={() => move(1)}>Next photograph</button></div>
    </dialog>
  </>;
}
