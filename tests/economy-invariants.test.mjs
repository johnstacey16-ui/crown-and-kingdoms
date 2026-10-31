/* Authoritative economy invariants under real command, price and simulation rules.
 * This suite neither modifies production balance nor assumes resources are conserved
 * when gathering or purchasing units. It tests non-negative, finite ledgers. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=0;startRes=3;startArmy=0;start();
  globalThis.runEconomy=code=>eval(code);
 `,sandbox,{timeout:15000,filename:'production-economy-invariants.js'});
 return sandbox.runEconomy;
}

test('unaffordable villager training cannot spend resources or enqueue free units',()=>{
 const run=game();
 run("globalThis.tc=S.bs.find(b=>b.k==='tc'&&b.t===0&&b.done);S.res[0]={f:0,w:0,g:0,s:0}");
 assert.equal(run('!!tc'),true);
 const queued=run('tc.q.length');
 assert.equal(run("train(tc,'vil')"),false);
 assert.equal(run('S.res[0].f'),0);
 assert.equal(run('tc.q.length'),queued);
 run('S.res[0].f=U.vil.cost.f');
 assert.equal(run("train(tc,'vil')"),true,'exactly affordable order trains one villager');
 assert.equal(run('S.res[0].f'),0,'unit cost charged once');
 assert.equal(run('tc.q.length'),queued+1);
 assert.equal(run("train(tc,'vil')"),false,'second order cannot borrow food');
 assert.equal(run('tc.q.length'),queued+1);
});

test('market buy and sell adjust prices and resources without creating deficits',()=>{
 const run=game();
 run('S.px[0]={f:100,w:100,s:100};S.res[0]={f:99,w:0,g:0,s:0}');
 assert.equal(run("trade(0,'f','sell')"),false);
 assert.equal(run('S.res[0].f'),99);
 run('S.res[0].f=100');
 assert.equal(run("trade(0,'f','sell')"),true);
 assert.equal(run('S.res[0].f'),0);
 assert.equal(run('S.res[0].g'),70);
 assert.equal(run('S.px[0].f'),97);
 assert.equal(run("trade(0,'f','buy')"),false,'insufficient gold must not place a debt');
 assert.equal(run('S.res[0].g'),70);
 run('S.res[0].g=126');
 assert.equal(run("trade(0,'f','buy')"),true);
 assert.equal(run('S.res[0].g'),0);
 assert.equal(run('S.res[0].f'),100);
 assert.equal(run('S.px[0].f'),100);
});

test('both kingdoms keep finite non-negative ledgers and resource deposits over live AI ticks',()=>{
 const run=game();
 for(let frame=0;frame<150;frame++){
  run('step(DT)');
  if(frame%15!==0&&frame!==149)continue;
  const audit=run("(()=>({time:S.t,resources:S.res.map(r=>['f','w','g','s'].map(k=>r[k])),nodes:S.nodes.map(n=>n.amt)}))()");
  assert.ok(Number.isFinite(audit.time),'simulation time must stay finite at tick '+frame);
  for(const [team,values] of audit.resources.entries())
   for(const amount of values)
    assert.ok(Number.isFinite(amount)&&amount>=0,'invalid treasury at team '+team+' tick '+frame+': '+amount);
  for(const amount of audit.nodes)
   assert.ok(Number.isFinite(amount)&&amount>=0,'resource node overdrawn at tick '+frame);
 }
});
