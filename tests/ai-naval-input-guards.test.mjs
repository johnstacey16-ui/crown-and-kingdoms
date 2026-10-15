import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'Naval threat scanning must use one guarded pass');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\)continue/,
  'Naval threat scanning must reject malformed, friendly, defeated and unknown ship records');
assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Warship target selection must exclude garrisoned ships and fishing boats');
assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;hostileFleet\.push\(e\)\}/,
  'Garrisoned combat ships must not inflate the naval threat count or trigger fleet-avoidance behaviour');
console.log('ai-naval-input-guards: consolidated naval threat scan validates unit records');
