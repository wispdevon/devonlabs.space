'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Heart, RotateCcw } from 'lucide-react';
import { photographs } from '@/data/workshop';

export default function WorkshopPreview({ kind }: { kind: 'portrait' | 'review' | 'sheet' }) {
  const [scale, setScale] = useState(1);
  const [framing, setFraming] = useState('4:5');
  const [photo, setPhoto] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [columns, setColumns] = useState(3);
  const [film, setFilm] = useState(true);
  if (kind === 'portrait')
    return (
      <section className="work-preview" aria-label="Portrait framing preview">
        <h3>
          Portrait framing <span>Preview</span>
        </h3>
        <div
          className="portrait-preview"
          style={{ aspectRatio: framing === '1:1' ? '1' : framing === '4:5' ? '4/5' : '3/4' }}
        >
          <Image
            src="/developer/wisp.jpg"
            alt="Wisp portrait with adjustable framing"
            width={480}
            height={480}
            style={{ transform: `scale(${scale})` }}
          />
          <div className="frame-guide" />
        </div>
        <fieldset className="segmented">
          <legend>Aspect ratio</legend>
          {['1:1', '4:5', '3:4'].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="framing"
                checked={framing === value}
                onChange={() => setFraming(value)}
              />
              {value}
            </label>
          ))}
        </fieldset>
        <label className="slider-field">
          Crop{' '}
          <input
            aria-label="Portrait crop"
            type="range"
            min="1"
            max="2.3"
            step=".02"
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          />
        </label>
      </section>
    );
  if (kind === 'review')
    return (
      <section className="work-preview" aria-label="Photo review preview">
        <h3>
          Rediscovery{' '}
          <span>
            Preview · {photo + 1}/{photographs.length}
          </span>
        </h3>
        <Image
          className="review-photo"
          src={photographs[photo].image}
          alt={photographs[photo].alt}
          width={800}
          height={800}
        />
        <div className="preview-actions">
          <button
            title="Previous photograph"
            aria-label="Previous photograph"
            onClick={() => setPhoto((photo - 1 + photographs.length) % photographs.length)}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            aria-label="Favorite photograph"
            title="Favorite photograph"
            aria-pressed={favorites.includes(photo)}
            onClick={() => {
              setFavorites(
                favorites.includes(photo)
                  ? favorites.filter((i) => i !== photo)
                  : [...favorites, photo]
              );
            }}
          >
            <Heart size={19} fill={favorites.includes(photo) ? 'currentColor' : 'none'} />
          </button>
          <span>{favorites.length} favorites</span>
          <button
            title="Next photograph"
            aria-label="Next photograph"
            onClick={() => setPhoto((photo + 1) % photographs.length)}
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </section>
    );
  return (
    <section className="work-preview" aria-label="Contact sheet preview">
      <h3>
        Contact sheet <span>Preview</span>
      </h3>
      <div
        className={`sheet-preview ${film ? 'film' : ''}`}
        style={{ gridTemplateColumns: `repeat(${columns},1fr)` }}
      >
        {photographs.slice(0, 6).map((item, i) => (
          <figure key={item.id}>
            <Image src={item.image} alt={item.alt} width={350} height={350} />
            <figcaption>{String(i + 1).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
      <label className="slider-field">
        Columns{' '}
        <input
          aria-label="Contact sheet columns"
          type="range"
          min="2"
          max="4"
          value={columns}
          onChange={(event) => setColumns(Number(event.target.value))}
        />
        <output>{columns}</output>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={film} onChange={(event) => setFilm(event.target.checked)} />
        <Check size={16} />
        Film border
      </label>
      <button
        className="text-action"
        onClick={() => {
          setColumns(3);
          setFilm(true);
        }}
      >
        <RotateCcw size={15} />
        Reset layout
      </button>
    </section>
  );
}
