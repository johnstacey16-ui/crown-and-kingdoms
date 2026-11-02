import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const production=source.slice(source.indexOf('function drawTerrainViewport('),source.indexOf('const PMAX='));
function scene(){
 const paints=[],sandbox={CW:1800,CH:886,DPR:1.2,zm:1.4,cam:{x:.3,y:.7},
  document:{createElement(){throw Error('full-screen terrain canvas must not be allocated')}},
  X:{drawImage(...a){paints.push(a)}}};
 vm.createContext(sandbox);
 vm.runInContext(production,sandbox);
 const chunks=[{cv:{id:1},ox:1,oy:2,w:512,h:256},{cv:{id:2},ox:3,oy:4,w:512,h:256}];
 return {sandbox,paints,chunks,draw:()=>sandbox.drawTerrainViewport(chunks)};
}
test('Xbox terrain draws existing painted chunks without a new full-screen opaque canvas',()=>{
 const s=scene();s.draw();
 assert.equal(s.paints.length,2);
 assert.deepEqual(s.paints[0],[s.chunks[0].cv,1*1.4-.3,2*1.4-.7,512*1.4,256*1.4]);
 assert.deepEqual(s.paints[1],[s.chunks[1].cv,3*1.4-.3,4*1.4-.7,512*1.4,256*1.4]);
 assert.doesNotMatch(production,/createElement|getContext|fillRect|setTransform|drawImage\(cv,0,0\)/,
  'do not create or copy an opaque full-screen terrain surface');
});
test('stationary Xbox camera never caches a replacement screen texture',()=>{
 const s=scene();
 for(let i=0;i<60;i++)s.draw();
 assert.equal(s.paints.length,120,'each frame draws only the already-cached chunk textures');
 assert.ok(s.paints.every((args,i)=>args[0]===s.chunks[i%2].cv));
});
test('panning, zoom and pixel scaling preserve direct chunk positions and visual ownership',()=>{
 const s=scene();s.draw();s.paints.length=0;
 s.sandbox.cam.x=18;s.sandbox.cam.y=50;s.sandbox.zm=2;s.sandbox.DPR=.6;s.draw();
 assert.deepEqual(s.paints[0],[s.chunks[0].cv,1*2-18,2*2-50,512*2,256*2]);
 assert.equal(s.paints.length,2);
 s.sandbox.DPR=1.2;s.sandbox.CW=1800;s.sandbox.CH=886;s.draw();
 assert.equal(s.paints.length,4,'no DPR-dependent GPU surface is created after resize');
});
test('cleared terrain chunks cannot leave stale black textures or cached exploration',()=>{
 const s=scene();s.draw();s.paints.length=0;
 s.chunks.length=0;s.draw();assert.equal(s.paints.length,0);
 s.chunks.push({cv:{id:3},ox:0,oy:0,w:512,h:256});s.draw();
 assert.equal(s.paints.length,1);assert.equal(s.paints[0][0],s.chunks[0].cv);
});
test('large Xbox-sized canvases remain on one terrain compositing path',()=>{
 const s=scene();s.sandbox.CW=2160;s.sandbox.CH=1063;s.sandbox.DPR=1.2;s.draw();
 assert.equal(s.paints.length,2);
 assert.ok(s.paints.every(args=>args.length===5));
});
