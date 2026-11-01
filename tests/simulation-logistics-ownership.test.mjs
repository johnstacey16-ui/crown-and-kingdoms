import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const unit=readFileSync(new URL('../js/simulation-unit-behaviour.js',import.meta.url),'utf8');
const logistics=readFileSync(new URL('../js/simulation-logistics.js',import.meta.url),'utf8');

test('transport and trader functionality is owned only by the new module',()=>{
 for(const fn of ['transportLandingRoute','tickTrader']){
  assert.match(logistics,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(simulation,new RegExp('function '+fn+'\\('));
  assert.match(unit,new RegExp(fn+'\\('),'unit order simulation still calls the helper');
 }
 for(const name of ['healGarrison','unload','townBell']){
  assert.match(logistics,new RegExp('function '+name+'\\('),'garrison logistics owns '+name);
  assert.doesNotMatch(simulation,new RegExp('function '+name+'\\('),'main simulation no longer duplicates '+name);
 }
 const updates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
 assert.match(updates,/healGarrison\(/,'building updates still invoke garrison healing');
 assert.doesNotThrow(()=>new vm.Script(logistics,{filename:'js/simulation-logistics.js'}));
 assert.doesNotThrow(()=>new vm.Script(simulation,{filename:'js/simulation.js'}));
});
test('player controller unit orders have a single logistics owner',()=>{
 const names=['stopSel','regroup','orderGuardFollow','patrol','subg','setStance'];
 for(const name of names){
  const fn=new RegExp('function '+name+'\\(');
  assert.match(logistics,fn,'logistics must own '+name);
  assert.doesNotMatch(simulation,fn,'main simulation must not duplicate '+name);
 }
 const source=logistics.slice(logistics.indexOf('function stopSel(){'));
 const orders=vm.runInNewContext(source+'\n;({stopSel,patrol,setStance})',{
  S:{sel:[{k:'mil',hp:40,o:'a',t:0,p:[[5,5]],tg:{},guardTarget:{}}]},
  U:{mil:{n:'Militia'}},note:()=>{},menu:null
 });
 assert.equal(orders.patrol(12,12,false),true);
 assert.equal(orders.stopSel(),undefined);
 assert.equal(orders.setStance(4),undefined);
});

test('garrison healing is team-safe and Herbal Medicine accelerates only valid passengers',()=>{
 const S={us:[],tech:[{},{}]};
 const b={t:0,cg:[]},healthy={hp:5,t:0,ld:b};
 const foe={hp:5,t:1,ld:b},unloaded={hp:5,t:0,ld:null};
 const dead={hp:0,t:0,ld:b},ghost={hp:5,t:0,ld:b};
 S.us=[healthy,foe,unloaded,dead];b.cg=[healthy,foe,unloaded,dead,ghost];
 const ctx=vm.createContext({S,mhp:()=>10});
 vm.runInContext(logistics+'\n;globalThis.healGarrisonTest=healGarrison;',ctx);
 ctx.healGarrisonTest(b,2);
 assert.ok(Math.abs(healthy.hp-5.2)<1e-10,'ordinary garrison healing is 0.1 HP per second');
 for(const u of [foe,unloaded,ghost])assert.equal(u.hp,5,'foreign, unloaded or unregistered passengers do not heal');
 assert.equal(dead.hp,0,'dead units stay dead');
 S.tech[0].herbalMedicine=1;
 ctx.healGarrisonTest(b,2);
 assert.ok(Math.abs(healthy.hp-6.4)<1e-10,'Herbal Medicine heals at 0.6 HP per second');
 ctx.healGarrisonTest(b,20);
 assert.equal(healthy.hp,10,'healing never exceeds the current upgrade-aware maximum');
});

test('logistics is ordered directly before simulation in browser, core and offline lists',()=>{
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 const headless=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 for(const list of [browser,core,headless]){
  assert.equal(list.indexOf('./js/simulation-logistics.js')+1,list.indexOf('./js/simulation-resource-routing.js'));
  assert.equal(list.indexOf('./js/simulation-resource-routing.js')+1,list.indexOf('./js/simulation-production-queues.js'));
  assert.equal(list.indexOf('./js/simulation-production-queues.js')+1,list.indexOf('./js/simulation-research.js'));
  assert.equal(list.indexOf('./js/simulation-research.js')+1,list.indexOf('./js/simulation-building-production.js'));
  assert.equal(list.indexOf('./js/simulation-building-production.js')+1,list.indexOf('./js/simulation-building-updates.js'));
  assert.equal(list.indexOf('./js/simulation-building-updates.js')+1,list.indexOf('./js/simulation.js'));
 }
 assert.deepEqual(headless,core.filter(p=>p!=='./js/ui.js'&&p!=='./js/assets.js'));
 assert.ok(sw.includes("'./js/simulation-logistics.js'"));
});
test('unsafe transport requests and missing player trade depots retain safe behavior',()=>{
 const transport=vm.runInNewContext(logistics+'\ntransportLandingRoute',{S:null});
 assert.equal(transport({k:'trn',x:3,y:3},8,8),null);
 assert.equal(transport(null,8,8),null);
 const S={bs:[],us:[],teamN:1,res:[{g:100}]};
 const trade=vm.runInNewContext(logistics+'\ntickTrader',{S});
 const trader={k:'cart',t:0,x:5,y:5,tradeFromKey:null,tradeDestKey:'missing',
  tradeCargo:5,tradeReturning:true,o:'m',p:[[7,7]],rp:1};
 trade(trader,1/30);
 assert.equal(trader.tradePaused,true);
 assert.equal(trader.tradeDestKey,null);
 assert.equal(trader.tradeCargo,0);
 assert.equal(S.res[0].g,100);
});
