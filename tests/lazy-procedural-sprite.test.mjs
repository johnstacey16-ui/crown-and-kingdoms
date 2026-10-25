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
