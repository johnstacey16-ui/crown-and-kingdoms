import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sim=readFileSync(new URL('../js/simulation-logistics.js',import.meta.url),'utf8');
const begin=sim.indexOf('function unload(b){');
const finish=sim.indexOf('\nfunction townBell(',begin);
assert.ok(begin>=0&&finish>begin,'unload routine must remain independently executable');
const unloadSource=sim.slice(begin,finish);

function setup(){
 const S={tech:[{}],us:[],g:new Uint8Array(40*40),wt:new Uint8Array(40*40),nd:new Array(40*40)};
 const messages=[],context={S,W:40,H:40,U:{mil:{sh:false}},B:{tc:{}},GAR:{tc:15},note:m=>messages.push(m)};
 const unload=vm.runInNewContext(unloadSource+'\n;unload;',context);
 const building={k:'tc',t:0,hp:500,done:true,x:15,y:15,s:3,cg:[]};
 return {S,unload,building,messages};
}

test('unload rejects destroyed, unbuilt, wrong-type and empty garrisons',()=>{
 const h=setup(),b=h.building;
 assert.equal(h.unload(null),false);
 assert.equal(h.unload(b),false);
 assert.equal(h.unload({...b,hp:0}),false);
 assert.equal(h.unload({...b,done:false}),false);
 assert.equal(h.unload({...b,t:10}),false);
 assert.equal(h.unload({...b,k:'house',cg:[{hp:50,k:'mil',t:0,ld:b}]}),false);
 assert.ok(h.messages.some(m=>/garrison|passenger/.test(m)));
});

test('unload releases only living same-owner passengers who truly occupy a valid garrison',()=>{
 const h=setup(),b=h.building;
 const soldier={k:'mil',hp:30,t:0,ld:b,x:16,y:16,p:[],o:'i'};
 const dead={k:'mil',hp:0,t:0,ld:b};
 const foreign={k:'mil',hp:20,t:1,ld:b};
 b.cg=[soldier,dead,foreign];
 h.S.us.push(soldier,dead,foreign);
 assert.equal(h.unload(b),true);
 assert.equal(soldier.ld,null);
 assert.equal(soldier.o,'i');
 assert.ok(Number.isFinite(soldier.x)&&Number.isFinite(soldier.y));
 assert.equal(b.cg.length,0,'stale dead and foreign passenger references are removed');
 assert.match(h.messages.at(-1),/Garrison unloaded/);
});

test('occupied or blocked surrounding tiles retain living passengers safely',()=>{
 const h=setup(),b=h.building;
 const soldier={k:'mil',hp:25,t:0,ld:b,x:16,y:16,p:[],o:'i'};
 b.cg=[soldier];h.S.us.push(soldier);
 h.S.g.fill(1);
 assert.equal(h.unload(b),false,'no passable ground exists for unloading');
 assert.equal(soldier.ld,b,'no passenger is lost during failed unload');
 assert.equal(b.cg.length,1);
 assert.match(h.messages.at(-1),/No clear space/);
});
