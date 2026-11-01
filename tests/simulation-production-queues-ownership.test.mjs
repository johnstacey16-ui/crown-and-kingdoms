import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const queues=readFileSync(new URL('../js/simulation-production-queues.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const buildingUpdates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const names=['queuedPopulation','train','cancelQ'];

test('production queue commands have one source owner and stay callable by the main simulation',()=>{
 for(const name of names){
  assert.ok(queues.includes('function '+name+'('),'production module must own '+name);
  assert.ok(!simulation.includes('function '+name+'('),'main simulation must not duplicate '+name);
 }
 assert.ok(buildingUpdates.includes('function upB('),'building completion remains in its dedicated module');
 assert.ok(queues.includes('popOf('),'training must still reserve population through the canonical cap check');
 assert.ok(buildingUpdates.includes('livePopulation('),'building completion must still enforce live population');
 assert.doesNotThrow(()=>new vm.Script(queues,{filename:'js/simulation-production-queues.js'}));
 const fn=vm.runInNewContext(queues+'\n;({train,cancelQ})',{S:null});
 assert.equal(fn.train(null,'vil'),false,'invalid production must safely refuse');
 assert.equal(fn.cancelQ(null),false,'invalid cancellation must safely refuse');
});

test('training queue module loads once between resource routing and simulation online/offline/headless',()=>{
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 const headless=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 for(const scripts of [browser,core,headless]){
  const i=scripts.indexOf('./js/simulation-production-queues.js');
  assert.ok(i>=0,'production module included');
  assert.equal(scripts[i-1],'./js/simulation-resource-routing.js');
  assert.equal(scripts[i+1],'./js/simulation-research.js');
  assert.equal(scripts[i+2],'./js/simulation-building-production.js');
  assert.equal(scripts[i+3],'./js/simulation-building-updates.js');
  assert.equal(scripts[i+4],'./js/simulation.js');
  assert.equal(scripts.filter(s=>s==='./js/simulation-production-queues.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-production-queues.js'"));
});
