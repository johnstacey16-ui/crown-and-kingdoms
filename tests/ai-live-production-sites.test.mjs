import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /for\(const b of bl\)if\(b\.done&&b\.hp>0&&B\[b\.k\]\?\.tr&&b\.k!=='tc'&&!b\.rs&&Array\.isArray\(b\.q\)&&b\.q\.length<2\)/,
  'AI must train only at living completed production sites with valid queues and no research in progress');
assert.match(ai, /for\(const b of bl\)if\(b\.done&&b\.hp>0&&rsOf\(b\)\.length&&!b\.rs&&\(!Array\.isArray\(b\.q\)\|\|!b\.q\.length\)\)/,
  'AI must research only in living completed buildings with no active production');
console.log('ai-live-production-sites: production and research decisions ignore destroyed buildings and malformed queues');
