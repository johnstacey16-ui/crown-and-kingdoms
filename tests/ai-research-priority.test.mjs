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
assert.match(ai, /atkM:62,atkR:62,atkM2:72,atkR2:72,armI:60/, 'Advanced attack upgrades should be highly valued once their army-class penalties no longer apply');
assert.match(ai, /if\(k==='atkM2'&&ownInf\+ownCav<2\)score-=28/, 'AI should not waste expensive advanced melee attack research before fielding melee troops');
assert.match(ai, /if\(k==='atkR2'&&ownRanged<2\)score-=28/, 'AI should not waste expensive advanced ranged attack research before fielding ranged troops');
assert.match(ai, /if\(k==='armI'&&humanRanged>=3\)score\+=12/,
  'enemy ranged pressure can still influence defensive research without overriding own-unit value');

assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;hostileFleet\.push\(e\)\}/,
  'AI fleet planning must count only active hostile combat ships, excluding loaded, fishing, transport and trade ships');
assert.match(ai, /my\.filter\(u=>u\.k==='gal'\)\.length\+queuedUnits\('gal'\)<Math\.min\(12,Math\.max\(4,2\+2\*navalThreatCount\)\)/,
  'AI war-galley production must count living and queued galleys against a 4–12 ship threat-scaled cap');
assert.match(ai, /const queuedUnits=k=>aiQueuedUnits\(bl,k\)/,
  'AI galley and other unit caps must use the shared malformed-queue-safe counter');
assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;hostileFleet\.push\(e\)\}/, 'Garrisoned or otherwise loaded ships must not trigger enemy fleet threat responses');
assert.match(ai, /if\(S\.age\[t\]>=1&&vil\.length>=9&&!cnt\('dock'\)&&\(arm\.length>=6\|\|navalThreatCount>0\)&&\(navalThreatCount>0\|\|S\.nodes\.some\(n=>n\.fi&&Math\.hypot\(n\.x-tc\.x,n\.y-tc\.y\)<24\)\)\)aiDock\(vil,tc,t\)/,
  'AI must attempt a dock when hostile combat ships threaten it, even without a nearby fish node');
assert.match(ai, /if\(u\.retreating\)\{const safe=u\.retreatTarget;if\(ratio>=\.55\|\|!safe\|\|safe\.hp<=0\)\{u\.retreating=false;u\.retreatTarget=null;/,
  'AI units must rejoin the army after recovery or when their retreat shelter is no longer valid');
assert.match(ai, /if\(u\.tg===safe\)\{u\.o='i';u\.tg=null;u\.p=\[\];u\.rp=0\}/,
  'Ending a retreat must clear the obsolete movement order so the unit can receive new commands');
console.log('ai-research-priority: military upgrades respond to own army composition and naval threats');
