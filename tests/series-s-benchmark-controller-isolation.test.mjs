import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/engine-graphics-benchmark.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');

function game(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 return {run:sandbox.evaluate,storage};
}

test('automatic benchmark rejects thumbstick movement and gameplay buttons without changing camera or units',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";pad={connected:true,buttons:[],axes:[1,1,1,1]};E=[];P=[]');
 assert.equal(run("beginCanvasBenchmark('layers')"),true);
 const state='JSON.stringify({cam,cur,zm,units:S.us.map(u=>[u.id,u.o,u.x,u.y]),selection:S.sel})';
 const before=run(state);
 for(let i=0;i<15;i++)run('E=[];P=[];ctl(.1)');
 assert.equal(run(state),before,'sticks must not pan, zoom, select, or issue orders during sample');
 assert.equal(run('canvasBenchmark.kind'),'layers');
 assert.equal(run('mode'),'play');
 assert.equal(storage.has('ck_set'),false);
});
test('Menu cancels immediately, restores graphics, resume speed, and pause UI',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;pad={connected:true,buttons:[],axes:[0,0,0,0]};E=[];P=[]');
 assert.equal(run("beginCanvasBenchmark('layers')"),true);
 run('sampleCanvasBenchmark(1000,200);sampleCanvasBenchmark(9000,200)');
 assert.equal(run('perfLayerMode'),1);
 run('E=[];E[9]=true;ctl(.033)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('canvasBenchSummary'),null);
 assert.equal(run('mode'),'pause');
 assert.equal(run('gs'),1.5);
 assert.equal(run('perfLayerMode+perfFlatField'),0);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('pm'),0);
 assert.equal(storage.has('ck_set'),false);
});
test('B and disconnect also cancel; ordinary inputs work after diagnostic exits',()=>{
 const {run}=game();
 run('start();perfTestMatch=1;mode="pause";pad={connected:true,buttons:[],axes:[0,0,0,0]};E=[];P=[]');
 run('beginCanvasBenchmark();E=[];E[1]=true;ctl(.033)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('mode'),'pause');
 run('mode="pause";E=[];beginCanvasBenchmark();pad=null;ctl(.033)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('mode'),'pause');
 assert.match(input,/if\(typeof canvasBenchmark!=='undefined'&&canvasBenchmark\)/);
 assert.match(input,/if\(E\[9\]\|\|E\[1\]\)\{stopCanvasBenchmark\(true\)/);
 assert.match(ui,/Menu\/B cancels/);
 assert.match(engine,/if\(mode!=='play'&&mode!=='pause'&&canvasBenchmark\)stopCanvasBenchmark\(true\)/);
});
