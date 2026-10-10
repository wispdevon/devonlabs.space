'use client';

import { useState } from 'react';
import countries from '../../data/world-countries.json';
import { coffeeOrigins } from '../../data/coffee';

export default function OriginMap() {
  const [selected, setSelected] = useState('764');
  const country = countries.find(item => item.id === selected)!;
  const origin = coffeeOrigins[selected];
  const status = origin?.status === 'tried' ? 'Tried' : origin?.status === 'not-tried' ? 'Not tried yet' : 'Not recorded';
  return <div className="origin-atlas">
    <svg className="origin-map" viewBox="0 0 960 420" role="img" aria-label={`Coffee origin map. Selected: ${country.name}, ${status}. Use the country selector below to explore.`}>
      <path d="M0 227H960M0 147H960M0 307H960" className="map-latitudes" />
      {countries.map(item => <path key={item.id} d={item.path} fillRule="evenodd" onClick={() => setSelected(item.id)} className={`map-country ${coffeeOrigins[item.id]?.status ?? 'unrecorded'} ${selected === item.id ? 'selected' : ''}`}><title>{item.name}</title></path>)}
    </svg>
    <div className="map-legend"><span><i className="tried" />Tried</span><span><i className="not-tried" />Not tried yet</span><span><i className="unrecorded" />Not recorded</span></div>
    <div className="origin-detail"><label htmlFor="coffee-country">Explore an origin<select id="coffee-country" value={selected} onChange={event => setSelected(event.target.value)}>{countries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div aria-live="polite"><h3>{country.name}</h3><p className="origin-status">{status}</p><p>{origin?.note ?? 'Coffee notes for this origin are still to come.'}</p></div></div>
    <p className="map-caption">{Object.keys(coffeeOrigins).length === 0 ? 'The atlas is waiting for its first entries. ' : ''}Unrecorded origins don’t imply I haven’t tried them.</p>
  </div>;
}
