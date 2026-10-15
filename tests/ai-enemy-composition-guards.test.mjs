import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const humanArmy=S\.us\.filter\(u=>u&&Number\.isInteger\(u\.t\)&&isHostile\(t,u\.t\)&&u\.hp>0&&!u\.ld&&!u\.sh&&U\[u\.k\]\)/,
  'AI counter-composition planning must ignore malformed, unknown, and garrisoned enemy records');
assert.match(ai, /humanShips=S\.us\.filter\(u=>u&&Number\.isInteger\(u\.t\)&&isHostile\(t,u\.t\)&&u\.hp>0&&!u\.ld&&U\[u\.k\]\?\.sh/,
  'AI naval counter-planning must ignore malformed or unknown enemy records');
assert.match(ai, /!S\.us\.some\(e=>e&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&e\.hp>0&&!e\.ld&&U\[e\.k\]\?\.dmg>3/,
  'AI building-repair threat checks must not crash on malformed enemy records');
console.log('ai-enemy-composition-guards: counter-planning and repair-threat scans skip invalid records');
