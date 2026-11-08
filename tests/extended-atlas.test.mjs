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
 assert.equal(sandbox.runtimeKinds.units.length,52);
});

test('painted raster pack uses bounded base poses and multi-frame motion, valid materials and castle proxies',()=>{
 for(const atlas of pack.atlases){
  assert.equal(atlas.meta.painted,true);assert.match(atlas.src,/\.webp$/);
  for(const [key,animation]of Object.entries(atlas.meta.anims)){
   assert.equal(animation.frames.length,(atlas.meta.environmentMotion||atlas.meta.motion&&!key.includes('/idle/'))?8:1,key);assert.ok(animation.scale>0,key);if(atlas.meta.motion||atlas.meta.environmentMotion)assert.ok(animation.referenceHeight>0,key);if(atlas.meta.environmentMotion){assert.ok(animation.referenceWidth>0,key);assert.equal(atlas.meta.neutral,true)}
  }
 }
 const castle=pack.atlases.find(a=>a.id==='painted-architecture');
 assert.deepEqual(castle.meta.anims['cs/idle/0'].frames,castle.meta.anims['bld_castle/idle/0'].frames);
 assert.deepEqual(webpDimensions(readFileSync(new URL('../'+pack.terrain.src,import.meta.url))),{width:1536,height:1024});
});


test('animated frame lookup indexes registered atlases without rescanning loaded sheets per soldier',()=>{
 const source=readFileSync(new URL('../js/assets.js',import.meta.url),'utf8');
 const ctx=vm.createContext({teamColor:()=> '#2255ee'});
 vm.runInContext(source+`
  globalThis.inspect={register:regAtlas,frame:assetFrame,index:ASSET_ANIM_INDEX,atlas:ASSET.atl};
  let scans=0;
  ASSET.atl=new Proxy(ASSET.atl,{ownKeys(target){scans++;return Reflect.ownKeys(target)}});
  globalThis.scanCount=()=>scans;
 `,ctx);
 const f=(x,ax=2)=>({x,y:2,w:8,h:12,ax,ay:11});
 const m=(x,ax=2)=>({painted:false,anims:{'mil/idle/0':{frames:[f(x,ax)],scale:1}}});
 ctx.inspect.register('first',{name:'first'},m(10));
 ctx.inspect.register('later',{name:'later'},m(20));
 assert.equal(ctx.inspect.index.get('mil/idle/0').length,2);
 const scans=ctx.scanCount();
 for(let i=0;i<500;i++){
  const frame=ctx.inspect.frame('mil',0,0,0,1);
  assert.equal(frame.f.x,10,'first registered matching frame wins');
  assert.equal(frame.img.name,'first');
 }
 assert.equal(ctx.scanCount(),scans,'hot sprite lookups do not enumerate all loaded atlases');
 ctx.inspect.register('first',{name:'new-first'},m(30,7));
 assert.equal(ctx.inspect.frame('mil',0,0,0,1).f.x,30,'reload updates cached frame source and anchor');
 assert.equal(ctx.inspect.frame('mil',0,0,0,1).f.ax,7);
 ctx.inspect.register('first',{name:'unrelated'}, {painted:false,anims:{'arc/idle/0':{frames:[f(4)]}}});
 assert.equal(ctx.inspect.frame('mil',0,0,0,1).f.x,20,'next matching atlas survives replacement');
 assert.equal(ctx.inspect.frame('unknown',0,0,0,1),null,'missing animations retain procedural fallback');
});
test('animation index follows async atlas success, failure, validation and replacement',()=>{
 const source=readFileSync(new URL('../js/assets.js',import.meta.url),'utf8'),images=[];
 class FakeImage{
  constructor(){this.width=this.height=64;images.push(this)}
  set src(value){this.url=value}
 }
 const ctx=vm.createContext({Image:FakeImage,teamColor:()=> '#2255ee'});
 vm.runInContext(source+';globalThis.inspect={load:loadAtlas,frame:assetFrame,index:ASSET_ANIM_INDEX};',ctx);
 const anim=(x)=>({painted:false,anims:{'arc/idle/0':{frames:[{x,y:2,w:8,h:12,ax:4,ay:10}],dur:.1}}});
 ctx.inspect.load('late','first.webp',anim(4));
 assert.equal(ctx.inspect.frame('arc',0,0,0,0),null,'unloaded sprites do not show placeholder pixels');
 images[0].onload();
 assert.equal(ctx.inspect.frame('arc',0,0,0,0).img,images[0]);
 ctx.inspect.load('late','reload.webp',anim(12));
 assert.equal(ctx.inspect.frame('arc',0,0,0,0),null,'old atlas is removed while replacement is pending');
 images[1].onload();
 assert.equal(ctx.inspect.frame('arc',0,0,0,0).img,images[1]);
 ctx.inspect.load('late','missing.webp',anim(25));images[2].onerror();
 assert.equal(ctx.inspect.frame('arc',0,0,0,0),null,'failed replacement never reuses previous image');
 ctx.inspect.load('late','invalid.webp',anim(60));
 images[3].onload();
 assert.equal(ctx.inspect.frame('arc',0,0,0,0),null,'invalid atlas dimensions do not get indexed');
 ctx.inspect.load('late','working.webp',anim(2));images[4].onload();
 assert.equal(ctx.inspect.frame('arc',0,0,0,0).img,images[4],'new valid atlas restores art');
});
