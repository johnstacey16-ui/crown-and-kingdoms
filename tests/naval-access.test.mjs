import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const policy=fs.readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8');
const mapgen=fs.readFileSync(new URL('../js/mapgen.js',import.meta.url),'utf8');

test('AI dock placement rejects isolated ponds and accepts navigable sea',()=>{
 const source=policy.slice(policy.indexOf('function aiDockWaterReach('),policy.indexOf('// The first Feudal push',policy.indexOf('function aiDockWaterReach(')));
 const W=24,H=24,wt=new Uint8Array(W*H);
 for(let y=5;y<7;y++)for(let x=5;x<7;x++)wt[y*W+x]=1;
 for(let y=10;y<20;y++)for(let x=10;x<20;x++)wt[y*W+x]=1;
 const fn=vm.runInNewContext(source+';aiDockWaterReach',{W,H,S:{wt,nd:new Array(W*H)}});
 assert.equal(fn(5,5),false);
 assert.equal(fn(11,11),true);
});
test('map audit distinguishes partial from full naval access',()=>{
 assert.match(mapgen,/navalAccess:dockableStarts===starts\.length&&starts\.length>0/);
 assert.match(mapgen,/partialNavalAccess:dockableStarts>0/);
});
test('transport unload reports successful disembarkation and retained passengers',()=>{
 const sim=fs.readFileSync(new URL('../js/simulation-unit-behaviour.js',import.meta.url),'utf8');
  assert.match(sim,/u\.cg=cg\.filter\(c=>c\.ld===u&&c\.hp>0\)/,
    'Only living passengers still aboard this transport remain in its manifest');
  assert.match(sim,/note\(unloaded\?\(u\.cg\.length\?/,
    'Transport feedback must distinguish full and partial disembarkation');
 assert.match(sim,/u\.cg\.length\?'Passengers unloaded: '\+unloaded\+'; '\+u\.cg\.length\+' still aboard'/,
   'Partial unloading must disclose how many passengers remain aboard');
 assert.match(sim,/No safe shore to unload; move closer to land/,
   'Completely blocked shores must produce actionable feedback');
});
