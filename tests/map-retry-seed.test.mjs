import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mapgen = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');

assert.match(
  mapgen,
  /mk\(seedOv!=null\?\(seedOv\+tries\)&0xffffff:\(Date\.now\(\)\+tries\*104729\)&0xffffff\)/,
  'Each retry of an unseeded generated map must use a different seed even when retries happen in the same millisecond'
);
assert.match(
  mapgen,
  /if\(!mapAudit\.ok&&tries<12\)return newGame\(tries\+1\)/,
  'Disconnected starting regions must continue to trigger bounded map regeneration'
);

console.log('Map retry seed regression checks passed.');
