import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function game(){const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source+'\n'+read('js/network-commands.js')+'\n'+read('js/network-unit-map.js')+'\nglobalThis.run=code=>eval(code);',sandbox);sandbox.run('seedOv=123;msz=0;kingdoms=2;startAge=0;start();');return sandbox.run}

test('all buildings retain only their last observed age in solo and team-relative views',()=>{
 const run=game();run("globalThis.b={k:'mill',t:1,x:20,y:20,s:2};S.vs.fill(0);S.age[1]=1;");
 assert.equal(run('buildingVisualAge(b)'),undefined);run('S.vs[21*W+21]=1');assert.equal(run('buildingVisualAge(b)'),1);
 run('S.vs.fill(0);S.age[1]=3');assert.equal(run('buildingVisualAge(b)'),1);run('S.vs[20*W+20]=1');assert.equal(run('buildingVisualAge(b)'),3);
 run("globalThis.mill=addB(1,'mill',60,60,true);S.age[1]=2;globalThis.v=CK_UNIT_MAP.project(S,0,W,H)");
 assert.equal(run('v.battlefield.enemies.some(e=>e.id===mill.netId)'),false);
 assert.equal(run('CK_UNIT_MAP.project(S,1,W,H).buildings.find(e=>e.id===mill.netId).architectureAge'),2);
 run("addU(0,'vil',59,59);v=CK_UNIT_MAP.project(S,0,W,H)");assert.equal(run('v.battlefield.enemies.find(e=>e.id===mill.netId).architectureAge'),2);
});

test('base building frames carry age detail metadata while dedicated age sheets do not',()=>{
 const run=game();run("globalThis.assetFrame=key=>({key,painted:true,img:{},f:{}})");
 const mill=run("paintedBuildingFrame('mill',2,0,3)"),house=run("paintedBuildingFrame('house',2,0,3)");
 assert.equal(mill.key,'bld_mill');assert.equal(mill.architectureAge,3);assert.equal(mill.architectureKind,'mill');assert.equal(mill.architectureTeam,2);assert.equal(mill.ageDetail,true);
 assert.equal(house.key,'bld_house_age_3');assert.equal(house.ageDetail,false);
 assert.equal(run("paintedBuildingFrame('mill',0,0,undefined).key"),'bld_mill');
});

test('four architectural detail stages are distinct and restore the canvas',()=>{
 const source=read('js/render.js'),sandbox={};vm.createContext(sandbox);
 vm.runInContext(source.slice(source.indexOf('function drawBuildingAgeDetails('),source.indexOf('// Shared original construction presentation.'))+';globalThis.draw=drawBuildingAgeDetails',sandbox);
 const signatures=[];
 for(let age=0;age<4;age++){
  const calls=[],g=new Proxy({},{get(_o,k){return (...args)=>calls.push([k,...args])},set(_o,k,v){calls.push(['set',k,v]);return true}});
  sandbox.draw(g,{architectureAge:age,architectureKind:'mill',architectureTeam:2,ageDetail:true},10,20,180,150);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);assert.equal(calls.filter(c=>c[0]==='restore').length,1);signatures.push(JSON.stringify(calls.map(c=>c[0])));
 }
 assert.equal(new Set(signatures).size,4);
 const calls=[],g=new Proxy({},{get(_o,k){return (...args)=>calls.push([k,...args])}});sandbox.draw(g,{architectureAge:3,ageDetail:false},0,0,100,100);assert.deepEqual(calls,[]);
});
