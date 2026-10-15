import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'AI counter-composition planning should share the guarded hostile roster pass');
assert.match(ai, /if\(!e\|\|!Number\.isInteger\(e\.t\)\|\|!isHostile\(t,e\.t\)\|\|e\.hp<=0\|\|!U\[e\.k\]\)continue/,
  'AI counter-planning must ignore malformed, unknown, friendly and defeated enemy records');
assert.match(ai, /if\(!e\.ld&&!U\[e\.k\]\.sh\)humanArmy\.push\(e\)/,
  'AI land counter-composition must exclude garrisoned units and ships');
assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)humanShips\.push\(e\)/,
  'AI naval counter-planning must exclude garrisoned, non-combat and malformed ship records');
assert.match(ai, /!S\.us\.some\(e=>e&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&e\.hp>0&&!e\.ld&&U\[e\.k\]\?\.dmg>3/,
  'AI building-repair threat checks must not crash on malformed enemy records');
console.log('ai-enemy-composition-guards: consolidated counter-planning and repair-threat guards passed');
