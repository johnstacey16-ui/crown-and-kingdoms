import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
const forces=pack.atlases.find(a=>a.id==='painted-forces');
const architecture=pack.atlases.find(a=>a.id==='painted-architecture');
assert.ok(forces?.meta.anims['mil/idle/0']&&architecture?.meta.anims['bld_house/work/0']);

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+'\n'+
  'globalThis.evaluate=code=>eval(code);globalThis.spriteRequests=0;const realSprite=spr;spr=function(...args){spriteRequests++;return realSprite(...args)};',sandbox);
 const run=sandbox.evaluate;
 run("start();globalThis.unit=addU(0,'mil',20,20);globalThis.building={k:'house',t:0,x:19,y:19,s:B.house.s,done:true,pr:B.house.bt,hp:120,mh:120,q:[]};spriteRequests=0");
 return run;
}
function register(run,atlas,id){
 run("regAtlas("+JSON.stringify(id)+",{width:1,height:1},"+JSON.stringify(atlas.meta)+")");
}

test('painted unit and building draw without creating unused procedural sprites',()=>{
 const run=fixture();
 register(run,forces,'forces');
 register(run,architecture,'architecture');
 const oldHash=run('JSON.stringify([unit,building])'),before=run('SPC.size');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),0,'atlas-backed units and buildings must not even request a fallback');
 assert.equal(run('SPC.size'),before,'no unused canvas allocations in sprite cache');
 assert.ok(run('ASSET.hits')>=2,'actual production atlas renderer was exercised');
 assert.equal(run('JSON.stringify([unit,building])'),oldHash,'rendering must not change gameplay');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),0,'subsequent animation frames stay on the art path');
});

test('when painted atlases disappear, both renderers recreate their procedural fallbacks',()=>{
 const run=fixture();
 register(run,forces,'forces');
 register(run,architecture,'architecture');
 run('drawUnit(unit,new Set());drawBld(building);ASSET.atl={};ASSET.n=0;spriteRequests=0');
 const before=run('SPC.size');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),2,'both missing art entries must reach procedural sprites');
 assert.ok(run('SPC.size')>=before+2,'missing art constructs the needed cached canvases');
});

test('partial atlas loading preserves fallback for only the missing building',()=>{
 const run=fixture();
 register(run,forces,'forces');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),1,'painted troop uses atlas; unavailable house uses fallback');
 assert.ok(run('ASSET.hits')>=1&&run('ASSET.miss')>=1);
});

test('procedural fallback textures obey an 8 MiB LRU and refresh on demand',()=>{
 const run=fixture();
 run('clearProceduralSpriteCache();globalThis.spriteA=spr("a",400,400,()=>{});spr("b",400,400,()=>{});spr("c",400,400,()=>{})');
 assert.equal(run('SPC.size'),3);
 assert.equal(run('SPC_PIXELS'),3*400*400*4);
 run('spr("b",400,400,()=>{});spr("d",400,400,()=>{})');
 assert.equal(run('SPC.has("a")'),false,'the oldest unused sprite is evicted');
 assert.equal(run('SPC.has("b")'),true,'recently-used sprite is retained');
 assert.ok(run('SPC_PIXELS')<=run('SPC_PIXEL_LIMIT'));
 assert.equal(run('SPC.size'),3);
 run('spr("a",400,400,()=>{})');
 assert.equal(run('SPC.has("a")'),true,'evicted fallback artwork is reconstructed');
 assert.equal(run('SPC.get("a")===spriteA'),false);
 const before=run('SPC.size');
 assert.equal(run('spr("oversize",1500,1500,()=>{}).width'),3000);
 assert.equal(run('SPC.size'),before,'oversized art renders without entering the cache');
 assert.ok(run('SPC_PIXELS')<=run('SPC_PIXEL_LIMIT'));
 run('clearProceduralSpriteCache()');
 assert.equal(run('SPC.size'),0);
 assert.equal(run('SPC_PIXELS'),0,'atlas reload clears accounting too');
});

test('loading a material texture invalidates both fallback sprites and their pixel accounting',()=>{
 const run=fixture();
 run('clearProceduralSpriteCache();spr("old-material",400,400,()=>{});globalThis.loadedMaterial=null;globalThis.Image=class {set src(path){globalThis.loadedMaterial=this}};loadCKTexture("stone","test://stone")');
 assert.equal(run('SPC.size'),1);
 assert.equal(run('SPC_PIXELS'),640000);
 run('loadedMaterial.onload()');
 assert.equal(run('CK_TEX.stone===loadedMaterial'),true,'loaded material is available for replacement art');
 assert.equal(run('SPC.size'),0,'stale material fallback textures are removed');
 assert.equal(run('SPC_PIXELS'),0,'evicted pixels do not remain counted after the image loads');
 run('spr("fresh-material",400,400,()=>{})');
 assert.equal(run('SPC.size'),1,'fresh textured fallback can enter the cache');
 assert.equal(run('SPC_PIXELS'),640000,'new fallback accounts for only its own pixels');
});
