'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function DiscordHandle() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    try { await navigator.clipboard.writeText('wispcream'); setStatus('copied'); }
    catch { setStatus('failed'); }
  }
  return <><button className="copy-handle" type="button" onClick={copy} aria-label="Copy Discord username wispcream">{status === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button><span className="copy-status" role="status">{status === 'copied' ? 'Username copied' : status === 'failed' ? 'Copy manually: wispcream' : ''}</span></>;
}
