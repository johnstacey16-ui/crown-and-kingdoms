import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai = readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const aiQueuedUnits = vm.runInNewContext(ai+'\n;aiQueuedUnits;');
const bl = [
  { k: 'dock', hp: 600, q: [{ k: 'gal', t: 5 }, { k: 'fish', t: 7 }] },
  { k: 'dock', hp: 600, q: [{ k: 'gal', t: 2 }, { k: 'gal', t: 3 }] },
  { k: 'stable', hp: 200, q: [{ k: 'scout', t: 4 }] },
  { k: 'market', hp: 400, q: [{ k: 'cart', t: 2 }] },
  { k: 'dock', hp: 0, q: [{ k: 'gal', t: 2 }, { k: 'cog', t: 1 }] },
  { k: 'dock', hp: 600 },
];
const queuedUnits = k => aiQueuedUnits(bl,k);
assert.equal(queuedUnits('gal'), 3, 'count all active war galley queues');
assert.equal(queuedUnits('fish'), 1, 'count fishing boats');
assert.equal(queuedUnits('scout'), 1, 'count scouts');
assert.equal(queuedUnits('cart'), 1, 'count trade carts');
assert.equal(queuedUnits('cog'), 0, 'ignore destroyed dock queues');
assert.equal(queuedUnits('mil'), 0, 'unknown unit type has zero queue count');
bl[0].q.push({ k: 'cog', t: 2 });
assert.equal(queuedUnits('cog'), 1, 'queue changes are reflected immediately');
test('AI production queues are object records and skirmish upgrade durations remain intact',()=>{
 const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
 assert.match(sim,/b\.q\.push\(\{k,t:/,'training queues store objects with a unit key and duration');
 assert.match(sim,/k==='skirm'&&S\.tech\[t\]\?\.elsk\?22:d\.t/,'Elite Skirmisher retains its upgraded training time');
});
test('AI unit caps use shared queued-unit counter for naval and land orders',()=>{
 assert.match(ai,/const queuedUnits=k=>aiQueuedUnits\(bl,k\)/);
 for(const kind of ['gal','fish','scout','cart','cog'])
  assert.ok(ai.includes("queuedUnits('"+kind+"')"),'unit cap checks '+kind);
 assert.ok(!ai.includes("q=>q==='gal'"),'AI must not compare queue records directly to strings');
 const d=[
  {k:'dock',hp:100,q:[{k:'gal',t:10},{k:'fish',t:4}]},
  {k:'dock',hp:100,q:[{k:'gal',t:5},{k:'gal',t:8}]},
  {k:'dock',hp:0,q:[{k:'gal',t:2}]}
 ];
 assert.equal(aiQueuedUnits(d,'gal'),3,'only live buildings contribute queued war galleys');
});
test('malformed queues, destroyed buildings and repeated reads are safely ignored',()=>{
 const dock={k:'dock',hp:250,q:[{k:'gal',t:10},{k:'gal',t:5},{k:'fish',t:3}]};
 assert.equal(aiQueuedUnits([dock],'gal'),2);
 assert.equal(aiQueuedUnits([dock],'fish'),1);
 assert.equal(aiQueuedUnits([dock],'cog'),0);
 assert.equal(aiQueuedUnits([dock,{k:'dock',hp:250,q:null},{k:'dock',hp:250,q:{length:1}},null],'gal'),2);
 assert.equal(aiQueuedUnits([{k:'dock',hp:0,q:[{k:'gal'}]},dock],'gal'),2);
 assert.equal(aiQueuedUnits([dock],'gal'),2,'calling the counter never mutates production queues');
});
console.log('ai-queued-unit-limits: consolidated queue contracts passed');
