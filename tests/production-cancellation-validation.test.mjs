import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function cancelQ(b){');
const end = simulation.indexOf('\nfunction okPlace(', start);
assert.ok(start >= 0 && end > start, 'Queue cancellation must remain isolated');
const cancel = simulation.slice(start, end);

assert.match(cancel, /^function cancelQ\(b\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!Array\.isArray\(b\.q\)\|\|!b\.q\.length\)return false;/,
  'Cancellation must reject dead, unfinished, invalid-owner and empty-queue buildings');
assert.match(cancel, /if\(!q\|\|!U\[q\.k\]\)\{b\.q\.pop\(\);return false\}/,
  'Malformed queue entries must not cause a refund');
assert.match(cancel, /b\.q\.pop\(\);pay\(b\.t,U\[q\.k\]\.cost,1\);note\('Cancelled - full refund'\);return true/,
  'Valid cancellation must remove the newest queue item and refund its unit cost');

console.log('production-cancellation-validation: stale and malformed cancellation rejected');
