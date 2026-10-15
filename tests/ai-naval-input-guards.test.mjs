import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'Naval threat scanning must use one guarded pass');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\?\.sh\)continue/,
  'Naval threat scanning must reject malformed, friendly, defeated and unknown ship records');
assert.match(ai, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Warship target selection must continue to exclude fishing boats');
assert.match(ai, /if\(e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;if\(!e\.ld\)hostileFleet\.push\(e\)\}/,
  'Active threat avoidance excludes garrisoned combat ships while the strategic threat count retains the previous rule');
console.log('ai-naval-input-guards: consolidated naval threat scan validates unit records');
