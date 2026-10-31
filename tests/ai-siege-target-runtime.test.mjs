import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const start=source.indexOf('function aiSiegeTarget('),end=source.indexOf('function aiAvailableBuilder(',start);
assert.ok(start>=0&&end>start,'siege target decision policy must remain defined');
const code=source.slice(start,end);
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
 // Former second fixture: unblocked fortress priority and a Town Centre fallback.
 const h=fixture(),tc2=building('tc',5),tower2=building('tower',7),castle2=building('castle',40);
 assert.equal(h.select(leader,[tc2,tower2,castle2],tc2),castle2);
 assert.equal(h.select(leader,[tc2,tower2],tc2),tower2);
 assert.equal(h.select(leader,[tc2],tower2),tc2);
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
 // Former second fixture: reject invalid objectives and choose a reachable tower.
 const blocked=building('castle',11),reachable=building('tower',25);
 const checked=fixture(new Set([blocked]));
 const candidates2=[building('castle',5,{t:0}),building('castle',8,{hp:0}),
  building('castle',10,{done:false}),blocked,reachable];
 assert.equal(checked.select(leader,candidates2,fallback),reachable);
 assert.equal(checked.select(leader,candidates2.slice(0,-1),fallback),fallback);
 assert.equal(checked.select(null,[reachable],fallback),fallback);
});

// Wave staging/release contracts were previously in ai-siege-support.test.mjs.
test('staged AI waves assign their siege target to siege units',()=>{
 assert.match(source,/const siegeLeader=sol\.find\(u=>\['ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)\)/);
 assert.match(source,/const siegeT=aiSiegeTarget\(siegeLeader,enemyBs,tgt\);A\.stg=\{t:S\.t,tg:tgt,siegeT\}/);
 assert.match(source,/\['ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)&&A\.stg\.siegeT&&A\.stg\.siegeT\.hp>0\?A\.stg\.siegeT:A\.stg\.tg/);
});

test('only healthy present non-retreating wave members participate in staged release',()=>{
 assert.match(source,/\(A\.wu\|\|\[\]\)\.filter\(u=>u\.hp>0&&!u\.ld&&u\.k!=='mon'&&!u\.retreating/);
 assert.match(source,/A\.wu=\(A\.wu\|\|\[\]\)\.filter\(u=>u\.hp>0&&!u\.ld&&!u\.retreating/);
});
