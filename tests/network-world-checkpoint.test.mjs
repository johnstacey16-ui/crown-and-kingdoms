import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const syncSource = readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
const {source,sandbox}=headlessGame();
const harness=[
  "globalThis.__WORLD_NET_TEST__ = () => {",
  " seedOv=123456; msz=0; kingdoms=2; cmp=null; gameMode=0; startAge=0; startRes=0; startArmy=0; start();",
  " const sync=window.CK_SIM_SYNC;",
  " const first=sync.worldCheckpoint(S,50);",
  " start();",
  " const same=sync.worldCheckpoint(S,50);",
  " S.sel=[S.us[0]];",
  " const cosmetic=sync.worldCheckpoint(S,50);",
  " S.res[1].f+=1.75;",
  " const differentEconomy=sync.worldCheckpoint(S,50);",
  " S.res[1].f-=1.75;",
  " const tc=S.bs.find(b=>b.t===1&&b.k==='tc'&&b.done);",
  " const trained=train(tc,'vil');",
  " const afterTraining=sync.worldCheckpoint(S,50);",
  " const mismatchFrame=sync.worldCheckpoint(S,51);",
  " S.us[0].x+=0.5;",
  " const moved=sync.worldCheckpoint(S,50);",
  " const badFrame=(()=>{try{sync.worldCheckpoint(S,-1);return false}catch(e){return true}})();",
  " return {first,same,cosmetic,differentEconomy,trained,afterTraining,mismatchFrame,moved,badFrame};",
  "};"
].join('\n');
vm.runInNewContext(source+'\n'+syncSource+'\n'+harness,sandbox,{filename:'headless-checkpoint-projection.js'});
const result=sandbox.__WORLD_NET_TEST__();
const sync=sandbox.CK_SIM_SYNC;

test('fresh seeded world generates the same full gameplay checksum',()=>{
 assert.equal(result.first.frame,50);
 assert.equal(result.first.hash,result.same.hash);
 assert.equal(sync.compareCheckpoint(result.first,result.same),'match');
 assert.match(result.first.hash,/^fnv1a32-[0-9a-f]{8}-[0-9a-f]+$/);
});

test('local camera/selection-only state is excluded from gameplay checksum',()=>{
 assert.equal(result.same.hash,result.cosmetic.hash);
});

test('economy, paid production and individual unit position affect checksum',()=>{
 assert.notEqual(result.same.hash,result.differentEconomy.hash);
 assert.equal(result.trained,true);
 assert.notEqual(result.same.hash,result.afterTraining.hash);
 assert.notEqual(result.afterTraining.hash,result.moved.hash);
 assert.equal(sync.compareCheckpoint(result.same,result.differentEconomy),'desync');
});

test('matched-frame comparison cannot disguise a different frame as a desync',()=>{
 assert.equal(result.mismatchFrame.frame,51);
 assert.equal(result.afterTraining.hash,result.mismatchFrame.hash);
 assert.equal(sync.compareCheckpoint(result.afterTraining,result.mismatchFrame),'different-frame');
 assert.equal(result.badFrame,true);
});
