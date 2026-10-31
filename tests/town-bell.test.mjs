import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const start=simulation.indexOf('function townBell(t){');
const end=simulation.indexOf('\nfunction gm(',start);
assert.ok(start>=0&&end>start,'Town Bell simulation helper must be available');
const source=simulation.slice(start,end);

function fixture(cap=2,{single=false}={}){
 const a={t:0,k:'tc',x:6,y:6,s:3,hp:500,done:true,cg:[]};
 const b={t:0,k:'castle',x:26,y:26,s:4,hp:1200,done:true,cg:[]};
 const S={us:[],bs:single?[a]:[a,b]};
 const messages=[];
 const context={S,GAR:{tc:cap,castle:cap},note:m=>messages.push(m)};
 const bell=vm.runInNewContext(source+'\n;townBell;',context);
 const villager=(x,y)=>({t:0,k:'vil',hp:30,x,y,o:'i',p:[],tg:null});
 return {S,a,b,bell,villager,messages};
}

test('Town Bell sends player villagers to the nearest completed shelter and reserves a slot',()=>{
 const h=fixture(),near=h.villager(4,5),far=h.villager(25,24);
 h.S.us.push(near,far);
 assert.equal(h.bell(0),2);
 assert.equal(near.o,'B');assert.equal(near.tg,h.a);
 assert.equal(far.o,'B');assert.equal(far.tg,h.b);
 assert.equal(near.p.length,0);assert.equal(far.p.length,0);
 assert.match(h.messages.at(-1),/2 villagers sent to shelter/);
});

test('Town Bell does not send dead, enemy or already garrisoned villagers',()=>{
 const h=fixture(),live=h.villager(5,5),dead={...h.villager(7,7),hp:0},
 enemy={...h.villager(7,7),t:1},loaded={...h.villager(7,7),ld:h.a};
 h.S.us.push(live,dead,enemy,loaded);
 assert.equal(h.bell(0),1);
 assert.equal(live.o,'B');
 assert.notEqual(dead.o,'B');assert.notEqual(enemy.o,'B');assert.notEqual(loaded.o,'B');
});

test('Town Bell remains available through Town Centre controller interactions',()=>{
 assert.match(input,/if\(s\.k==='tc'\)\{it\.push\(\{l:'Town Bell: Garrison villagers'/);
});

// The capacity edge cases now reuse the canonical Town Bell simulation fixture.
function setup(capacity=2){
 const h=fixture(capacity,{single:true});
 return {tc:h.a,S:h.S,townBell:h.bell,villager:()=>h.villager(8,8)};
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
