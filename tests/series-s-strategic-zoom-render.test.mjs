import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const buildings=readFileSync(new URL('../js/render-buildings.js',import.meta.url),'utf8');

function game(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 return {run:sandbox.run,storage};
}

test('farthest zoom uses cheap building footprints in a crowded visible scene and preserves selection',()=>{
 const {run,storage}=game();
 run(`start();mode='play';S.ex.fill(1);S.vs.fill(1);
  const base=S.bs.find(b=>b.t===0)||S.bs[0];
  for(let i=0;i<36;i++)S.bs.push({...base,x:18+i%6*2,y:18+(i/6|0)*2,k:'house',done:true,id:20000+i,q:[],hp:100,mh:100,s:2});
  const selected=S.bs[S.bs.length-1];S.sel=[selected];
  zm=.8;TW=64*zm;TH=32*zm;ctr(23,23);
  globalThis.normalBuildings=[];globalThis.strategicBuildings=[];
  drawBld=b=>normalBuildings.push(b.id);
  drawStrategicBuilding=b=>strategicBuildings.push(b.id);`);
 const state=run('JSON.stringify(S)'),save=JSON.stringify([...storage]);
 run('drawWorld()');
 const near=JSON.parse(run('JSON.stringify({lod:strategicBuildings,normal:normalBuildings})'));
 assert.ok(near.lod.length>=16,'many ordinary buildings use the cheap strategy view');
 assert.ok(near.normal.includes(20035),'selected building retains its original artwork');
 assert.ok(near.lod.every(id=>id!==20035),'selected art is never replaced');
 assert.equal(run('JSON.stringify(S)'),state,'rendering never changes the world');
 assert.equal(JSON.stringify([...storage]),save,'no saves or settings changed');
 run('normalBuildings.length=0;strategicBuildings.length=0;zm=3;TW=64*zm;TH=32*zm;ctr(23,23);drawWorld()');
 const close=JSON.parse(run('JSON.stringify({lod:strategicBuildings,normal:normalBuildings})'));
 assert.equal(close.lod.length,0,'full artwork returns at normal/close zoom');
 assert.ok(close.normal.length>0);
});
test('resource nodes and unit sprites retain their original production draw paths',()=>{
 assert.match(render,/if\(k===0\)drawNode\(o\)/);
 assert.match(render,/else if\(k===2\)drawUnit\(o,selectedUnits,it\[3\]\)/);
 assert.match(render,/!S\.ex\[b\.y\*W\+b\.x\]/,'undiscovered enemy buildings are still hidden');
 assert.match(render,/if\(P\[0\]<-160/,'screen culling runs before LOD');
 assert.match(render,/o\.k!=='tc'&&o\.k!=='castle'&&o\.k!=='wonder'/,'critical landmarks retain painted art');
});
test('strategic building art retains team colour, damage, construction and queue cues without atlas work',()=>{
 assert.match(buildings,/function drawStrategicBuilding\(b,position\)/);
 assert.match(buildings,/teamColor\(b\.t\)/);
 assert.match(buildings,/if\(!b\.done\)/);
 assert.match(buildings,/b\.hp<b\.mh/);
 assert.match(buildings,/if\(b\.q\?\.length\)/);
 assert.doesNotMatch(buildings.slice(buildings.indexOf('function drawStrategicBuilding('),buildings.indexOf('function drawBld(')),/assetFrame|paintedBuildingFrame|spr\(/);
});
