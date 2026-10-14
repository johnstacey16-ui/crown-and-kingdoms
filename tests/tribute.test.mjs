import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /const TRIBUTE_RESOURCES=\[\{k:'f',n:'Food'\},\{k:'w',n:'Wood'\},\{k:'g',n:'Gold'\},\{k:'s',n:'Stone'\}\]/,
  'Tribute must support food, wood, gold and stone');
assert.match(html, /const TRIBUTE_AMOUNTS=\[100,250,500,1000\]/,
  'Tribute amounts must be selectable in 100, 250, 500 and 1,000-unit steps');
assert.match(html, /let tributeResource=0,tributeAmount=0;/,
  'Resource and amount selectors must have independent selection state');
assert.match(html, /function sendTribute\(from,to,resourceIndex,amount=100\)\{/,
  'Tribute transfers must keep a safe default and validate each amount');
assert.match(html, /if\(diplomacyRelation\(from,to\)!=='ally'\)\{if\(from===0\)note\('Tribute requires an alliance'\);return false\}/,
  'Resource tribute must be restricted to ally relationships');
assert.match(html, /if\(!S\.res\[from\]\|\|!S\.res\[to\]\|\|S\.res\[from\]\[resource\.k\]<amount\)/,
  'Tribute must reject unaffordable transfers before changing either kingdom');
assert.match(html, /S\.res\[from\]\[resource\.k\]-=amount;S\.res\[to\]\[resource\.k\]\+=amount/,
  'A successful tribute must subtract and add exactly the same resource amount');
assert.match(html, /for\(let t=1;t<S\.teamN;t\+\+\)if\(diplomacyRelation\(0,t\)==='ally'&&S\.bs\.some\(b=>b\.t===t&&b\.k==='tc'&&b\.hp>0\)\)allies\.push\(t\)/,
  'Only allied kingdoms with a surviving Town Centre should receive tribute menu entries');
assert.match(html, /if\(!allies\.length\)return \[\]/,
  'Tribute selectors should not appear when no eligible ally exists');
assert.match(html, /n:'Tribute resource',v:\(\)=>TRIBUTE_RESOURCES\[tributeResource\]\.n,l:\(\)=>\{tributeResource=/,
  'The controller must expose a resource selector');
assert.match(html, /n:'Tribute amount',v:\(\)=>TRIBUTE_AMOUNTS\[tributeAmount\],l:\(\)=>\{tributeAmount=/,
  'The controller must expose an amount selector');
assert.match(html, /a:\(\)=>sendTribute\(0,t,tributeResource,TRIBUTE_AMOUNTS\[tributeAmount\]\)/,
  'The send action must use the currently selected resource and amount');
assert.match(html, /\.\.\.diplomacyMenuItems\(\),\.\.\.tributeMenuItems\(\)/,
  'Tribute entries must remain integrated into the existing pause-menu controller interface');

console.log('tribute: all 13 source regression assertions passed');
