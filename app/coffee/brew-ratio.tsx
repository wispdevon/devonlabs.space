'use client';

import { useState } from 'react';

export default function BrewRatio() {
  const [dose, setDose] = useState(18);
  const [ratio, setRatio] = useState(16);
  const valid = Number.isFinite(dose) && Number.isFinite(ratio) && dose >= 1 && dose <= 100 && ratio >= 1 && ratio <= 30;
  return <fieldset className="brew-ratio"><legend>Brew ratio</legend><p className="brew-help">A little arithmetic for your next cup. Change the dose or ratio to calculate the water.</p><div className="brew-inputs">
    <label>Coffee dose <span className="mono">grams</span><input type="number" min="1" max="100" step="any" defaultValue="18" onChange={event => setDose(event.target.valueAsNumber)} /></label>
    <label>Ratio <span className="mono">1 : water</span><input type="number" min="1" max="30" step="any" defaultValue="16" onChange={event => setRatio(event.target.valueAsNumber)} /></label>
  </div><output aria-live="polite" className="brew-result">{valid ? <><strong>{Math.round(dose * ratio * 10) / 10}</strong><span>g water</span></> : <span>Enter a dose from 1–100 g and a ratio from 1–30.</span>}</output><p className="mono brew-footnote">Water = coffee dose × ratio</p></fieldset>;
}
