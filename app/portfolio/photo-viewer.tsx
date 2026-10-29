'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Masonry from '../photography/masonry';

export type ViewerPhoto = {
  image: string;
  alt: string;
  width: number;
  height: number;
  thumbnail: ReactNode;
};

type PhotoViewerProps = {
  photos: ViewerPhoto[];
  title: string;
  titleId: string;
  thumbnailLabel: string;
  className: string;
  masonry?: boolean;
};

export default function PhotoViewer({ photos, title, titleId, thumbnailLabel, className, masonry = false }: PhotoViewerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const photo = photos[selected];

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  function move(delta: number) {
    setSelected(index => (index + delta + photos.length) % photos.length);
  }

  const thumbnails = photos.map((item, index) => <button
    type="button"
    key={item.image}
    className="gallery-photo"
    aria-label={`${thumbnailLabel} ${index + 1}`}
    onClick={event => { trigger.current = event.currentTarget; setSelected(index); setOpen(true); }}
  >{item.thumbnail}</button>);

  return <>
    {masonry ? <Masonry className={className}>{thumbnails}</Masonry> : <div className={className}>{thumbnails}</div>}
    <dialog ref={dialog} className="photo-dialog" aria-labelledby={titleId} onClose={() => { setOpen(false); trigger.current?.focus(); }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    }}>
      <div className="dialog-heading"><h2 id={titleId}>{title} <span className="mono">{selected + 1} / {photos.length}</span></h2><form method="dialog"><button type="submit" className="dialog-close">Close <span aria-hidden="true">×</span></button></form></div>
      {open ? <img key={photo.image} src={photo.image} alt={photo.alt} width={photo.width} height={photo.height} className="expanded-photo" /> : null}
      <div className="dialog-actions"><button type="button" onClick={() => move(-1)}>Previous photograph</button><span className="mono">Original photograph</span><button type="button" onClick={() => move(1)}>Next photograph</button></div>
    </dialog>
  </>;
}
