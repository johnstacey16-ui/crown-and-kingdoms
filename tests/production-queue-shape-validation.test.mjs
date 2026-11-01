import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation-production-queues.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function train(b,k){');
const end = simulation.indexOf('\nfunction cancelQ(', start);
assert.ok(start >= 0 && end > start, 'Training command must remain isolated');
const train = simulation.slice(start, end);

assert.match(train, /^function train\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]/,
  'Training must reject invalid buildings and owners');
assert.match(train, /!Array\.isArray\(B\[b\.k\]\.tr\)\|\|!trOf\(b\)\.includes\(k\)\|\|!U\[k\]\|\|!Array\.isArray\(b\.q\)/,
  'Training must validate supported unit types and the production queue before reading its length');
assert.match(train, /if\(!can\(t,d\.cost\)\)/,
  'Resource affordability must be checked before spending');
assert.match(train, /if\(b\.q\.length>=5\)return false;pay\(t,d\.cost\);b\.q\.push/,
  'Queue capacity must be checked before spending resources and appending the unit');

console.log('production-queue-validation: malformed queues are rejected before resource changes');
