import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /humanShips=S\.us\.filter\(u=>isHostile\(t,u\.t\)&&u\.hp>0&&!u\.ld&&U\[u\.k\]\.sh&&u\.k!=='fish'&&u\.k!=='trn'&&u\.k!=='cog'&&U\[u\.k\]\.dmg>=4\)/,
  'AI naval threat assessment must ignore fishing ships, transports and trade cogs');
assert.match(ai, /if\(k==='navalHull'&&humanShips\.length\)score\+=95/);
assert.match(ai, /if\(k==='navalAtk'&&humanShips\.some\(u=>u\.k==='gal'\)\)score\+=105/);

console.log('ai-naval-threats: economic and transport ships do not trigger combat counter-priorities');
