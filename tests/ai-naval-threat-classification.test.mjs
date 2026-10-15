import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
assert.match(ai, /underFire=S\.us\.some\(e=>e&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&e\.hp>0&&U\[e\.k\]\?\.sh&&Math\.hypot\(e\.x-target\.x,e\.y-target\.y\)<10\)/,
  'naval repair threat scans must skip null or malformed unit records before reading their fields');
assert.match(ai, /humanShips=S\.us\.filter\(u=>u&&Number\.isInteger\(u\.t\)&&isHostile\(t,u\.t\)&&u\.hp>0&&!u\.ld&&U\[u\.k\]\?\.sh&&u\.k!=='fish'&&u\.k!=='trn'&&u\.k!=='cog'&&U\[u\.k\]\.dmg>=4\)/,
  'AI naval threat assessment must ignore fishing ships, transports and trade cogs');
assert.match(ai, /if\(k==='navalHull'&&humanShips\.length\)score\+=95/);
assert.match(ai, /focusCounts=new Map\(\);for\(const u of galleys\)if\(u\.o==='a'&&u\.tg\)focusCounts\.set\(u\.tg,\(focusCounts\.get\(u\.tg\)\|\|0\)\+1\);for\(const ship of galleys\.filter\(u=>u\.o==='i'/,
  'naval focus-fire counts must be built once before ship target scoring');
assert.match(ai, /focusCounts\.set\(enemy,\(focusCounts\.get\(enemy\)\|\|0\)\+1\);continue/,
  'each ship assignment must update focus-fire counts for following ships');
assert.match(ai, /if\(k==='navalAtk'&&humanShips\.length\)score\+=105/,
  'AI must value naval attack research against any confirmed enemy combat-ship class');
assert.match(ai, /counterPlans=isDock\?\(enemyShips\?\[\{threat:enemyShips,units:\['gal'\]\}\]:\[\]\)/,
  'AI docks must train a war galley in response to even one confirmed enemy combat ship');
assert.match(ai, /\{threat:humanCav,minimum:2,units:\['halb','pike','spear','camel'\]/);
assert.match(ai, /\{threat:humanRanged,minimum:3,units:\['skirm','knight','cata'\]/);
assert.match(ai, /\{threat:humanSiege,minimum:1,units:\['knight','mil','scout'\]/);
assert.match(ai, /\{threat:humanInf,minimum:4,units:\['mang','scor','arc'\]/);
assert.match(ai, /score:p\.threat-my\.filter\(u=>p\.own\.includes\(u\.k\)\)\.length\*2/,
  'counter production must account for existing counters so mixed threats do not permanently starve other responses');

console.log('ai-naval-threats: economic and transport ships do not trigger combat counter-priorities');
