import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'Naval threat scanning must use one guarded pass and ignore null or malformed unit records before reading unit metadata');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\?\.sh\)continue/,
  'Naval threat scanning must reject malformed, friendly, defeated and unknown ship records');
assert.match(ai, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Warship target selection must continue to exclude fishing boats');
  'Naval threat scanning must ignore null and malformed unit records before reading unit metadata');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'Naval threat scanning must use one guarded pass and ignore null or malformed unit records before reading unit metadata');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\?\.sh\)continue/,
  'Naval threat scanning must reject malformed, friendly, defeated and unknown ship records');
assert.match(ai, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Warship target selection must continue to exclude fishing boats');
  'Fishing-ship threat avoidance must ignore malformed enemy records');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'Naval threat scanning must use one guarded pass and ignore null or malformed unit records before reading unit metadata');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\?\.sh\)continue/,
  'Naval threat scanning must reject malformed, friendly, defeated and unknown ship records');
assert.match(ai, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Warship target selection must continue to exclude fishing boats');,
  'Warship target selection must ignore malformed enemy records');
console.log('ai-naval-input-guards: naval threat and target scans tolerate malformed unit records');
