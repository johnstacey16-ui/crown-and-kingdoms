import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { headlessGame } from './helpers/headless-game.mjs';

const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
const {source,sandbox}=headlessGame();
vm.runInNewContext(source+'\n'+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+`
 globalThis.runtimeKinds={units:Object.keys(U),buildings:Object.keys(B)};
 globalThis.artFrame=assetFrame;globalThis.checkMeta=validAtlasMeta;
 globalThis.register=regAtlas;
`,sandbox);

test('every effective unit kind and every sprite-backed building resolves an atlas frame for all teams and states',()=>{
 for(const atlas of pack.atlases){
  const svg=readFileSync(new URL('../'+atlas.src,import.meta.url),'utf8');
  const dimensions=svg.match(/<svg\b[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);
  assert.ok(dimensions,atlas.id);
  assert.equal(sandbox.checkMeta(atlas.meta,+dimensions[1],+dimensions[2]),true,atlas.id);
  sandbox.register(atlas.id,{id:atlas.id},atlas.meta);
 }
 for(const kind of sandbox.runtimeKinds.units)for(let team=0;team<4;team++)for(let state=0;state<4;state++){
  assert.ok(sandbox.artFrame(kind,team,state,0,.21,Math.PI),'Missing unit '+kind+'/'+state+'/'+team);
 }
 for(const kind of sandbox.runtimeKinds.buildings.filter(k=>k!=='farm'))for(let team=0;team<4;team++){
  assert.ok(sandbox.artFrame('bld_'+kind,team,3,0,.21),'Missing building '+kind+'/'+team);
 }
 assert.equal(sandbox.runtimeKinds.units.length,50);
});

test('new trade and unique force art provides eight directions and two bounded frames per action',()=>{
 for(const id of ['trade-atlas','unique-forces-atlas']){
  const atlas=pack.atlases.find(a=>a.id===id);assert.ok(atlas,id);
  for(const [key,animation]of Object.entries(atlas.meta.anims)){
   assert.equal(animation.dirs.length,8,key);
   assert.ok(animation.dirs.every(frames=>frames.length===2),key);
  }
 }
 const castle=pack.atlases.find(a=>a.id==='ck-detailed-buildings');
 assert.deepEqual(castle.meta.anims['cs/idle/0'].dirs||castle.meta.anims['cs/idle/0'].frames,
  castle.meta.anims['bld_castle/idle/0'].dirs||castle.meta.anims['bld_castle/idle/0'].frames,
  'castle attack proxy reuses the castle asset rather than inventing another troop');
});

test('committed original atlas outputs are reproducible from the repo-native vector generator',()=>{
 const result=execFileSync(process.execPath,['scripts/build-extended-atlas.mjs','--check'],{
  cwd:new URL('../',import.meta.url),encoding:'utf8'
 });
 assert.match(result,/Verified original trade, unique-force and palisade atlases/);
});
