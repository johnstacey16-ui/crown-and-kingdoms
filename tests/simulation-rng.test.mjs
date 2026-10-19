import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const state = readFileSync(new URL('../js/state.js', import.meta.url),'utf8');
const line = state.split('\n').find(line=>line.startsWith('const mk='));
const mk = vm.runInNewContext(line+';mk');

test('random stream preserves the existing algorithm and resumes across signed wraparound',()=>{
 const legacy = seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 for(const seed of [0,1,123456,0x7fffffff,0xffffffff]){
  const a=mk(seed),b=legacy(seed);
  for(let i=0;i<100;i++)assert.equal(a(),b());
  const restored=mk(a.state());
  for(let i=0;i<100;i++)assert.equal(restored(),a());
 }
});

test('unit path retry timers use simulation randomness, not ambient randomness',()=>{
 const entities=readFileSync(new URL('../js/entities.js',import.meta.url),'utf8');
 const build=()=>{
  const S={us:[],tech:[{}],r:mk(42)};
  const MathWithoutRandom=Object.create(Math);
  MathWithoutRandom.random=()=>{throw Error('ambient RNG used by unit creation')};
  const add=vm.runInNewContext(entities+';addU',{S,U:{mil:{hp:50}},Math:MathWithoutRandom});
  return Array.from({length:20},()=>add(0,'mil',1.5,2.5).rp);
 };
 assert.deepEqual(build(),build());
 assert.ok(new Set(build()).size>1);
});
