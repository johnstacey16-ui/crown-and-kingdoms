import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {webpDimensions} from '../scripts/raster-metadata.mjs';
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
  const {width,height}=webpDimensions(readFileSync(new URL('../'+atlas.src,import.meta.url)));
  assert.equal(sandbox.checkMeta(atlas.meta,width,height),true,atlas.id);
  sandbox.register(atlas.id,{id:atlas.id},atlas.meta);
 }
 for(const kind of sandbox.runtimeKinds.units)for(let team=0;team<4;team++)for(let state=0;state<4;state++){
  assert.ok(sandbox.artFrame(kind,team,state,0,.21,Math.PI),'Missing unit '+kind+'/'+state+'/'+team);
 }
 for(const kind of sandbox.runtimeKinds.buildings)for(let team=0;team<4;team++){
  assert.ok(sandbox.artFrame('bld_'+kind,team,3,0,.21),'Missing building '+kind+'/'+team);
 }
 assert.equal(sandbox.runtimeKinds.units.length,50);
});

test('painted raster pack uses bounded base poses and multi-frame motion, valid materials and castle proxies',()=>{
 for(const atlas of pack.atlases){
  assert.equal(atlas.meta.painted,true);assert.match(atlas.src,/\.webp$/);
  for(const [key,animation]of Object.entries(atlas.meta.anims)){
   assert.equal(animation.frames.length,atlas.meta.motion&&!key.includes('/idle/')?8:1,key);assert.ok(animation.scale>0,key);if(atlas.meta.motion)assert.ok(animation.referenceHeight>0,key);
  }
 }
 const castle=pack.atlases.find(a=>a.id==='painted-architecture');
 assert.deepEqual(castle.meta.anims['cs/idle/0'].frames,castle.meta.anims['bld_castle/idle/0'].frames);
 assert.deepEqual(webpDimensions(readFileSync(new URL('../'+pack.terrain.src,import.meta.url))),{width:1536,height:1024});
});
