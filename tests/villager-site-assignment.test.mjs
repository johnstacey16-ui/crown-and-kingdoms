import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const contains = (needle, message) => assert.ok(html.includes(needle), message);

contains("function siteMenu(wx,wy){",
  'The controller needs its existing site command menu');
contains("const selected=S.sel.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);",
  'Resource site menus must identify selected living, ungarrisoned player villagers');
contains("mk(selected.length?'Send selected villagers to gather ('+selected.length+')':'Send Villager to gather'",
  'The resource menu must label group gather orders distinctly from single-villager orders');
contains("if(selected.length)give(selected,()=>orderSel(t,wx,wy));else{const v=nearV(wx,wy);",
  'Confirmation must order every selected villager to the exact hovered node and preserve the single-villager fallback');
contains("function openRadial(wx,wy){aDown=null;boxR=null;const target=pick(wx,wy),hasVillagers=S.sel.some(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);if(target&&target.amt>0&&!target.fi&&hasVillagers){menu=siteMenu(wx,wy);menu.rad=1;menu.pg=0}",
  'Opening the controller radial menu over a land resource with selected villagers must show the contextual resource site menu');
const orderStart = html.indexOf('function orderSel(tg,wx,wy)');
const orderEnd = html.indexOf('function openMenu()', orderStart);
assert.ok(orderStart >= 0 && orderEnd > orderStart, 'The central explicit order function must remain present');
const order = html.slice(orderStart, orderEnd);
assert.ok(order.includes('u.autoWorker=0;') && order.includes("u.ct=tg.k"),
  'Direct site gathering must override automation and retain the selected resource type');
contains("const dk=t.k==='w'?'lumber':(t.k==='g'||t.k==='s')?'mine':'mill';mk('Build '+B[dk].n+' here'",
  'Contextual gather assignment must preserve the existing resource-side building shortcut');

console.log('villager-site-assignment: all 7 source regression assertions passed');
