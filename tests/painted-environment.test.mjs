import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {reflowSpriteGrid} from '../scripts/sprite-grid.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('environment selection distinguishes animals, fish and three tree forms without replacing farms or confusing traps with shoals',()=>{
 const source=read('js/render.js'),c=vm.createContext({ASSET:{n:1},hsh:(x,y)=>x/3,assetFrame:k=>k});vm.runInContext(source.slice(source.indexOf('function paintedEnvironmentFrame('),source.indexOf('function drawPaintedRelic(')),c);
 for(let x=0;x<3;x++)assert.equal(c.paintedEnvironmentFrame({k:'w',x,y:0}),'env_'+['pine','oak','birch'][x]);
 assert.equal(c.paintedEnvironmentFrame({k:'f',an:1}),'env_deer');assert.equal(c.paintedEnvironmentFrame({k:'f',fi:1}),'env_fish');
 assert.equal(c.paintedEnvironmentFrame({k:'f',fi:1,trap:1,x:0,y:0}),'env_trap_0');assert.equal(c.paintedEnvironmentFrame({k:'w',fi:1,trap:1,x:0,y:0}),null);assert.equal(c.paintedEnvironmentFrame({k:'f',fm:1}),null);assert.equal(c.paintedEnvironmentFrame({k:'g'}),null);
 assert.ok(c.paintedResourceWidth({k:'w'},{f:{w:100,h:400}})<=21.5,'tall trees fit the existing 86px tree height');
});
test('detached fish remain together when packing a multi-object environment cell',()=>{
 const width=80,height=64,data=Buffer.alloc(width*height*4);
 for(const [ox,oy]of [[4,4],[24,4]])for(let y=0;y<9;y++)for(let x=0;x<9;x++)data[((oy+y)*width+ox+x)*4+3]=255;
 assert.throws(()=>reflowSpriteGrid(data,width,height,1,1,1),/Ambiguous/);
 const packed=reflowSpriteGrid(data,width,height,1,1,1,true);let count=0;
 for(let i=3;i<packed.data.length;i+=4)if(packed.data[i]===255)count++;
 assert.equal(count,162);
});
test('relic projection uses carrier coordinates, excludes hidden/garrisoned relics and does not mutate simulation',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+['assets','network-sync','network-commands','network-unit-map'].map(n=>read('js/'+n+'.js')).join('\n')+`;seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;start();S.us=[];S.bs=[];
 globalThis.worker=addU(0,'mon',20.5,20.5);globalThis.hidden=addU(1,'mon',60.5,60.5);
 S.rel=[{rl:1,x:21.5,y:21.5},{rl:1,x:60.5,y:60.5},{rl:1,x:60.5,y:60.5,c:worker},{rl:1,x:21.5,y:21.5,c:hidden},{rl:1,x:21.5,y:21.5,m:{}}];
 globalThis.run=s=>eval(s);`,sandbox);
 const c=sandbox.run,before=c('CK_SIM_SYNC.worldCheckpoint(S,1).hash');
 const projected=c('CK_UNIT_MAP.project(S,0,W,H).battlefield.relics');
 assert.equal(projected.length,2);assert.equal(projected[1].x,20.5);assert.equal(projected[1].carried,true);
 projected[0].x=0;assert.equal(c('S.rel[0].x'),21.5);assert.equal(c('CK_SIM_SYNC.worldCheckpoint(S,1).hash'),before);
});
test('all graphics categories remain explicitly tracked with complete unit/building coverage',()=>{
 const inventory=JSON.parse(read('docs/graphics-inventory.json'));
 assert.equal(inventory.complete,false);assert.equal(inventory.units.length,47);assert.equal(inventory.buildings.length,22);assert.ok(inventory.units.every(x=>x.paintedBase));
 assert.equal(inventory.units.filter(x=>x.walkFrames>1&&x.attackFrames>1).length,47);assert.ok(inventory.checklist.length>=11);
});


test('fish-trap variants are geographic, neutral, static and preserve resource state and fallback',()=>{
 const source=read('js/render.js'),calls=[],c=vm.createContext({ASSET:{n:1},hsh:(x,y)=>x/4,assetFrame(...args){calls.push(args);return args[0]}});
 vm.runInContext(source.slice(source.indexOf('function paintedEnvironmentFrame('),source.indexOf('function drawPaintedRelic(')),c);
 for(let x=0;x<4;x++){
  const n={k:'f',fi:1,trap:1,x,y:0,t:0,amt:900},before=JSON.stringify(n);
  assert.equal(c.paintedEnvironmentFrame(n),'env_trap_'+x);assert.equal(JSON.stringify(n),before);
  n.t=3;n.amt=1;assert.equal(c.paintedEnvironmentFrame(n),'env_trap_'+x);
  assert.equal(c.paintedResourceWidth(n),38);
 }
 assert.ok(calls.every(a=>a.slice(1).every(v=>v===0)),'owner and clock never drive the natural artwork');
 c.ASSET.n=0;assert.equal(c.paintedEnvironmentFrame({k:'f',fi:1,trap:1,x:0,y:0}),null);
 const pack=JSON.parse(read('assets/atlas-manifest.json')),saved=JSON.parse(read('assets/fishtrap-manifest.json')).atlases;
 const atlas=pack.atlases.find(a=>a.id==='painted-fishtraps');assert.deepEqual([atlas],saved);assert.equal(atlas.meta.neutral,true);
 assert.equal(Object.keys(atlas.meta.anims).length,4);assert.equal(new Set(Object.values(atlas.meta.anims).map(a=>JSON.stringify(a.frames))).size,4);
 assert.match(read('scripts/build-painted-atlas.mjs'),/fishtrap-manifest\.json/);assert.match(read('scripts/build-motion-atlas.mjs'),/painted-fishtraps/);assert.match(read('sw.js'),/painted-fishtraps\.webp/);
});
