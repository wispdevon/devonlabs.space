'use client';

import { useState } from 'react';
import countries from '../../data/world-countries.json';
import { coffeeChecklist, coffeeOrigins } from '../../data/coffee';

export default function OriginMap() {
  const [selected, setSelected] = useState('764');
  const starterOrigins = countries.filter(item => coffeeChecklist.includes(item.id));
  const country = countries.find(item => item.id === selected)!;
  const origin = coffeeOrigins[selected];
  const statusFor = (id: string) => coffeeOrigins[id]?.status === 'tried' ? 'tried' : coffeeOrigins[id]?.status === 'not-tried' ? 'not-tried' : 'unrecorded';
  const status = statusFor(selected) === 'tried' ? (coffeeOrigins[selected]?.favorite ? 'Tried · Favorite' : 'Tried') : statusFor(selected) === 'not-tried' ? 'To try next' : 'Unrecorded';
  return <div className="origin-atlas">
    {Object.values(coffeeOrigins).some(origin => origin.status === 'tried') ? null : <p className="map-caption">No confirmed tasting records published yet.</p>}
    <svg className="origin-map" viewBox="0 0 960 420" role="img" aria-label={`Coffee origin map. Selected: ${country.name}, ${status}. Use the country selector below to explore.`}>
      <path d="M0 227H960M0 147H960M0 307H960" className="map-latitudes" />
      {countries.map(item => <path key={item.id} d={item.path} fillRule="evenodd" onClick={() => setSelected(item.id)} className={`map-country ${statusFor(item.id)} ${selected === item.id ? 'selected' : ''}`}><title>{`${item.name}: ${statusFor(item.id) === 'tried' ? (coffeeOrigins[item.id]?.favorite ? 'Tried · Favorite' : 'Tried') : statusFor(item.id) === 'not-tried' ? 'To try next' : 'Unrecorded'}`}</title></path>)}
    </svg>
    <div className="map-legend"><span><i className="tried" />Tried</span><span><i className="not-tried" />To try next</span><span><i className="unrecorded" />Other origins</span></div>
    <div className="origin-detail"><label htmlFor="coffee-country">Explore an origin<select id="coffee-country" value={selected} onChange={event => setSelected(event.target.value)}>{countries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div aria-live="polite"><h3>{country.name}</h3><p className="origin-status">{status}</p>{origin?.note ? <p>{origin.note}</p> : null}</div></div>
    <section className="origin-history" aria-labelledby="history-title"><h3 id="history-title">Origins I’ve explored</h3><ul>{countries.filter(item => coffeeOrigins[item.id]?.status === 'tried').map(item => <li key={item.id}>{item.name}{coffeeOrigins[item.id]?.favorite ? <span className="mono"> — Favorite</span> : null}</li>)}</ul></section>
    <section className="origin-history" aria-labelledby="next-title"><h3 id="next-title">To try next</h3><ul>{countries.filter(item => coffeeOrigins[item.id]?.status === 'not-tried').map(item => <li key={item.id}>{item.name}</li>)}</ul></section>
    <div className="origin-checklist"><h3>Origins to explore</h3><p className="map-caption">A starter exploration list. Only origins confirmed in my published history are marked Tried.</p><div>{starterOrigins.map(item => <p key={item.id}>{item.name}<span className="mono"> — {statusFor(item.id) === 'tried' ? (coffeeOrigins[item.id]?.favorite ? 'Tried · Favorite' : 'Tried') : statusFor(item.id) === 'not-tried' ? 'To try next' : 'To explore'}</span></p>)}</div></div>
  </div>;
}
