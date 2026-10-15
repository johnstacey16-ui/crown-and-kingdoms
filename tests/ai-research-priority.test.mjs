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
assert.match(ai, /if\(k==='armI'&&humanRanged>=3\)score\+=12/,
  'enemy ranged pressure can still influence defensive research without overriding own-unit value');

console.log('ai-research-priority: military upgrades respond to own army composition');
