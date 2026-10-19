import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const start=simulation.indexOf('function townBell(t){');
const end=simulation.indexOf('\nfunction gm(',start);
assert.ok(start>=0&&end>start,'Town Bell must retain its own assignment routine');
const townBellSource=simulation.slice(start,end);
function setup(capacity=2){
 const tc={k:'tc',t:0,done:true,hp:600,x:10,y:10,s:3,cg:[]};
 const S={us:[],bs:[tc]};
 const townBell=vm.runInNewContext(townBellSource+'\n;townBell;',{S,GAR:{tc:capacity},note:()=>{}});
 const villager=()=>({t:0,k:'vil',hp:30,x:8,y:8,o:'i',p:[],tg:null});
 return {tc,S,townBell,villager};
}

test('duplicate and stale garrison records cannot hide available capacity',()=>{
 const h=setup(2),resident={t:0,k:'mil',hp:40,ld:h.tc},worker=h.villager();
 const foreign={t:1,k:'mil',hp:40,ld:h.tc};
 const missing={t:0,k:'mil',hp:40,ld:h.tc};
 h.S.us.push(resident,foreign,worker);
 h.tc.cg=[resident,resident,foreign,missing,{t:0,k:'mil',hp:0,ld:h.tc}];
 assert.equal(h.townBell(0),1,'one genuine living resident should leave room for one villager');
 assert.equal(worker.tg,h.tc);
 assert.equal(worker.o,'B');
});

test('en-route reservations are counted once and cannot overfill a shelter',()=>{
 const h=setup(2),resident={t:0,k:'mil',hp:40,ld:h.tc},reserved=h.villager(),another=h.villager();
 reserved.o='B';reserved.tg=h.tc;
 h.tc.cg=[resident];h.S.us.push(resident,reserved,another);
 assert.equal(h.townBell(0),1,'existing reservation can be kept but another worker cannot overfill shelter');
 assert.equal(reserved.tg,h.tc);
 assert.notEqual(another.o,'B');
});

test('new assignments reserve available slots immediately within the same command',()=>{
 const h=setup(1),one=h.villager(),two=h.villager();
 h.S.us.push(one,two);
 assert.equal(h.townBell(0),1);
 assert.equal(one.o,'B');assert.notEqual(two.o,'B');
});

test('dead, unfinished and enemy shelters are ineligible',()=>{
 const h=setup(2),worker=h.villager();h.S.us.push(worker);
 h.tc.done=false;assert.equal(h.townBell(0),0);
 h.tc.done=true;h.tc.hp=0;assert.equal(h.townBell(0),0);
 h.tc.hp=300;h.tc.t=1;assert.equal(h.townBell(0),0);
});
