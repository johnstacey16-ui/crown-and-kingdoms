import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /'King of the Hill','Sudden Death'\]\[vm\]/,
  'Sudden Death must be a selectable seventh victory mode');
assert.match(html, /l:\(\)=>\{vm=\(vm\+6\)%7\},r:\(\)=>\{vm=\(vm\+1\)%7\}/,
  'The controller victory selector must cycle across all seven modes');
assert.match(html, /vm=cl\(st\.vm\|0,0,6\)/,
  'Settings restoration must accept Sudden Death mode index 6');
assert.match(html, /vm=cl\(j\.vm\|0,0,6\)/,
  'Saved games must restore Sudden Death mode index 6');
assert.match(html, /else if\(vm===6\)tx\('SUDDEN DEATH · DEFEND YOUR TOWN CENTRE'/,
  'The HUD must clearly explain the Sudden Death condition');
assert.match(html, /if\(vm===6\)note\('Sudden Death: protect your starting Town Centre; losing it eliminates your kingdom and extra Town Centres are disabled'\)/,
  'The player must receive controller-friendly instructions at match start');

assert.match(html, /function tcEnds\(t\)\{return cmp\?\(t\.t===0\|\|!!CAMP\[cmp\.i\]\.tcw\):\(vm===0\|\|vm===6\)\}/,
  'Town Centre destruction must trigger the standard or Sudden Death rule without changing campaign rules');
assert.match(html, /function okPlace\(t,k,x,y\)\{if\(vm===6&&k==='tc'\)return false/,
  'No new Town Centre may be placed during Sudden Death');
assert.match(html, /if\(vm===6\)\{if\(!S\.bs\.some\(b=>b\.t===0&&b\.k==='tc'&&b\.hp>0\)\)\{endGame\('lose','Your Town Centre fell in Sudden Death'\);return\}/,
  'The player must lose if their starting Town Centre is destroyed');
assert.match(html, /if\(!S\.bs\.some\(b=>b\.k==='tc'&&isHostile\(0,b\.t\)&&b\.hp>0\)\)endGame\('win','All hostile Town Centres have fallen in Sudden Death'\)/,
  'The player wins once every hostile Town Centre has fallen');

assert.match(html, /else if\(vm===6\)\{if\(t\.t===0\)endGame\('lose','Your Town Centre fell in Sudden Death'\);else\{/,
  'Sudden Death must handle player and rival Town Centre losses separately');
assert.match(html, /for\(const b of S\.bs\)if\(b\.t===t\.t\)b\.hp=0/,
  'Destroying a rival Town Centre must eliminate that rival kingdom buildings');
assert.match(html, /for\(const u of S\.us\)if\(u\.t===t\.t\)u\.hp=0/,
  'Destroying a rival Town Centre must eliminate that rival kingdom units');
assert.match(html, /S\.pj=S\.pj\.filter\(p=>!p\.a\|\|p\.a\.t!==t\.t\)/,
  'Projectiles launched by an eliminated rival must be removed');
assert.match(html, /CIV\[S\.civ\[t\.t\]\]\.n\+' was eliminated — Town Centre destroyed'/,
  'Rival Town Centre loss must produce elimination feedback');
assert.match(html, /if\(vm===6\)\{if\(!S\.bs\.some\(b=>b\.t===0&&b\.k==='tc'&&b\.hp>0\)\)\{endGame\('lose'/,
  'Regular elimination checks must continue enforcing the Sudden Death player loss');
assert.match(html, /if\(!S\.bs\.some\(b=>b\.k==='tc'&&isHostile\(0,b\.t\)&&b\.hp>0\)\)endGame\('win','All hostile Town Centres have fallen in Sudden Death'\)/,
  'Regular elimination checks must award victory when all hostile starting Town Centres are gone');

console.log('sudden-death: all 17 source regression assertions passed');
