import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /bl\.filter\(b2=>b2\.k==='dock'&&b2\.hp>0&&Array\.isArray\(b2\.q\)\)\.reduce\(\(n,b2\)=>n\+b2\.q\.filter\(q=>q==='gal'\)\.length,0\)/,
  'AI naval cap calculations must ignore malformed dock queues instead of crashing');
console.log('ai-naval-queue-shape: queued-galley accounting tolerates malformed dock queues');
