/* Deterministic simulation checkpoints across independent production VM instances.
 * Tests same-engine reproducibility, not cross-browser or physical Xbox timing.
 * Save/load equivalence is intentionally strict: no prerelease migration required. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const protocol=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');

function seededWorld(seed=123456){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+protocol+'\n'+`
  seedOv=${seed};msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=0;startRes=0;startArmy=0;start();
  globalThis.CHECKPOINT_TEST={
   hash:frame=>window.CK_SIM_SYNC.worldCheckpoint(S,frame).hash,
   advance:count=>{for(let i=0;i<count;i++)step(DT);return S.t;},
   save:()=>saveG(),
   load:()=>loadG(),
   rng:()=>S.r.state(),
   units:()=>S.us.length,
   resource:team=>({ ...S.res[team] })
  };
 `,sandbox,{filename:'seeded-world-continuation.js',timeout:15000});
 return sandbox.CHECKPOINT_TEST;
}

test('separate production simulations reproduce matching seeded state through multiple fixed ticks',()=>{
 const a=seededWorld(),b=seededWorld();
 for(const ticks of [0,1,9,30,60]){
  a.advance(ticks);b.advance(ticks);
  assert.equal(a.hash(ticks),b.hash(ticks),'seeded world diverged after '+ticks+' additional ticks');
  assert.equal(a.rng(),b.rng(),'RNG state diverged');
 }
 assert.ok(a.units()>0);
});

test('different map seeds do not silently collapse to the same state checksum',()=>{
 const a=seededWorld(123456),b=seededWorld(987654);
 assert.notEqual(a.hash(0),b.hash(0));
});

test('mid-match current-version save/load preserves the authoritative world checkpoint',()=>{
 const live=seededWorld(),reloaded=seededWorld();
 live.advance(50);reloaded.advance(50);
 const before=live.hash(50);
 assert.equal(reloaded.hash(50),before);
 assert.equal(reloaded.save(),true,'current match must save successfully');
 assert.equal(reloaded.load(),true,'current-build save must restore successfully');
 assert.equal(reloaded.hash(50),before,'load must preserve active gameplay state, not just unit count');
 for(const ticks of [1,12,37]){
  live.advance(ticks);reloaded.advance(ticks);
  assert.equal(reloaded.hash(50+ticks),live.hash(50+ticks),
   'save/load diverged after '+ticks+' resumed simulation ticks');
 }
});
