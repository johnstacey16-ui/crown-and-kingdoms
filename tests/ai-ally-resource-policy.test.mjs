import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const policy=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const begin=policy.indexOf('function aiShareResources(t,A,R){');
assert.ok(begin>=0,'the policy module must own allied resource sharing');
assert.doesNotMatch(ai,/function aiShareResources\(/);
assert.match(ai,/aiShareResources\(t,A,R\)/);
const shareSource=policy.slice(begin);
function fixture({ally=true,alive=true,time=100,food=1400,wood=1200}={}){
 const sender={f:food,w:wood,g:900,s:550};
 const receiver={f:0,w:250,g:250,s:250};
 const S={t:time,teamN:3,bs:alive?[{t:2,hp:100}]:[],us:[],
  res:[{f:0,w:0,g:0,s:0},sender,receiver]};
 const A={};
 const context=vm.createContext({S,diplomacyRelation:(a,b)=>a===1&&b===2&&ally?'ally':'neutral'});
 const share=vm.runInContext(shareSource+'\n;aiShareResources;',context);
 return {S,A,sender,receiver,share:()=>share(1,A,sender)};
}
test('only live allied kingdoms can receive a capped, balanced AI resource transfer',()=>{
 const h=fixture();
 const total=h.sender.f+h.receiver.f;
 h.share();
 assert.equal(h.receiver.f,200);
 assert.equal(h.sender.f,1200);
 assert.equal(h.sender.f+h.receiver.f,total,'resource creation and loss are forbidden');
 assert.equal(h.A.lastTributeAt,100);
 assert.equal(h.receiver.w,250,'only one transfer is issued per decision');
 for(const x of [fixture({ally:false}),fixture({alive:false})]){
  const before=JSON.stringify(x.S.res);
  x.share();
  assert.equal(JSON.stringify(x.S.res),before);
  assert.equal(x.A.lastTributeAt,undefined);
 }
});
test('tribute respects a ninety-second cooldown without decrementing a resource',()=>{
 const h=fixture();
 h.share();
 const after=JSON.stringify(h.S.res);
 h.S.t=189;
 h.share();
 assert.equal(JSON.stringify(h.S.res),after);
 assert.equal(h.A.lastTributeAt,100);
 h.S.t=190;
 h.receiver.w=0;
 h.share();
 assert.equal(h.A.lastTributeAt,190);
 assert.equal(h.receiver.w,200,'the next transfer occurs exactly on its due tick');
});
test('AI cannot send food it needs for the reserve budget',()=>{
 const h=fixture({food:1000,wood:750});
 const before=JSON.stringify(h.S.res);
 h.share();
 assert.equal(JSON.stringify(h.S.res),before);
 assert.equal(h.A.lastTributeAt,undefined);
});
test('invalid safe-integer budgets never mutate ally or AI resources',()=>{
 const h=fixture({food:Number.MAX_SAFE_INTEGER+1,wood:Number.MAX_SAFE_INTEGER+1});
 const before=JSON.stringify(h.S.res);
 h.share();
 assert.equal(JSON.stringify(h.S.res),before);
 assert.equal(h.A.lastTributeAt,undefined);
});
test('the live policy preserves its resource priority and neutral default',()=>{
 assert.match(policy,/const reserves=\{f:900,w:800,g:650,s:500\}/);
 assert.match(policy,/const needs=\{f:250,w:250,g:200,s:150\}/);
 assert.match(policy,/Number\.isSafeInteger\(R\[transfer\.k\]\)/);
 assert.match(policy,/diplomacyRelation\(t,transfer\.ally\)==='ally'/);
});
