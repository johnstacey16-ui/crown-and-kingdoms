import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /function siteMenu\(wx,wy\)\{[\s\S]{0,650}const selected=S\.sel\.filter\(u=>u\.t===0&&u\.k==='vil'&&u\.hp>0&&!u\.ld\)/,
  'Resource site menus must identify the selected living, ungarrisoned player villagers');
assert.match(html, /mk\(selected\.length\?'Send selected villagers to gather \('\+selected\.length\+'\)' :'Send Villager to gather'/,
  'The resource menu must label group gather orders distinctly from single-villager orders');
assert.match(html, /if\(selected\.length\)give\(selected,\(\)=>orderSel\(t,wx,wy\)\);else\{const v=nearV\(wx,wy\)/,
  'A resource-menu confirmation must order every selected villager to the exact hovered node and preserve the single-villager fallback');
assert.match(html, /function openRadial\(wx,wy\)\{aDown=null;boxR=null;const target=pick\(wx,wy\),hasVillagers=S\.sel\.some\(u=>u\.t===0&&u\.k==='vil'&&u\.hp>0&&!u\.ld\);if\(target&&target\.amt>0&&!target\.fi&&hasVillagers\)\{menu=siteMenu\(wx,wy\);menu\.rad=1;menu\.pg=0\}/,
  'Opening the controller radial menu over a land resource with selected villagers must show the contextual resource site menu');
assert.match(html, /function orderSel\(tg,wx,wy\)\{[\s\S]{0,650}u\.autoWorker=0;[\s\S]{0,900}u\.ct=tg\.k/,
  'Direct site gathering must remain an explicit manual order and override auto-worker reassignment');
assert.match(html, /else if\(t&&t\.amt>0\)\{const selected=S\.sel\.filter[\s\S]{0,800}mk\('Build '\+B\[dk\]\.n\+' here'/,
  'Contextual gather assignment must preserve the existing resource-side building shortcut');
console.log('villager-site-assignment: all 6 source regression assertions passed');
