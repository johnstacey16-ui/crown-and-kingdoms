import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const navalThreatCount=S\.us\.filter\(e=>e&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&e\.hp>0&&U\[e\.k\]\?\.sh/,
  'Naval threat scanning must ignore null and malformed unit records before reading unit metadata');
assert.match(ai, /const hostileFleet=S\.us\.filter\(e=>e&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&e\.hp>0&&!e\.ld&&U\[e\.k\]\?\.sh/,
  'Fishing-ship threat avoidance must ignore malformed enemy records');
assert.match(ai, /const hostileShips=S\.us\.filter\(u=>u&&Number\.isInteger\(u\.t\)&&isHostile\(t,u\.t\)&&u\.hp>0&&U\[u\.k\]\?\.sh/,
  'Warship target selection must ignore malformed enemy records');
console.log('ai-naval-input-guards: naval threat and target scans tolerate malformed unit records');
