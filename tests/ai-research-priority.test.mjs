import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /const ownInf=arm\.filter\(u=>INFARM\.has\(u\.k\)\)\.length,ownRanged=arm\.filter\(u=>ARCHARM\.has\(u\.k\)\)\.length,ownCav=arm\.filter\(u=>CAVARM\.has\(u\.k\)\)\.length/,
  'AI research scoring must measure its own infantry, ranged and cavalry composition');
assert.match(ai, /if\(k==='armR'&&ownRanged>=3\)score\+=32/);
assert.match(ai, /if\(k==='armI'&&ownInf>=3\)score\+=30/);
assert.match(ai, /if\(k==='armC'&&ownCav>=3\)score\+=32/);
assert.match(ai, /if\(k==='atkM'&&ownInf>=4\)score\+=24/);
assert.match(ai, /if\(k==='atkR'&&ownRanged>=4\)score\+=24/);
assert.match(ai, /if\(k==='atkM2'&&ownInf\+ownCav<2\)score-=28/, 'AI should not waste expensive advanced melee attack research before fielding melee troops');
assert.match(ai, /if\(k==='atkR2'&&ownRanged<2\)score-=28/, 'AI should not waste expensive advanced ranged attack research before fielding ranged troops');
assert.match(ai, /if\(k==='armI'&&humanRanged>=3\)score\+=12/,
  'enemy ranged pressure can still influence defensive research without overriding own-unit value');

assert.match(ai, /const navalThreatCount=S\.us\.filter\(e=>isHostile\(t,e\.t\)&&e\.hp>0&&U\[e\.k\]\.sh&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\.length/,
  'AI fleet planning must count hostile combat ships without counting fishing, transport or trade ships');
assert.match(ai, /my\.filter\(u=>u\.k==='gal'\)\.length<Math\.min\(12,Math\.max\(4,2\+2\*navalThreatCount\)\)/,
  'AI war-galley production must scale from a four-ship baseline up to twelve against hostile fleets');

console.log('ai-research-priority: military upgrades respond to own army composition');
