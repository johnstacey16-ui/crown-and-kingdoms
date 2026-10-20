import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {pair} from './helpers/authenticated-game.mjs';

async function battlefieldPair(t,terminal=false){
 const p=await pair(t);p.hostGame.testPreviewDefaults();
 const hp=p.hostGame.CK_AUTH_LOBBY.preparation(),gp=p.guestGame.CK_AUTH_LOBBY.preparation();
 const stage=`
  snd=0;S.nodes=S.nodes.filter(n=>!(n.x>=18&&n.x<42&&n.y>=18&&n.y<42));
  for(let y=18;y<42;y++)for(let x=18;x<42;x++){const i=y*W+x;S.g[i]=S.gt[i]=S.wt[i]=0;S.nd[i]=null;S.ex[i]=1;}
  S.us=[];S.age=[1,1];S.res[0]={f:2000,w:2000,g:2000,s:2000};S.res[1]={f:2000,w:2000,g:2000,s:2000};
  B.bar.bt=.1;U.vil.sp=30;U.mil.t=.1;TE.man.t=.1;
  const worker=addU(0,'vil',21.5,21.5),guestWorker=addU(1,'vil',30.5,21.5);
  globalThis.fixtureWorker=guestWorker.netId;
  if(!${terminal}){addB(1,'lumber',27,26,true);const resource=addN('w',32,22,100,0);globalThis.fixtureResource=resource.netId;guestWorker.car=9.99;guestWorker.ct='w';}
  if(${terminal}){
   const tc=S.bs.find(b=>b.t===1&&b.k==='tc');
   for(let y=tc.y;y<tc.y+tc.s;y++)for(let x=tc.x;x<tc.x+tc.s;x++)S.g[y*W+x]=0;
   tc.x=33;tc.y=33;tc.hp=5;for(let y=33;y<36;y++)for(let x=33;x<36;x++)S.g[y*W+x]=1;
   const ram=addU(0,'ram',31.5,34.5);U.ram.sp=3;
   globalThis.fixtureAttacker=ram.netId;globalThis.fixtureTarget=tc.netId;
  }
 `;
 const prep=(game,preparation)=>config=>{preparation.prepare(config);vm.runInContext(stage,game);return game.testHash()};
 const hs=p.hostGame.CK_MATCH_STARTUP.create({transport:p.host,validateConfig:p.hostGame.CK_AUTH_LOBBY.validConfig,prepare:prep(p.hostGame,hp)});
 const gs=p.guestGame.CK_MATCH_STARTUP.create({transport:p.guest,validateConfig:p.guestGame.CK_AUTH_LOBBY.validConfig,prepare:prep(p.guestGame,gp)});
 await hs.begin(p.hostGame.CK_AUTH_LOBBY.settings(123456));
 await gs.pump();await hs.pump();await gs.pump();await hs.pump();
 let time=0;p.hostGame.performance.now=p.guestGame.performance.now=()=>time;
 const hostLive=hp.live(p.host,hs.snapshot()),guestLive=gp.live(p.guest,gs.snapshot());
 t.after(()=>{hostLive.close();guestLive.close();hp.restore();gp.restore()});
 async function cycle(){
  // Stay within the real relay's per-session request budget.
  await new Promise(resolve=>setTimeout(resolve,40));time+=40;
  await hostLive.pump();await guestLive.pump();
  assert.equal(hostLive.snapshot().frame,guestLive.snapshot().frame);
  assert.equal(p.hostGame.testHash(),p.guestGame.testHash(),'production hashes agree on every frame');
 }
 await hostLive.begin();await cycle();await cycle();
 return{...p,hostLive,guestLive,cycle,eval:(game,code)=>vm.runInContext(code,game)};
}

test('real HTTP battlefield UI gathers resources, builds a barracks, trains military and researches through authenticated replay',async t=>{
 const p=await battlefieldPair(t),game=p.guestGame;
 const canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
 const description={textContent:''};
 const map=game.CK_UNIT_MAP.create({canvas,description,submit:o=>p.guestLive.submit(o),leave(){}});
 game.testRefreshMap(map,1);map.choose({x:30.5,y:21.5});
 const initial=game.testHash(),openingWood=p.eval(game,'S.res[1].w');map.choose({x:32.5,y:22.5});
 assert.equal(p.guestLive.snapshot().commandPending,true);assert.equal(game.testHash(),initial);
 for(let i=0;i<18;i++)await p.cycle();
 assert.equal(p.guestLive.snapshot().lastResult.ok,true);assert.ok(p.eval(game,'S.res[1].w')>openingWood,'harvested cargo reaches the real depot');
 game.testRefreshMap(map,1);const worker=game.testUnit(1);map.choose({x:worker.x,y:worker.y});
 const before=game.testHash(),wood=p.eval(game,'S.res[1].w');
 map.control({7:true},{7:true});map.control({3:true},{7:true,3:true});
 map.control({0:true},{7:true,0:true});map.control({},{});map.choose({x:31.5,y:26.5});
 assert.equal(p.guestLive.snapshot().commandPending,true);assert.equal(game.testHash(),before,'blueprint and request do not mutate the world');
 for(let i=0;i<18;i++)await p.cycle();
 assert.equal(p.guestLive.snapshot().lastResult.ok,true);
 const building=p.eval(game,"S.bs.find(b=>b.t===1&&b.k==='bar')");
 assert.ok(building?.done);assert.equal(p.eval(game,'S.res[1].w'),wood-150);
 const military=p.eval(game,"S.us.filter(u=>u.t===1&&u.k==='mil').length");
 game.testRefreshMap(map,1);map.choose({x:building.x+1.5,y:building.y+1.5});
 assert.equal(map.selected(),building.netId);map.control({7:true},{7:true});map.control({0:true},{7:true});
 for(let i=0;i<8;i++)await p.cycle();
 assert.equal(p.guestLive.snapshot().lastResult.ok,true);
 assert.equal(p.eval(game,"S.us.filter(u=>u.t===1&&u.k==='mil').length"),military+1);
 game.testRefreshMap(map,1);map.control({7:true},{7:true});
 const options=game.CK_GAME_COMMANDS.buildingOptions(p.eval(game,'S'),1,building);
 const index=options.findIndex(o=>o.type==='research'&&o.value==='man'),angle=index*Math.PI*2/options.length;
 map.control({}, {7:true}, [Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true});
 for(let i=0;i<8;i++)await p.cycle();
 assert.equal(p.guestLive.snapshot().lastResult.ok,true);assert.equal(p.eval(game,'S.tech[1].man'),1);
 assert.equal(p.eval(p.hostGame,'S.tech[1].man'),1);
});

test('a production combat kill ends both HTTP simulations at the same acknowledged victory frame',async t=>{
 const p=await battlefieldPair(t,true);
 const order={type:'attack',entities:[p.hostGame.fixtureAttacker],target:p.hostGame.fixtureTarget};
 assert.equal(p.hostLive.submit(order).ok,true);
 let confirming=false;
 for(let i=0;i<50&&p.hostLive.snapshot().phase!=='finished';i++){
  await p.cycle();if(p.hostLive.snapshot().phase==='finishing')confirming=true;
 }
 assert.equal(confirming,true,'host waits for the final replay acknowledgment');
 for(const live of [p.hostLive,p.guestLive]){
  assert.equal(live.snapshot().phase,'finished');assert.equal(live.snapshot().failure,'');
  assert.equal(live.snapshot().outcome.winner,0);
  assert.match(live.snapshot().outcome.reason,/Town Centres/);
  assert.equal(live.submit(order).reason,'not-running');
 }
 const frame=p.hostLive.snapshot().frame;
 assert.equal(p.hostLive.snapshot().acknowledgedFrame,frame);
 await p.cycle();await p.cycle();assert.equal(p.hostLive.snapshot().frame,frame);
 assert.equal(p.eval(p.hostGame,"S.bs.some(b=>b.netId===fixtureTarget&&b.hp>0)"),false);
});
