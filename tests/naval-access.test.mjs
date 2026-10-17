import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ai=fs.readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const mapgen=fs.readFileSync(new URL('../js/mapgen.js',import.meta.url),'utf8');

test('AI dock placement rejects isolated ponds and accepts navigable sea',()=>{
 const source=ai.slice(ai.indexOf('function aiDockWaterReach('),ai.indexOf('function aiDock(vs,'));
 const W=24,H=24,wt=new Uint8Array(W*H);
 for(let y=5;y<7;y++)for(let x=5;x<7;x++)wt[y*W+x]=1;
 for(let y=10;y<20;y++)for(let x=10;x<20;x++)wt[y*W+x]=1;
 const fn=vm.runInNewContext(source+';aiDockWaterReach',{W,H,S:{wt}});
 assert.equal(fn(5,5),false);
 assert.equal(fn(11,11),true);
});
test('map audit distinguishes partial from full naval access',()=>{
 assert.match(mapgen,/navalAccess:dockableStarts===starts\.length&&starts\.length>0/);
 assert.match(mapgen,/partialNavalAccess:dockableStarts>0/);
});
test('transport unload reports successful disembarkation and retained passengers',()=>{
 const sim=fs.readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
 assert.match(sim,/u\.cg=cg\.filter\(c=>c\.ld\)/);
 assert.match(sim,/note\('Passengers unloaded: '\+unloaded\)/);
 assert.match(sim,/note\('Some passengers could not disembark'\)/);
});
