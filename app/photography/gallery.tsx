'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import media from '../../data/workshop-media.json';

export default function Gallery() {
  const [original, setOriginal] = useState(false);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photograph = media.photos[selected];
  const move = (delta: number) => setSelected(index => (index + delta + media.photos.length) % media.photos.length);

  return <>
    <div className="gallery-controls" role="group" aria-label="Photography color mode"><button type="button" aria-pressed={!original} onClick={() => setOriginal(false)}>Duotone</button><button type="button" aria-pressed={original} onClick={() => setOriginal(true)}>Original</button></div>
    <div className={`photo-gallery ${original ? 'original-color' : 'duotone-gallery'}`}>{media.photos.map((photo, index) => <button type="button" className="gallery-photo" key={photo.id} aria-label={`Open photograph ${index + 1}`} onClick={event => { trigger.current = event.currentTarget; setSelected(index); dialog.current?.showModal(); }}>
      <Image src={photo.image} alt={photo.alt} width={photo.ratio > 1 ? 1600 : 1066} height={photo.ratio > 1 ? 1066 : 1600} sizes="(max-width: 600px) 45vw, (max-width: 900px) 30vw, 23vw" priority={index === 0} />
    </button>)}</div>
    <p className="gallery-caption">A selection from my public photograph collection.</p>
    <dialog ref={dialog} className="photo-dialog" aria-labelledby="photo-dialog-title" onClose={() => trigger.current?.focus()} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
      <div className="dialog-heading"><h2 id="photo-dialog-title">The Best <span className="mono">{selected + 1} / {media.photos.length}</span></h2><form method="dialog"><button type="submit" className="dialog-close">Close <span aria-hidden="true">×</span></button></form></div>
      <Image key={photograph.id} src={photograph.image} alt={photograph.alt} width={photograph.ratio > 1 ? 1600 : 1066} height={photograph.ratio > 1 ? 1066 : 1600} sizes="90vw" className="expanded-photo" />
      <div className="dialog-actions"><button type="button" onClick={() => move(-1)}>Previous photograph</button><span className="mono">Original photograph</span><button type="button" onClick={() => move(1)}>Next photograph</button></div>
    </dialog>
  </>;
}
