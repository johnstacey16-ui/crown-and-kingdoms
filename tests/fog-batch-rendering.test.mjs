import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const begin=source.indexOf('function paintFogLayer('),end=source.indexOf('function drawWorld(',begin);
assert.ok(begin>=0&&end>begin,'extract the production fog path painter');

function painter(){
 const ops=[],ctx={beginPath(){ops.push(['begin'])},moveTo(...p){ops.push(['move',...p])},
  lineTo(...p){ops.push(['line',...p])},closePath(){ops.push(['close'])},
  fill(){ops.push(['fill',this.fillStyle])}};
 const f=vm.runInNewContext(source.slice(begin,end)+'\npaintFogLayer', {X:ctx});
 return {f,ops};
}
test('hundreds of unexplored or dimmed tiles each require exactly one canvas fill',()=>{
 const {f,ops}=painter();
 f([],33,17,'#000');assert.equal(ops.length,0);
 const points=[];for(let i=0;i<200;i++)points.push(i*64,100+i*3);
 f(points,33,17,'#000');
 assert.equal(ops.filter(o=>o[0]==='fill').length,1);
 assert.equal(ops.filter(o=>o[0]==='move').length,200);
 assert.equal(ops.filter(o=>o[0]==='close').length,200);
 assert.deepEqual(ops[1],['move',0,83]);
 assert.deepEqual(ops.slice(2,5),[['line',33,100],['line',0,117],['line',-33,100]]);
 ops.length=0;
 f(points,32,16,'rgba(0,0,0,.42)');
 assert.equal(ops.filter(o=>o[0]==='fill').length,1);
 assert.equal(ops.find(o=>o[0]==='fill')[1],'rgba(0,0,0,.42)');
});

function game(){
 const {source:gameSource,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(gameSource+'\n'+'globalThis.evaluate=code=>eval(code);globalThis.fogCalls=[];const originalFog=paintFogLayer;paintFogLayer=function(...args){if(args[0].length)fogCalls.push({tiles:args[0].length/2,colour:args[3]});return originalFog(...args)};',sandbox);
 const run=sandbox.evaluate;
 run('start();S.nd.fill(null);S.us=[];S.bs=[];S.rel=[];S.sel=[];perfHud=1');
 return run;
}
test('production world batches unexplored fog and never leaks hidden resource nodes',()=>{
 const run=game();
 run('S.ex.fill(0);S.vs.fill(0);fogCalls=[];drawWorld()');
 const calls=run('JSON.parse(JSON.stringify(fogCalls))');
 assert.equal(calls.length,1,'all unexplored diamonds share a single black pass');
 assert.equal(calls[0].colour,'#000');assert.ok(calls[0].tiles>=20);
 assert.equal(run('Number.isFinite(perfTilesMs)&&Number.isFinite(perfChunksMs)&&perfFogMs>=0&&perfFogMs<=perfTilesMs'),true);
});
test('explored fog and mixed sight retain exactly their intended two visibility layers',()=>{
 const run=game();
 run('S.ex.fill(1);S.vs.fill(0);fogCalls=[];drawWorld()');
 let calls=run('JSON.parse(JSON.stringify(fogCalls))');
 assert.equal(calls.length,1);assert.equal(calls[0].colour,'rgba(0,0,0,.42)');
 run('S.ex.fill(1);S.vs.fill(1);fogCalls=[];drawWorld()');
 assert.equal(run('fogCalls.length'),0,'fully visible map paints no fog');
 run('for(let i=0;i<S.ex.length;i++){S.ex[i]=i%3?1:0;S.vs[i]=i%3===1?0:1;}fogCalls=[];drawWorld()');
 calls=run('JSON.parse(JSON.stringify(fogCalls))');
 assert.deepEqual(calls.map(c=>c.colour),['#000','rgba(0,0,0,.42)']);
 assert.ok(calls.every(c=>c.tiles>5));
});

function maskPainter(){
 const worldOps=[],maskOps=[],events=new Map();let fail=false,lost=false;
 const ctx=ops=>({globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',shadowBlur:0,
  getTransform:()=>({a:1.2,b:0,c:0,d:1.2,e:0,f:0}),isContextLost:()=>lost,
  beginPath(){ops.push('begin')},moveTo(){},lineTo(){},closePath(){ops.push('close')},fill(){ops.push('fill')},
  setTransform(){},clearRect(){},save(){},restore(){},drawImage(){ops.push('blit')}});
 const world=ctx(worldOps);world.canvas={width:640,height:320};const mask=ctx(maskOps);
 const sandbox={X:world,document:{createElement(){return {width:0,height:0,addEventListener(n,f){events.set(n,f)},getContext:()=>fail?null:mask}}}};
 vm.createContext(sandbox);vm.runInContext(source.slice(begin,end)+';globalThis.cache=FOG_MASK_CACHE;',sandbox);
 const points=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)points.push((x-y)*32,(x+y)*16);
 return {sandbox,world,worldOps,maskOps,events,points,draw:(p=points,w=33.5,h=17.5,c='#000')=>sandbox.drawWorldFog(p,w,h,c),setFail(v){fail=v},setLost(v){lost=v}};
}
test('stationary opaque fog paints native geometry once then reuses one bounded backing surface',()=>{
 const s=maskPainter();s.draw();assert.equal(s.sandbox.cache.canvas,null,'moving/new mask first uses original painter');s.draw();
 assert.equal(s.sandbox.cache.builds,1);assert.equal(s.worldOps.filter(x=>x==='close').length,400);assert.equal(s.maskOps.filter(x=>x==='close').length,400);
 for(let i=0;i<60;i++)s.draw();assert.equal(s.sandbox.cache.builds,1);assert.equal(s.sandbox.cache.hits,60);
 assert.equal(s.maskOps.filter(x=>x==='close').length,400);assert.equal(s.worldOps.filter(x=>x==='close').length,400,'no repeated world path commands');assert.equal(s.worldOps.filter(x=>x==='blit').length,61);
 assert.ok(s.sandbox.cache.canvas.width*s.sandbox.cache.canvas.height<=4000000);
 s.draw(s.points,33,17,'rgba(0,0,0,.42)');assert.equal(s.sandbox.cache.ready,true,'live dim fog does not evict opaque cache');
});
test('camera, zoom, sight and backing size invalidate immediately, with no stale unknown land',()=>{
 const s=maskPainter();s.draw();s.draw();let n=1;
 for(const [p,w,h] of [[s.points.map((v,i)=>i===0?v+.2:v),33,17],[s.points,34,17],[s.points.slice(2),34,17]]){
  s.draw(p,w,h);assert.equal(s.sandbox.cache.ready,false);s.draw(p,w,h);assert.equal(s.sandbox.cache.builds,++n);
 }
 s.world.canvas.width=2000;s.draw();assert.equal(s.sandbox.cache.ready,false);s.draw();assert.equal(s.sandbox.cache.canvas.width,2000);
 s.draw([]);assert.equal(s.sandbox.cache.canvas,null);assert.equal(s.sandbox.cache.points.length,0);
});
test('lost, failed, oversized or unsupported fog-mask surfaces retain the original painter and world context',()=>{
 const s=maskPainter();s.draw();s.draw();const old=s.sandbox.cache.canvas;
 s.events.get('contextlost')();assert.equal(s.sandbox.cache.canvas,null);assert.equal(old.width,1);
 s.draw();s.setFail(true);s.draw();assert.equal(s.sandbox.cache.ready,false);assert.equal(s.sandbox.X,s.world);
 s.setFail(false);s.setLost(true);s.draw();s.draw();assert.equal(s.sandbox.cache.ready,false);assert.equal(s.sandbox.X,s.world);
 s.setLost(false);s.draw();s.draw();s.world.canvas.width=50000;s.draw();assert.equal(s.sandbox.cache.canvas,null);
 s.world.globalAlpha=.5;s.draw();assert.equal(s.sandbox.cache.canvas,null,'unusual alpha uses established path');
 const broken=maskPainter();broken.draw();broken.sandbox.document.createElement=()=>({getContext:()=>({setTransform(){},clearRect(){},beginPath(){throw Error('paint failed')}})});broken.draw();
 assert.equal(broken.sandbox.X,broken.world,'a throwing mask painter always restores the live world context');assert.equal(broken.sandbox.cache.canvas,null);
});
