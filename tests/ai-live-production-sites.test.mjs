import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /for\(const b of bl\)if\(b\.done&&b\.hp>0&&B\[b\.k\]\?\.tr&&b\.k!=='tc'&&Array\.isArray\(b\.q\)&&b\.q\.length<2\)/,
  'AI must only produce units at living, completed buildings with valid queues');
assert.match(ai, /for\(const b of bl\)if\(b\.done&&b\.hp>0&&rsOf\(b\)\.length&&!b\.rs\)/,
  'AI must not select destroyed buildings for technology research');
console.log('ai-live-production-sites: production and research decisions ignore destroyed buildings and malformed queues');
