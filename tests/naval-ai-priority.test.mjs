import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = ['config','state','mapgen','audio','save','input','render','simulation','ai'].map(name => readFileSync(new URL('../js/'+name+'.js', import.meta.url), 'utf8')).join('\n') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');

assert.match(ai, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'AI should build hostile naval rosters with one unit-list pass');
assert.match(ai, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'naval target candidates must be valid living hostile ships, not allied ships or fishing boats');
assert.match(ai, /focusCounts=new Map\(\);for\(const u of galleys\)if\(u\.o==='a'&&u\.tg\)focusCounts\.set\(u\.tg,\(focusCounts\.get\(u\.tg\)\|\|0\)\+1\)/,
  'AI must track focus fire across its galley fleet');
assert.match(ai, /navalTargetScore=e=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)-\(e\.k==='gal'\?6:0\)\+\(U\[e\.k\]\.dmg>=4\?0:10\)-Math\.min\(3,focusCounts\.get\(e\)\|\|0\)\*4/,
  'naval target scoring must combine distance, combat capability, galley priority and coordinated focus');
assert.match(ai, /for\(const candidate of hostileShips\)\{const score=navalTargetScore\(candidate\);if\(score<enemyScore\)\{enemyScore=score;enemy=candidate\}\}/,
  'galleys must select a target using the shared naval scoring function');
assert.match(ai, /if\(enemy&&Math\.hypot\(enemy\.x-ship\.x,enemy\.y-ship\.y\)<28\)/,
  'galleys should engage nearby hostile ships before switching to a land objective');
assert.match(html, /counterPlans=isDock\?\(enemyShips\?\[\{threat:enemyShips,units:\['gal'\]\}\]:\[\]\)/,
  'AI docks must train a war galley in response to even one confirmed enemy combat ship');
console.log('naval-ai-priority: consolidated threat scan preserves targeting and counter-priorities');
