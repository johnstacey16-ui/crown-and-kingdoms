import assert from 'node:assert/strict';
import vm from 'node:vm';
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
const radialSource=html.slice(html.indexOf('function openRadial(wx,wy)'),html.indexOf('function playCtl(dt)'));
assert.ok(radialSource.startsWith('function openRadial'),'Controller radial handler must exist');
for(const eligible of [true,false]){
  let cancelled=0,siteCalls=0,normalCalls=0;
  const resource={amt:100,fi:0},worker={t:eligible?0:1,k:'vil',hp:25,ld:null};
  const context={S:{sel:[worker]},menu:null,pick:()=>resource,
    cancelGameplayGestures:()=>cancelled++,
    siteMenu:(x,y)=>{assert.equal(x,4);assert.equal(y,5);siteCalls++;return {items:[]};},
    openMenu:()=>{normalCalls++;context.menu={items:[]};}};
  vm.runInNewContext('('+radialSource+')',context)(4,5);
  assert.equal(cancelled,1,'Opening a radial must cancel pending gameplay input');
  assert.equal(siteCalls,eligible?1:0,'Only eligible selected villagers get the resource site menu');
  assert.equal(normalCalls,eligible?0:1);
  assert.equal(context.menu.rad,1);assert.equal(context.menu.pg,0);
}
const orderStart = html.indexOf('function orderSel(tg,wx,wy)');
const orderEnd = html.indexOf('function openMenu()', orderStart);
assert.ok(orderStart >= 0 && orderEnd > orderStart, 'The central explicit order function must remain present');
const order = html.slice(orderStart, orderEnd);
assert.ok(order.includes('u.autoWorker=0;') && order.includes("u.ct=node.k"),
  'Direct site gathering must override automation and retain the selected resource type');
contains("const dk=t.k==='w'?'lumber':(t.k==='g'||t.k==='s')?'mine':'mill';mk('Build '+B[dk].n+' here'",
  'Contextual gather assignment must preserve the existing resource-side building shortcut');

console.log('villager-site-assignment: source and controller routing checks passed');
