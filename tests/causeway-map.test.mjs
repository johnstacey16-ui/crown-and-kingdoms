import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mapgen = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(mapgen, /\[null,\{mt:0,seed:202611\}[^\]]*\{mt:7,seed:202622\},\{mt:7,seed:202623\}\]/,
  'King’s Causeway must retain its fixed map seed and named-layout index');
assert.match(mapgen, /if\(mapLayout===12\)[\s\S]*?ford=\[\.22,\.5,\.78\]/,
  'King’s Causeway must carve three shallow crossing bands along its strait');
assert.match(mapgen, /if\(mapLayout===12\)[\s\S]*?S\.wt\[i\]=ford\?2:1;S\.g\[i\]=ford\?0:1/,
  'Causeway water must remain navigable and shallow crossings must remain land-passable');
assert.match(mapgen, /!bs\.some\(b=>Math\.hypot\(b\[0\]-x,b\[1\]-y\)<12\)/,
  'Causeway terrain carving must preserve protected starting-base areas');
assert.match(engine, /mapLayout=cl\(st\.mapLayout\|0,0,13\)/,
  'The named layout must remain selectable after loading saved settings');

console.log('King’s Causeway layout checks passed.');
