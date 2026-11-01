import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=get('index.html'),sw=get('sw.js'),sim=get('js/simulation.js'),unit=get('js/simulation-unit-behaviour.js');
test('one canonical unit-update owner follows the step orchestrator in every source graph',()=>{
 assert.match(unit,/function upU\(u,dt\)\{/);
 assert.doesNotMatch(sim,/function upU\(u,dt\)\{/);
 assert.match(sim,/for\(const u of S\.us\)upU\(u,dt\)/);
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const s=paths.indexOf('./js/simulation.js');
  assert.ok(s>=0);
  assert.equal(paths[s+1],'./js/simulation-unit-behaviour.js');
  assert.equal(paths[s+2],'./js/simulation-separation.js');
  assert.equal(paths.filter(p=>p==='./js/simulation-unit-behaviour.js').length,1);
 }
 assert.ok(sw.includes("'./js/simulation-unit-behaviour.js'"));
 assert.doesNotThrow(()=>new vm.Script(unit));
});
test('unit handler retains ordered transport, patrol, combat, gather and building branches',()=>{
 for(const key of ["if(u.o==='U')","if(u.o==='B')","if(u.o==='a')","if(u.o==='g')","if(u.o==='b')","if(u.o==='p')","if(u.o==='v')","if(u.o==='r')"])
  assert.ok(unit.includes(key),'missing existing unit order '+key);
});
test('isolated unit-update code advances cooldowns, finishes movement and cancels invalid unloads',()=>{
 const ctx={U:{vil:{sp:.8},trn:{sh:true}},S:{tech:[{}],us:[],bs:[],t:8,vp:{enabled:false}},walk:()=>true};
 vm.createContext(ctx);
 vm.runInContext(unit+'\n;globalThis.update=upU;',ctx);
 const villager={k:'vil',t:0,o:'i',cd:2,rp:3,wind:0};
 ctx.update(villager,.25);
 assert.equal(villager.cd,1.75);
 assert.equal(villager.rp,2.75);
 villager.o='m';ctx.update(villager,.25);
 assert.equal(villager.o,'i','successful travel returns to idle');
 const transport={k:'trn',t:0,o:'U',cd:0,rp:0,cg:[],ut:[-99,50],x:2,y:2};
 ctx.update(transport,.1);
 assert.equal(transport.o,'i','invalid or empty unload order is cancelled');
 assert.equal(transport.ut,null);
});
