import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const source=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const functions=['farmAvailableTo','resourceApproachCapacity','resourceClaimCount',
 'resourceHasWorksite','knownResource','findNode','dropoffKey','dropoffCompatible',
 'skipDropoff','findDropoffRoute','deployFishTrap','killNode'];

test('resource and dropoff helper declarations have one canonical owner',()=>{
 for(const fn of functions){
  assert.match(source,new RegExp('function '+fn+'\\('),'module owns '+fn);
  assert.doesNotMatch(sim,new RegExp('function '+fn+'\\('),'core simulation must not duplicate '+fn);
 }
 assert.match(sim,/resourceHasWorksite\(/);
 assert.match(sim,/findDropoffRoute\(/);
 assert.match(input,/deployFishTrap\(/,'Fishing Ship menu must still call fish trap helper');
 assert.match(sim,/killNode\(/);
 assert.doesNotThrow(()=>new vm.Script(source,{filename:'js/simulation-resource-routing.js'}));
});

test('offline, browser, core and headless loading retain exact resource ordering',()=>{
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 const headless=coreGameScriptPaths(html,{includeUI:false,includeAssets:false});
 for(const paths of [browser,core,headless]){
  const i=paths.indexOf('./js/simulation-resource-routing.js');
  assert.ok(i>0&&i===paths.indexOf('./js/simulation-production-queues.js')-1);
  assert.equal(paths[i-1],'./js/simulation-logistics.js');
  assert.equal(paths.indexOf('./js/simulation-production-queues.js')+1,paths.indexOf('./js/simulation-research.js'));
  assert.equal(paths.indexOf('./js/simulation-research.js')+1,paths.indexOf('./js/simulation-building-production.js'));
  assert.equal(paths.indexOf('./js/simulation-building-production.js')+1,paths.indexOf('./js/simulation-building-updates.js'));
  assert.equal(paths.indexOf('./js/simulation-building-updates.js')+1,paths.indexOf('./js/simulation.js'));
  assert.equal(paths.filter(p=>p==='./js/simulation-resource-routing.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-resource-routing.js'"));
});

test('resource helper rejects invalid workers and depleted deposits safely',()=>{
 const create=vm.runInNewContext(source+'\n;({resourceHasWorksite,findNode,killNode})',{
  S:{us:[],nodes:[],wt:new Uint8Array(16),g:new Uint8Array(16)},
  W:4,H:4,window:{}
 });
 assert.equal(create.resourceHasWorksite(null,null),false);
 assert.equal(create.findNode(null,'w'),null);
 assert.equal(create.killNode(null),false);
});
