import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const queued=vm.runInNewContext(ai+'\n;aiQueuedUnits;');

test('naval production counts queued objects without reading malformed queues',()=>{
 const dock={k:'dock',hp:250,q:[{k:'gal',t:10},{k:'gal',t:5},{k:'fish',t:3}]};
 assert.equal(queued([dock], 'gal'),2);
 assert.equal(queued([dock], 'fish'),1);
 assert.equal(queued([dock], 'cog'),0);
 assert.equal(queued([dock,{k:'dock',hp:250,q:null},{k:'dock',hp:250,q:{length:1}},null], 'gal'),2);
 assert.equal(queued([{k:'dock',hp:0,q:[{k:'gal'}]},dock], 'gal'),2);
 assert.equal(queued([dock], 'gal'),2,'calling the counter never mutates production queues');
});

test('all AI unit-cap checks consume the shared queue policy',()=>{
 assert.match(ai,/const queuedUnits=k=>aiQueuedUnits\(bl,k\)/);
 for(const kind of ['gal','fish','scout','cart','cog']){
   assert.ok(ai.includes("queuedUnits('"+kind+"')"), 'unit cap checks queued '+kind+' records');
 }
});
