import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const s=render.indexOf('const NODE_TEXTURE_CACHE='),e=render.indexOf('function drawNode(',s);
assert.ok(s>=0&&e>s,'extract actual production static resource cache');

test('a painted static resource is cropped once per atlas image and frame',()=>{
 let creations=0;const calls=[];
 const fake={document:{createElement(kind){assert.equal(kind,'canvas');creations++;
  return {width:0,height:0,getContext(type){assert.equal(type,'2d');
   return {drawImage(...args){calls.push(args)}}}};
 }}};
 const crop=vm.runInNewContext(render.slice(s,e)+'\npaintedNodeTexture',fake);
 const img={},f={x:25,y:27,w:120,h:180,ax:52,ay:177},a={img,f,painted:true};
 const first=crop(a,72);
 assert.equal(first.width,144);assert.equal(first.height,216);
 assert.equal(crop(a,72),first,'same atlas frame reuses a small texture');
 assert.equal(creations,1);
 assert.deepEqual(calls[0].slice(1),[25,27,120,180,0,0,144,216]);
 assert.equal(crop(a,66).width,132,'farm has its own static crop size');
 assert.notEqual(crop({img,f:{...f,x:26}},72),first,'new frame invalidates');
 assert.notEqual(crop({img:{},f},72),first,'reloaded atlas invalidates');
 assert.equal(crop({img:null,f},72),null);
});
test('production world times visible nodes/buildings/troops separately in original depth order',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+[
  'globalThis.evaluate=code=>eval(code);',
  'globalThis.ASSET={n:0};',
  'drawChunks=function(){};',
  'drawNode=function(){};drawBld=function(){};drawUnit=function(){};',
 ].join('\n'),sandbox);
 const run=sandbox.evaluate;
 run('start();perfHud=1;perfLayerMode=2;S.ex.fill(1);S.vs.fill(1);drawWorld()');
 assert.ok(run('perfNodeCount')>0);
 assert.ok(run('perfBuildingCount')>0);
 assert.ok(run('perfUnitCount')>0);
 assert.equal(run('perfNodeMs>=0&&perfBuildingMs>=0&&perfUnitMs>=0'),true);
 run('perfLayerMode=1;drawWorld()');
 assert.equal(run('perfNodeCount+perfBuildingCount+perfUnitCount'),0);
 assert.match(render,/L\.sort\(\(a,b\)=>a\[0\]-b\[0\]\)/);
 assert.match(ui,/NODE '\+perfNodeMs\.toFixed/);
 assert.match(ui,/BLD '\+perfBuildingMs\.toFixed/);
 assert.match(ui,/UNIT '\+perfUnitMs\.toFixed/);
});
