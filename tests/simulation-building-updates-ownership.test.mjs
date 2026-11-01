import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const updates=readFileSync(new URL('../js/simulation-building-updates.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('building tick has one owner and retains the validated production dependencies',()=>{
 assert.match(updates,/function upB\(b,dt\)\{if\(!b\|\|!b\.done\|\|b\.hp<=0\|\|!Number\.isFinite\(dt\)\|\|dt<=0\)return;/);
 assert.doesNotMatch(simulation,/function upB\(/);
 for(const call of ['healGarrison(b,dt)','launchProjectile(o,e)','trainRate(b,q.k)','livePopulation(b.t)','spawnPos(b)','addU(b.t,q.k','S.tech[b.t]'])
  assert.ok(updates.includes(call),'building tick retains '+call);
 assert.ok(simulation.includes('upB(b,dt)'),'main simulation still ticks every building');
 assert.doesNotThrow(()=>new vm.Script(updates,{filename:'js/simulation-building-updates.js'}));
 const tick=vm.runInNewContext(updates+'\nupB');
 for(const b of [null,{done:false,hp:100},{done:true,hp:0}]){
  const before=JSON.stringify(b);
  assert.doesNotThrow(()=>tick(b,0.1));
  assert.equal(JSON.stringify(b),before,'invalid buildings must not progress');
 }
});

test('browser, headless and offline runtimes include one building tick before simulation',()=>{
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=paths.indexOf('./js/simulation-building-updates.js');
  assert.ok(i>0);
  assert.equal(paths[i-1],'./js/simulation-building-production.js');
  assert.equal(paths[i+1],'./js/simulation.js');
  assert.equal(paths.filter(p=>p==='./js/simulation-building-updates.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-building-updates.js'"));
});
