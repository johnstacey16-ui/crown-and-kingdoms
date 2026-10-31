import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const ALLOWED=new Set([2,3,4,8,9,13,22,23]);
function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 const network=['network-sync','network-commands'].map(k=>
  readFileSync(new URL('../js/'+k+'.js',import.meta.url),'utf8')).join('\n');
 const setup=[
  "seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;startArmy=0;start();snd=0;",
  "S.civ=[8,0];S.us=[];S.bs=[];S.nodes=[];S.rel=[];",
  "S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);",
  "S.age=[3,3];S.tech=[{},{}];S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));",
  "globalThis.stables=[addB(0,'stable',16,16,true),addB(1,'stable',28,16,true)];",
  "globalThis.runRegion=code=>eval(code);"
 ].join('\n');
 vm.runInContext(source+'\n'+network+'\n'+setup,sandbox,{timeout:15000});
 return code=>sandbox.runRegion(code);
}

test('regional Camel Stable training enforces all 26 civilization IDs without billing rejection',()=>{
 const run=fixture();
 for(let i=0;i<26;i++){
  run("S.civ[0]="+i+";stables[0].q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}");
  const expected=ALLOWED.has(i);
  assert.equal(run("trOf(stables[0]).includes('camel')"),expected,'civilization '+i);
  assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,stables[0]).some(x=>x.type==='train'&&x.value==='camel')"),expected);
  const before=run('JSON.stringify(S.res[0])');
  assert.equal(run("train(stables[0],'camel')"),expected,'direct training civilization '+i);
  if(expected)assert.notEqual(run('JSON.stringify(S.res[0])'),before);
  else{
   assert.equal(run('JSON.stringify(S.res[0])'),before);
   assert.equal(run('stables[0].q.length'),0);
  }
 }
});

test('authenticated host refuses out-of-region Camel commands but accepts eligible host',()=>{
 const run=fixture();
 run("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 const packet=(team,seq,id)=>({v:run('CK_SIM_SYNC.VERSION'),sid:team?'guest':'host',team,seq,frame:6,
  order:{type:'train',entities:[id],value:'camel'}});
 const hostId=run('stables[0].netId'),guestId=run('stables[1].netId');
 const before=JSON.parse(run('JSON.stringify(S.res)'));
 for(const p of [packet(0,1,hostId),packet(1,1,guestId)]){
  assert.equal(run('host.receive('+JSON.stringify(p)+','+JSON.stringify(p.sid)+',2).ok'),true);
 }
 const outcomes=JSON.parse(run('JSON.stringify(host.applyFrame(6))'));
 assert.equal(outcomes.length,2);
 assert.equal(outcomes.filter(x=>x.ok).length,1);
 assert.equal(run("stables[0].q[0].k"),'camel');
 assert.equal(run('stables[1].q.length'),0);
 const after=JSON.parse(run('JSON.stringify(S.res)'));
 assert.notDeepEqual(after[0],before[0]);
 assert.deepEqual(after[1],before[1]);
});

test('historical saved Camel queues survive eligibility changes; new disallowed queues do not',()=>{
 const run=fixture();
 run("S.civ=[0,8];stables[0].q=[{k:'camel',t:12}];slot=0");
 assert.equal(run('saveG()'),true);
 assert.equal(run('loadG()'),true);
 assert.equal(run("S.bs.some(b=>b.t===0&&b.k==='stable'&&b.q.some(q=>q.k==='camel'))"),true);
 assert.equal(run("train(S.bs.find(b=>b.t===0&&b.k==='stable'),'camel')"),false);
});
