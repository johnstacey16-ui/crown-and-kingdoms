import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const logistics=readFileSync(new URL('../js/simulation-logistics.js',import.meta.url),'utf8');

test('transport and trader functionality is owned only by the new module',()=>{
 for(const fn of ['transportLandingRoute','tickTrader']){
  assert.match(logistics,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(simulation,new RegExp('function '+fn+'\\('));
  assert.match(simulation,new RegExp(fn+'\\('),'main simulation still calls the helper');
 }
 assert.doesNotThrow(()=>new vm.Script(logistics,{filename:'js/simulation-logistics.js'}));
 assert.doesNotThrow(()=>new vm.Script(simulation,{filename:'js/simulation.js'}));
});
test('logistics is ordered directly before simulation in browser, core and offline lists',()=>{
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 const headless=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 for(const list of [browser,core,headless]){
  assert.equal(list.indexOf('./js/simulation-logistics.js')+1,list.indexOf('./js/simulation-resource-routing.js'));
  assert.equal(list.indexOf('./js/simulation-resource-routing.js')+1,list.indexOf('./js/simulation-production-queues.js'));
  assert.equal(list.indexOf('./js/simulation-production-queues.js')+1,list.indexOf('./js/simulation-research.js'));
  assert.equal(list.indexOf('./js/simulation-research.js')+1,list.indexOf('./js/simulation.js'));
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
