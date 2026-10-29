import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function game(){const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source+'\n'+read('js/network-commands.js')+'\n'+read('js/network-unit-map.js')+'\nglobalThis.run=code=>eval(code);',sandbox);sandbox.run('seedOv=123;msz=0;kingdoms=2;startAge=0;start();');return sandbox.run}
test('hidden houses retain observed age; unknown houses and malformed ages do not read hidden advances',()=>{
 const run=game();run("globalThis.b={k:'house',t:1,x:20,y:20,s:2};S.vs.fill(0);S.age[1]=1;");
 assert.equal(run('buildingVisualAge(b)'),undefined);run('S.vs[21*W+21]=1');assert.equal(run('buildingVisualAge(b)'),1);
 run('S.vs.fill(0);S.age[1]=3');assert.equal(run('buildingVisualAge(b)'),1);
 run('S.vs[20*W+20]=1');assert.equal(run('buildingVisualAge(b)'),3);
 run('S.age[1]=NaN');assert.equal(run('buildingVisualAge(b)'),3);
 run('b.t=0;S.age[0]=2;S.vs.fill(0)');assert.equal(run('buildingVisualAge(b)'),2);
});
test('team-relative age appearance is copied only for owned or currently visible houses',()=>{
 const run=game();run("globalThis.house=addB(1,'house',60,60,true);S.age[1]=3;globalThis.before=JSON.stringify(house);globalThis.v=CK_UNIT_MAP.project(S,0,W,H);");
 assert.equal(run('v.battlefield.enemies.some(e=>e.id===house.netId)'),false);
 assert.equal(run('CK_UNIT_MAP.project(S,1,W,H).buildings.find(e=>e.id===house.netId).architectureAge'),3);
 run("addU(0,'vil',59,59);v=CK_UNIT_MAP.project(S,0,W,H)");assert.equal(run('v.battlefield.enemies.find(e=>e.id===house.netId).architectureAge'),3);
 assert.equal(run('JSON.stringify(house)===before'),true);
});
test('all four house ages resolve every team/state and missing new art retains the original house',()=>{
 const run=game(),pack=JSON.parse(read('assets/atlas-manifest.json')),atlas=pack.atlases.find(a=>a.meta.houseAges);
 assert.ok(atlas);for(let age=0;age<4;age++)for(let team=0;team<4;team++)for(const state of ['idle','walk','attack','work'])assert.equal(atlas.meta.anims['bld_house_age_'+age+'/'+state+'/'+team].frames.length,1);
 run("globalThis.calls=[];globalThis.missing=false;globalThis.assetFrame=(key)=>{calls.push(key);return missing&&key.startsWith('bld_house_age_')?null:{key}};");
 assert.equal(run("paintedBuildingFrame('house',2,0,3).key"),'bld_house_age_3');run('missing=true');assert.equal(run("paintedBuildingFrame('house',2,0,3).key"),'bld_house');
 assert.equal(run("paintedBuildingFrame('house',0,0,undefined).key"),'bld_house');assert.equal(run("paintedBuildingFrame('castle',0,0,3).key"),'bld_castle');
});
