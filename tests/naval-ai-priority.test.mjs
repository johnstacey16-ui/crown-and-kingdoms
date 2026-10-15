import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = ['config','state','mapgen','audio','save','input','render','simulation','ai'].map(name => readFileSync(new URL('../js/'+name+'.js', import.meta.url), 'utf8')).join('\n') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI war galleys favour hostile warships and coordinate focus fire', () => {
  assert.match(html, /const hostileShips=S\.us\.filter\(u=>isHostile\(t,u\.t\)&&u\.hp>0&&U\[u\.k\]\.sh&&u\.k!=='fish'\)/,
    'naval target candidates must be living hostile ships, not allied ships or fishing boats');
  assert.match(html, /focusCounts=new Map\(\);for\(const u of galleys\)if\(u\.o==='a'&&u\.tg\)focusCounts\.set\(u\.tg,\(focusCounts\.get\(u\.tg\)\|\|0\)\+1\)/,
    'AI must track focus fire across its galley fleet');
  assert.match(html, /navalTargetScore=e=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)-\(e\.k==='gal'\?6:0\)\+\(U\[e\.k\]\.dmg>=4\?0:10\)-Math\.min\(3,focusCounts\.get\(e\)\|\|0\)\*4/,
    'naval target scoring must combine distance, combat capability, galley priority and coordinated focus');
  assert.match(html, /for\(const candidate of hostileShips\)\{const score=navalTargetScore\(candidate\);if\(score<enemyScore\)\{enemyScore=score;enemy=candidate\}\}/,
    'galleys must select a target using the shared naval scoring function');
  assert.match(html, /if\(enemy&&Math\.hypot\(enemy\.x-ship\.x,enemy\.y-ship\.y\)<28\)/,
    'galleys should engage nearby hostile ships before switching to a land objective');
});
