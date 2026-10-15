import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function okPlace(t,k,x,y){');
const end = simulation.indexOf('\n/* Enemy strategy', start);
assert.ok(start >= 0 && end > start, 'Placement validator must remain isolated');
const okPlace = simulation.slice(start, end);

assert.match(okPlace, /^function okPlace\(t,k,x,y\)\{if\(!S\|\|!B\[k\]\|\|!Number\.isInteger\(t\)\|\|!S\.tech\[t\]\|\|!Number\.isInteger\(x\)\|\|!Number\.isInteger\(y\)\)return false/,
  'Reject missing game state, invalid building/team and non-integer coordinates before reading dimensions');
assert.match(okPlace, /if\(x<1\|\|y<1\|\|x\+s>W-1\|\|y\+s>H-1\)return false/,
  'Keep map boundary checks');
assert.match(okPlace, /if\(S\.g\[n\]\|\|S\.wt\[n\]\|\|\(t===0&&!S\.ex\[n\]\)\)return false/,
  'Keep terrain, water and player exploration placement restrictions');

console.log('building-placement-input-validation: invalid coordinates and definitions are rejected');
