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
 assert.equal(run('Number.isFinite(perfTilesMs)&&Number.isFinite(perfChunksMs)'),true);
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
