'use client';

/* eslint-disable @next/next/no-img-element */
import Image from '../portfolio/responsive-image';
import { useEffect, useRef, useState } from 'react';
import media from '../../data/workshop-media.json';

export default function Gallery() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photograph = media.photos[selected];
  const move = (delta: number) => setSelected(index => (index + delta + media.photos.length) % media.photos.length);

  return <>
    <div className="photo-gallery original-color">{media.photos.map((photo, index) => <button type="button" className="gallery-photo" key={photo.id} aria-label={`Open photograph ${index + 1}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); setOpen(true); }}>
      <Image src={photo.image} alt={photo.alt} width={photo.ratio > 1 ? 1600 : 1066} height={photo.ratio > 1 ? 1066 : 1600} sizes="(max-width: 600px) calc((100vw - 52px) / 2), (max-width: 850px) calc((100vw - 100px) / 3), (max-width: 1280px) calc((100vw - 384px - clamp(60px, 8vw, 140px)) / 4), 199px" />
    </button>)}</div>
    <p className="gallery-caption">A selection from my public photograph collection.</p>
    <dialog ref={dialog} className="photo-dialog" aria-labelledby="photo-dialog-title" onClose={() => { setOpen(false); trigger.current?.focus(); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
      <div className="dialog-heading"><h2 id="photo-dialog-title">The Best <span className="mono">{selected + 1} / {media.photos.length}</span></h2><form method="dialog"><button type="submit" className="dialog-close">Close <span aria-hidden="true">×</span></button></form></div>
      {open ? <img key={photograph.id} src={photograph.image} alt={photograph.alt} width={photograph.ratio > 1 ? 1600 : 1066} height={photograph.ratio > 1 ? 1066 : 1600} className="expanded-photo" /> : null}
      <div className="dialog-actions"><button type="button" onClick={() => move(-1)}>Previous photograph</button><span className="mono">Original photograph</span><button type="button" onClick={() => move(1)}>Next photograph</button></div>
    </dialog>
  </>;
}
