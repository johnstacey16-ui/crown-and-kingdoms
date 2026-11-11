import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../js/ai-defence.js',import.meta.url),'utf8');
function fixture({civ=42,paths=true,orders=['i','i'],at=100}={}){
 const W=64,H=64,el=new Uint8Array(W*H),g=new Uint8Array(W*H),wt=new Uint8Array(W*H);
 const nd=new Array(W*H).fill(null);
 for(let y=19;y<=23;y++)for(let x=19;x<=23;x++)el[y*W+x]=1;
 const soldiers=orders.map((o,i)=>({k:'mil',t:1,x:14+i,y:15,hp:40,o,p:[],ld:null,retreating:false}));
 const S={teamN:2,civ:[0,civ],t:at,el,g,wt,nd,us:soldiers};
 const A={on:0,stg:null,georgianRidgeAt:0},tc={k:'tc',t:1,x:13,y:13,s:3,done:true,hp:900};
 let probes=0,draws=0;
 const context=vm.createContext({S,W,H,vm:0,cmp:null,U:{mil:{dmg:4}},
   path:(u,goal)=>{probes++;return paths?[[goal.x,goal.y]]:null},
   gp:(x,y,r)=>({x,y,r})});
 vm.runInContext(source+'\nglobalThis.postRidge=aiGeorgianRidgeDefence;',context);
 return {S,A,tc,soldiers,context,post:(raiders=[])=>context.postRidge(1,A,soldiers,tc,raiders),
  get probes(){return probes},get draws(){return draws}};
}
test('Georgian reserves occupy nearby traversable ridges using ordinary unit movement',()=>{
 const h=fixture();
 assert.equal(h.post(),2);
 for(const u of h.soldiers){
  assert.equal(u.o,'m');assert.equal(u.tg,null);
  assert.equal(u.p.length,1);assert.equal(u.rp,1);
  const [x,y]=u.p[0];assert.equal(h.S.el[Math.floor(y)*64+Math.floor(x)],1);
 }
 assert.notDeepEqual(h.soldiers[0].p[0],h.soldiers[1].p[0]);
 assert.equal(h.S.georgianRidgeAt,undefined);
 assert.equal(h.A.georgianRidgeAt,124);
});
test('Unresearched foreign armies and invalid high-ground grids remain unchanged',()=>{
 const foreign=fixture({civ:0});
 assert.equal(foreign.post(),0);assert.equal(foreign.probes,0);
 assert.equal(foreign.soldiers[0].o,'i');
 const empty=fixture();empty.S.el.fill(0);
 assert.equal(empty.post(),0);assert.equal(empty.probes,0);
 const blocked=fixture();
 for(let y=19;y<=23;y++)for(let x=19;x<=23;x++)blocked.S.g[y*64+x]=1;
 assert.equal(blocked.post(),0);assert.equal(blocked.probes,0);
});
test('Active siege, guard, combat, transport and disabled units are never stolen',()=>{
 const h=fixture({orders:['a','G']});
 assert.equal(h.post(),0);
 assert.deepEqual(h.soldiers.map(u=>u.o),['a','G']);
 const other=fixture({orders:['i','i']});
 other.soldiers[0].ld={};other.soldiers[1].retreating=true;
 assert.equal(other.post(),0);
 const dead=fixture();dead.soldiers[0].hp=0;dead.soldiers[1].k='ram';
 assert.equal(dead.post(),0);
});
test('Raids, active attack waves, King-of-the-Hill and campaigns disable idle ridge orders',()=>{
 const raid=fixture();
 assert.equal(raid.post([{x:17,y:15,hp:40}]),0);assert.equal(raid.probes,0);
 const wave=fixture();wave.A.on=1;
 assert.equal(wave.post(),0);
 const stage=fixture();stage.A.stg={t:100};
 assert.equal(stage.post(),0);
 const king=fixture();king.context.vm=5;
 assert.equal(king.post(),0);
 const campaign=fixture();campaign.context.cmp={i:0};
 assert.equal(campaign.post(),0);
});
test('Cooldown, bounded probe budget and blocked path leave reserves intact',()=>{
 const h=fixture({paths:false});
 assert.equal(h.post(),0);
 assert.ok(h.probes>0&&h.probes<=16);
 const checked=h.probes;
 h.S.t=110;assert.equal(h.post(),0);assert.equal(h.probes,checked);
 h.S.t=125;assert.equal(h.post(),0);assert.ok(h.probes<=checked+16);
 assert.deepEqual(h.soldiers.map(u=>u.o),['i','i']);
});
test('Ridge staging does not consume the shared deterministic map RNG stream',()=>{
 const h=fixture();let draws=0;h.S.r=()=>{draws++;return 0.5};
 h.post();assert.equal(draws,0);
});
test('Current-build save and load preserve Georgian staging cooldown and orders',()=>{
 const {source:gameSource,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(gameSource+'\nglobalThis.check=code=>eval(code);',sandbox);
 const run=sandbox.check;
 run("seedOv=110126;msz=0;kingdoms=2;startAge=3;startArmy=0;start();S.ai[1].georgianRidgeAt=321");
 assert.equal(run("saveG(false,'ridge-ai-state')"),true);
 run("S.ai[1].georgianRidgeAt=10");
 assert.equal(run("loadG(false,'ridge-ai-state')"),true);
 assert.equal(run("S.ai[1].georgianRidgeAt"),321);
});
test('Multiplayer checkpoint detects an otherwise invisible ridge-cooldown divergence',()=>{
 const {source:gameSource,sandbox}=headlessGame();vm.createContext(sandbox);
 const sync=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
 vm.runInContext(gameSource+'\n'+sync+'\nglobalThis.check=code=>eval(code);',sandbox);
 const run=sandbox.check;
 run("seedOv=110126;msz=0;kingdoms=2;startAge=2;startArmy=0;start()");
 const first=run("CK_SIM_SYNC.worldCheckpoint(S,0).hash");
 run("S.ai[1].georgianRidgeAt=321");
 assert.notEqual(run("CK_SIM_SYNC.worldCheckpoint(S,0).hash"),first);
});
