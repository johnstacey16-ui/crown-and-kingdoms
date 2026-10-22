import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n;globalThis.evaluate=code=>eval(code)',sandbox);
 return sandbox.evaluate;
}
test('AoE II base movement, upgrade bonuses and real per-resource continuous gather rates',()=>{
 const run=fixture();run("seedOv=123456;start();mode='title';globalThis.v=addU(0,'vil',20,20)");
 assert.equal(run("U.vil.sp"),.8);
 assert.equal(run("unitSpeed(v)"),.8);
 assert.equal(run("gatherCapacity(v)"),10);
 const rates={w:.39,g:.38,s:.36,berry:.31,farm:.32,hunt:.41,fish:.43};
 for(const [kind,rate] of Object.entries(rates)){
  const n=kind==='berry'?{k:'f'}:kind==='farm'?{k:'f',fm:1}:kind==='hunt'?{k:'f',an:1}:kind==='fish'?{k:'f',fi:1}:{k:kind};
  assert.equal(run('resourceGatherRate('+JSON.stringify(n)+')'),rate,kind);
 }
 run("S.tech[0].wheel=1");
 assert.ok(Math.abs(run("unitSpeed(v)")-.88)<1e-9);
 assert.equal(run("gatherCapacity(v)"),13);
 run("S.tech[0].handcart=1");
 assert.ok(Math.abs(run("unitSpeed(v)")-.96)<1e-9);
 assert.equal(run("gatherCapacity(v)"),20);
});
test('a farm admits one working villager including claimed return trips',()=>{
 const run=fixture();run("seedOv=123456;start();mode='title';globalThis.a=addU(0,'vil',20,20);globalThis.b=addU(0,'vil',20,21);globalThis.f=addN('f',23,20,175,1);f.t=0");
 assert.equal(run("resourceHasWorksite(a,f)"),true);
 run("a.o='g';a.tg=f;a.ct='f'");
 assert.equal(run("resourceHasWorksite(b,f)"),false);
 run("a.ret=1");
 assert.equal(run("resourceHasWorksite(b,f)"),false);
 run("a.o='i';a.tg=null");
 assert.equal(run("resourceHasWorksite(b,f)"),true);
});
test('known resources follow shared explored player tiles, never per-villager private memory',()=>{
 const run=fixture();run("seedOv=123456;start();mode='title';globalThis.a=addU(0,'vil',20,20);globalThis.n=addN('g',22,20,300)");
 assert.equal(run("knownResource(a,n)"),run("!!S.ex[n.y*W+n.x]"));
 run("S.ex[n.y*W+n.x]=1");
 assert.equal(run("knownResource(a,n)"),true);
 run("globalThis.b=addU(0,'vil',20,21)");
 assert.equal(run("knownResource(b,n)"),true);
});
test('full farm retargeting prefers next known free farm rather than waiting',()=>{
 const run=fixture();run("seedOv=123456;start();mode='title';globalThis.a=addU(0,'vil',20,20);globalThis.b=addU(0,'vil',20,21);globalThis.one=addN('f',22,20,175,1);globalThis.two=addN('f',23,20,175,1);one.t=two.t=0;S.ex[one.y*W+one.x]=S.ex[two.y*W+two.x]=1");
 run("a.o='g';a.tg=one;a.ct='f';b.o='g';b.tg=one;b.ct='f';b.p=[]");
 run("upU(b,1/30)");
 assert.equal(run("b.tg===two"),true);
});
