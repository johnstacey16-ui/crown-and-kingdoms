import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function upB(b,dt)');
const end = simulation.indexOf('\nfunction ', start + 1);
assert.ok(start >= 0 && end > start, 'Building update function must remain isolated');
const update = simulation.slice(start, end);

assert.match(update, /^function upB\(b,dt\)\{if\(!b\.done\|\|b\.hp<=0\)return;/,
  'Destroyed buildings must not advance research or production after being destroyed during the same simulation tick');
assert.match(update, /if\(b\.rs\)\{b\.rs\.t-=dt/,
  'Living completed buildings must continue advancing research');
assert.match(update, /if\(!b\.q\.length\)return;const q=b\.q\[0\]/,
  'Living completed buildings must continue processing their production queue');

console.log('destroyed-building-work: defeated buildings cannot finish research or production');
