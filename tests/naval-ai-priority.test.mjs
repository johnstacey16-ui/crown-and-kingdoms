import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = ['config','state','mapgen','audio','save','input','render','simulation','ai'].map(name => readFileSync(new URL('../js/'+name+'.js', import.meta.url), 'utf8')).join('\n') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');

assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'AI should build hostile naval rosters with one unit-list pass');
assert.match(ai, /if\(!e\.ld&&e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'naval target candidates must exclude garrisoned ships and fishing boats');
assert.match(ai, /focusCounts=new Map\(\);for\(const u of galleys\)if\(u\.o==='a'&&u\.tg\)focusCounts\.set\(u\.tg,\(focusCounts\.get\(u\.tg\)\|\|0\)\+1\)/,
  'AI must track focus fire across its galley fleet');
assert.match(ai, /navalTargetScore=e=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)-\(e\.k==='gal'\?6:0\)\+\(U\[e\.k\]\.dmg>=4\?0:10\)-Math\.min\(3,focusCounts\.get\(e\)\|\|0\)\*4/,
  'naval target scoring must combine distance, combat capability, galley priority and coordinated focus');
assert.match(ai, /galleys\.filter\(u=>\(u\.o==='i'\|\|\(u\.o==='m'&&!u\.tg\)\|\|\(u\.o==='a'&&\(!u\.tg\|\|u\.tg\.hp<=0\|\|u\.tg\.ld\|\|!isHostile\(t,u\.tg\.t\)\)\)\)/,
  'war galleys must reacquire targets after their current target dies, is garrisoned, or is no longer hostile');
assert.match(ai, /const navalCandidates=S\.t>=\(ship\.nextNavalTargetAt\|\|0\)\?hostileShips\.filter\(e=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)<28\)\.sort\(\(a,b\)=>navalTargetScore\(a\)-navalTargetScore\(b\)\):\[\]/,
  'AI naval targeting must score only nearby candidates after the re-target cooldown');
assert.match(ai, /for\(const candidate of navalCandidates\.slice\(0,6\)\)if\(path\(ship,goalNear\(candidate,Math\.max\(1,attackRange\(ship\)\)\)\)\)\{enemy=candidate;break\}/,
  'AI must test at most six score-ranked reachable enemy ships before engaging');
assert.match(ai, /u\.o==='m'&&!u\.tg/, 'AI war galleys moving without a target must be eligible to reacquire nearby hostile ships');
assert.match(ai, /hostileShips\.filter\(e=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)<28\)/,
  'ship engagement candidates must stay within the local 28-tile combat radius');
assert.match(ai, /if\(enemy\)\{ship\.o='a';ship\.tg=enemy;ship\.p=\[\];focusCounts\.set\(enemy/,
  'a reachable nearby hostile ship must be assigned as the galley attack target');
assert.match(html, /counterPlans=isDock\?\(enemyShips\?\[\{threat:enemyShips,units:\['gal'\]\}\]:\[\]\)/,
  'AI docks must train a war galley in response to even one confirmed enemy combat ship');
console.log('naval-ai-priority: consolidated threat scan preserves targeting and counter-priorities');

