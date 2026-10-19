import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function aiSiegeTarget('),source.indexOf('function aiAvailableBuilder('));
const building=(k,x,extra={})=>({k,x,y:5,s:2,t:1,done:true,hp:100,...extra});
const leader={x:5,y:5,t:0};
function fixture(blocked=new Set()){
 const checked=[];
 const select=vm.runInNewContext(code+';aiSiegeTarget',{
  isHostile:(a,b)=>a!==b,
  goalNear:b=>b,
  path:(u,b)=>{checked.push(b);return blocked.has(b)?null:[[b.x,b.y]]},
 });
 return {select,checked};
}
test('siege prioritises castles, then towers, then town centres and skips unreachable targets',()=>{
 const tc=building('tc',6),tower=building('tower',8),near=building('castle',12),far=building('castle',20);
 const f=fixture(new Set([near]));
 assert.equal(f.select(leader,[tc,far,tower,near],tc),far);
 assert.deepEqual(f.checked,[near,far]);
 const g=fixture(new Set([near,far]));
 assert.equal(g.select(leader,[tc,far,tower,near],tc),tower);
});
test('siege excludes friendly, destroyed and unfinished buildings; route work is bounded',()=>{
 const fallback=building('tc',6);
 const f=fixture();
 assert.equal(f.select(leader,[building('castle',1,{t:0}),building('castle',2,{hp:0}),building('castle',3,{done:false})],fallback),fallback);
 assert.equal(f.checked.length,0);
 const candidates=Array.from({length:20},(_,i)=>building('castle',i+10));
 const g=fixture(new Set(candidates));
 assert.equal(g.select(leader,candidates,fallback),fallback);
 assert.equal(g.checked.length,12);
 assert.equal(g.select(null,candidates,fallback),fallback);
});
