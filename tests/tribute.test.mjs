import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /const TRIBUTE_RESOURCES=\[\{k:'f',n:'Food'\},\{k:'w',n:'Wood'\},\{k:'g',n:'Gold'\},\{k:'s',n:'Stone'\}\]/,
  'Tribute must support food, wood, gold and stone');
assert.match(html, /function sendTribute\(from,to,resourceIndex,amount=100\)\{/,
  'Tribute must use a bounded transfer function with a default 100-unit amount');
assert.match(html, /if\(diplomacyRelation\(from,to\)!=='ally'\)\{if\(from===0\)note\('Tribute requires an alliance'\);return false\}/,
  'Resource tribute must be restricted to ally relationships');
assert.match(html, /if\(!S\.res\[from\]\|\|!S\.res\[to\]\|\|S\.res\[from\]\[resource\.k\]<amount\)/,
  'Tribute must reject unaffordable transfers before changing either kingdom');
assert.match(html, /S\.res\[from\]\[resource\.k\]-=amount;S\.res\[to\]\[resource\.k\]\+=amount/,
  'A successful tribute must subtract and add exactly the same resource amount');
assert.match(html, /function tributeMenuItems\(\)\{[\s\S]{0,500}diplomacyRelation\(0,t\)==='ally'/,
  'Tribute menu entries should only appear for allied surviving kingdoms');
assert.match(html, /v:\(\)=>TRIBUTE_RESOURCES\[tributeResource\]\.n,l:\(\)=>\{tributeResource=/,
  'Controller left/right inputs must let the player choose a tribute resource');
assert.match(html, /a:\(\)=>sendTribute\(0,t,tributeResource,100\)/,
  'Confirming the tribute menu entry must transfer 100 of the selected resource');
assert.match(html, /\.\.\.diplomacyMenuItems\(\),\.\.\.tributeMenuItems\(\)/,
  'Tribute entries must be integrated into the existing pause-menu controller interface');

console.log('tribute: all 9 source regression assertions passed');
