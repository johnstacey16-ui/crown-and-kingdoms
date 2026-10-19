import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const start=ai.indexOf('function aiSiegeTarget(');
const end=ai.indexOf('\nfunction aiAvailableBuilder(',start);
assert.ok(start>=0&&end>start,'siege target decision policy must remain defined');
const source=ai.slice(start,end);

function policy(allowed=()=>true) {
 const sandbox={
  isHostile:(a,b)=>a!==b,
  goalNear:(b)=>b,
  path:(_u,b)=>allowed(b)?[[b.x,b.y]]:null
 };
 return vm.runInNewContext(source+'\n;aiSiegeTarget;',sandbox);
}
const building=(k,x,t=0)=>({k,x,y:3,s:3,t,hp:400,done:true});

test('AI siege leader targets reachable castles before towers, town centres and the fallback',()=>{
 const choose=policy(),leader={t:1,x:2,y:2};
 const tc=building('tc',5),tower=building('tower',7),castle=building('castle',40);
 assert.equal(choose(leader,[tc,tower,castle],tc),castle);
 assert.equal(choose(leader,[tc,tower],tc),tower);
 assert.equal(choose(leader,[tc],tower),tc);
});

test('AI siege ignores destroyed, unfinished, friendly and unreachable fortifications',()=>{
 const leader={t:1,x:2,y:2},fallback=building('tc',55);
 const friendly=building('castle',5,1),destroyed={...building('castle',8),hp:0},
  buildingSite={...building('castle',10),done:false};
 const blocked=building('castle',11),reachable=building('tower',25);
 const choose=policy(b=>b!==blocked);
 assert.equal(choose(leader,[friendly,destroyed,buildingSite,blocked,reachable],fallback),reachable);
 assert.equal(choose(leader,[friendly,destroyed,buildingSite,blocked],fallback),fallback);
 assert.equal(choose(null,[reachable],fallback),fallback);
});

test('staged AI waves assign their siege target to siege units',()=>{
 assert.match(ai,/const siegeLeader=sol\.find\(u=>\['ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)\)/);
 assert.match(ai,/const siegeT=aiSiegeTarget\(siegeLeader,enemyBs,tgt\);A\.stg=\{t:S\.t,tg:tgt,siegeT\}/);
 assert.match(ai,/\['ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)&&A\.stg\.siegeT&&A\.stg\.siegeT\.hp>0\?A\.stg\.siegeT:A\.stg\.tg/);
});

test('only healthy present non-retreating wave members participate in staged release',()=>{
 assert.match(ai,/\(A\.wu\|\|\[\]\)\.filter\(u=>u\.hp>0&&!u\.ld&&u\.k!=='mon'&&!u\.retreating/);
 assert.match(ai,/A\.wu=\(A\.wu\|\|\[\]\)\.filter\(u=>u\.hp>0&&!u\.ld&&!u\.retreating/);
});
