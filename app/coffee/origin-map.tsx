'use client';

import { useState, useSyncExternalStore } from 'react';
import countries from '../../data/world-countries.json';
import { coffeeChecklist, coffeeOrigins } from '../../data/coffee';

const storageKey = 'devon-coffee-origins';
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('coffee-checklist-change', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('coffee-checklist-change', listener); };
}
function snapshot() { try { return localStorage.getItem(storageKey) ?? '[]'; } catch { return '[]'; } }
const serverSnapshot = () => '[]';

export default function OriginMap() {
  const [selected, setSelected] = useState('764');
  const [saveError, setSaveError] = useState(false);
  const saved = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  let checked: string[] = [];
  try { const parsed: unknown = JSON.parse(saved); if (Array.isArray(parsed)) checked = parsed.filter((id): id is string => typeof id === 'string' && countries.some(country => country.id === id)); } catch { /* Ignore malformed local preferences. */ }
  const starterOrigins = countries.filter(item => coffeeChecklist.includes(item.id));
  function toggle(id: string) {
    try { localStorage.setItem(storageKey, JSON.stringify(checked.includes(id) ? checked.filter(item => item !== id) : [...checked, id])); window.dispatchEvent(new Event('coffee-checklist-change')); setSaveError(false); }
    catch { setSaveError(true); }
  }
  const country = countries.find(item => item.id === selected)!;
  const origin = coffeeOrigins[selected];
  const statusFor = (id: string) => checked.includes(id) || coffeeOrigins[id]?.status === 'tried' ? 'tried' : coffeeChecklist.includes(id) || coffeeOrigins[id]?.status === 'not-tried' ? 'not-tried' : 'unrecorded';
  const status = statusFor(selected) === 'tried' ? 'Checked off' : statusFor(selected) === 'not-tried' ? 'To try' : 'Not on the starter list';
  return <div className="origin-atlas">
    <svg className="origin-map" viewBox="0 0 960 420" role="img" aria-label={`Coffee origin map. Selected: ${country.name}, ${status}. Use the country selector below to explore.`}>
      <path d="M0 227H960M0 147H960M0 307H960" className="map-latitudes" />
      {countries.map(item => <path key={item.id} d={item.path} fillRule="evenodd" onClick={() => setSelected(item.id)} className={`map-country ${statusFor(item.id)} ${selected === item.id ? 'selected' : ''}`}><title>{item.name}</title></path>)}
    </svg>
    <div className="map-legend"><span><i className="tried" />Checked off</span><span><i className="not-tried" />To try</span><span><i className="unrecorded" />Other origins</span></div>
    <div className="origin-detail"><label htmlFor="coffee-country">Explore an origin<select id="coffee-country" value={selected} onChange={event => setSelected(event.target.value)}>{countries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div aria-live="polite"><h3>{country.name}</h3><p className="origin-status">{status}</p><p>{origin?.note ?? 'Coffee notes for this origin are still to come.'}</p></div></div>
    <div className="origin-checklist"><h3>Origin checklist</h3><p className="map-caption">A starter list to explore, not a complete tasting history. Check off origins as you try them; progress is saved in this browser.</p><p className="mono checklist-count" aria-live="polite">{starterOrigins.filter(item => checked.includes(item.id)).length} / {starterOrigins.length} checked off</p><div>{starterOrigins.map(item => <label key={item.id}><input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} /><span>{item.name}</span></label>)}</div>{saveError ? <p role="alert" className="map-caption">This browser couldn’t save your checklist. Allow site storage to save checkmarks.</p> : null}</div>
  </div>;
}
