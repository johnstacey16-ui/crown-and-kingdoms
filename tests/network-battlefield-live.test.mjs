import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {pair} from './helpers/authenticated-game.mjs';

async function battlefieldPair(t,terminal=false,shelter=false,formation=false,ballistics=false,conversion=false){
 const p=await pair(t);p.hostGame.testPreviewDefaults();
 const hp=p.hostGame.CK_AUTH_LOBBY.preparation(),gp=p.guestGame.CK_AUTH_LOBBY.preparation();
 const stage=`
  snd=0;S.nodes=S.nodes.filter(n=>!(n.x>=18&&n.x<42&&n.y>=18&&n.y<42));
  for(let y=18;y<42;y++)for(let x=18;x<42;x++){const i=y*W+x;S.g[i]=S.gt[i]=S.wt[i]=0;S.nd[i]=null;S.ex[i]=1;}
  S.us=[];S.age=[1,1];S.res[0]={f:2000,w:2000,g:2000,s:2000};S.res[1]={f:2000,w:2000,g:2000,s:2000};
  B.bar.bt=.1;U.vil.sp=30;U.mil.t=.1;TE.man.t=.1;
  const worker=addU(0,'vil',21.5,21.5),guestWorker=addU(1,'vil',30.5,21.5);
  globalThis.fixtureWorker=guestWorker.netId;
  if(${formation}){
   globalThis.fixtureRanks=[[addU(0,'mil',22.5,27.5),addU(0,'mil',24.5,27.5)],
    [addU(1,'mil',32.5,27.5),addU(1,'mil',34.5,27.5)]];
   fixtureRanks.flat().forEach(u=>u.st=4);
  }
  if(${conversion}){
   // Saracens have Atonement (tech ID 319) in DE build 185872.
   // Set the reference-eligible civilization on both deterministic peers.
   S.civ[1]=8;
   globalThis.fixtureMonk=addU(1,'mon',27.5,24.5);fixtureMonk.st=2;
   globalThis.fixtureConvertTarget=addU(0,'mon',24.5,24.5);fixtureConvertTarget.st=4;
   globalThis.fixtureMonastery=addB(1,'monastery',33,25,true);TE.atonement.t=.1;S.age[1]=2;
  }
  if(${ballistics}){
   globalThis.fixtureBow=addU(1,'arc',25.5,24.5);fixtureBow.st=2;
   globalThis.fixtureMovingTarget=addU(0,'scout',23.5,24.5);fixtureMovingTarget.st=4;fixtureMovingTarget.hp=200;
   globalThis.fixtureUniversity=addB(1,'univ',33,25,true);TE.ballistics.t=.1;S.age[1]=2;
  }
  if(!${terminal}){addB(1,'lumber',27,26,true);const resource=addN('w',32,22,100,0);globalThis.fixtureResource=resource.netId;guestWorker.car=9.99;guestWorker.ct='w';}
  if(${shelter}){
   for(let y=30;y<42;y++)for(let x=18;x<42;x++)S.wt[y*W+x]=1;
   const home=addB(1,'tc',30,25,true),house=addB(1,'house',35,22,true);
   house.hp=house.mh-1;
   const passenger=addU(1,'mil',29.5,24.5);passenger.st=4;U.mil.sp=30;
   const ship=addU(1,'trn',31.5,30.5);U.trn.sp=30;
   globalThis.fixturePassenger=passenger.netId;globalThis.fixtureShelter=home.netId;
   globalThis.fixtureHouse=house.netId;globalThis.fixtureShip=ship.netId;
  }
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

test('both humans recall local LB groups and reform Line/Split through HTTP without optimistic movement or desync',async t=>{
 const p=await battlefieldPair(t,false,false,true);
 const maps=[p.hostGame,p.guestGame].map((game,team)=>{
  const canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
  const map=game.CK_UNIT_MAP.create({canvas,description:{textContent:''},submit:o=>(team?p.guestLive:p.hostLive).submit(o),leave(){}});
  game.testRefreshMap(map,team);
  const units=p.eval(game,'fixtureRanks['+team+'].map(u=>({x:u.x,y:u.y,id:u.netId}))');
  map.choose(units[0]);map.choose(units[1],true);
  const before=game.testHash();map.control({}, {}, [0,0,0,-1],.1);const cameraZoom=map.viewport().zoom;
  map.control({4:true},{4:true},[0,-1]);map.control({2:true},{4:true,2:true},[0,-1]);map.control({},{});
  map.control({1:true});assert.equal(map.selection().length,0);
  map.control({4:true},{4:true},[0,-1]);map.control({},{});
  assert.deepEqual(Array.from(map.selection()),Array.from(units,u=>u.id));
  assert.equal(game.testHash(),before,'assignment and recall never mutate the simulation');
  map.control({4:true},{4:true},[0,-1]);map.control({3:true},{4:true,3:true},[0,-1]);map.control({},{});
  assert.equal(map.viewport().zoom,cameraZoom);assert.equal(game.testHash(),before,'group camera focus preserves zoom and stays local');
  return map;
 });
 for(const value of ['split','line']){
  const before=p.hostGame.testHash();
  maps.forEach((map,team)=>{
   [p.hostGame,p.guestGame][team].testRefreshMap(map,team);
   map.control({3:true},{3:true});map.control({},{});
  });
  assert.equal(p.hostGame.testHash(),before);assert.equal(p.guestGame.testHash(),before);
  assert.equal(p.hostLive.snapshot().commandPending,true);assert.equal(p.guestLive.snapshot().commandPending,true);
  for(let i=0;i<12;i++)await p.cycle();
  assert.equal(p.hostLive.snapshot().lastResult.ok,true);assert.equal(p.guestLive.snapshot().lastResult.ok,true);
  for(const game of [p.hostGame,p.guestGame])assert.equal(p.eval(game,`fixtureRanks.flat().every(u=>u.netFormation==='${value}')`),true);
 }
});

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

test('real HTTP guest UI garrisons, unloads, repairs and lands transport passengers with matching production checkpoints',async t=>{
 const p=await battlefieldPair(t,false,true),game=p.guestGame;
 const canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
 const description={textContent:''},map=game.CK_UNIT_MAP.create({canvas,description,submit:o=>p.guestLive.submit(o),leave(){}});
 const get=code=>p.eval(game,code);
 const refresh=()=>game.testRefreshMap(map,1);
 const wheel=type=>{
  const unit=get('CK_GAME_COMMANDS.lookup('+JSON.stringify(map.selected())+')');
  const items=unit.q?game.CK_GAME_COMMANDS.buildingOptions(get('S'),1,unit):game.CK_GAME_COMMANDS.unitOptions(get('S'),1,unit);
  const index=items.findIndex(o=>o.type===type);assert.ok(index>=0,type+' available');
  // Villager economic construction entries precede the unit action entries.
  const count=unit.k==='vil'?items.length+11:items.length,sector=unit.k==='vil'?index+11:index;
  const angle=sector*Math.PI*2/count;
  map.control({7:true},{7:true});map.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);
  map.control({0:true},{7:true,0:true});map.control({},{});
 };
 const settle=async(condition,limit=90)=>{
  for(let i=0;i<limit;i++){
   await p.cycle();
   if(!p.guestLive.snapshot().commandPending&&get(condition)){
    assert.equal(p.guestLive.snapshot().lastResult.ok,true);
    refresh();return;
   }
  }
  assert.fail('Action did not complete within '+limit+' synchronized frames: '+condition);
 };
 refresh();map.choose({x:29.5,y:24.5});const before=get('CK_SIM_SYNC.worldCheckpoint(S,1).hash');
 wheel('garrison');assert.equal(p.guestLive.snapshot().commandPending,false);
 refresh();map.choose({x:31,y:26});
 assert.equal(get('CK_SIM_SYNC.worldCheckpoint(S,1).hash'),before,'selection and submission do not board optimistically');
 await settle('CK_GAME_COMMANDS.lookup(fixturePassenger).ld?.netId===fixtureShelter');
 assert.equal(get('CK_GAME_COMMANDS.lookup(fixturePassenger).ld?.netId'),game.fixtureShelter);
 assert.equal(map.selection().includes(game.fixturePassenger),false);
 map.choose({x:31,y:26});wheel('unload');await settle('CK_GAME_COMMANDS.lookup(fixturePassenger).ld===null');
 assert.equal(get('CK_GAME_COMMANDS.lookup(fixturePassenger).ld'),null);
 const worker=game.testUnit(1);map.choose({x:worker.x,y:worker.y});wheel('repair');map.choose({x:36,y:23});
 await settle('CK_GAME_COMMANDS.lookup(fixtureHouse).hp===CK_GAME_COMMANDS.lookup(fixtureHouse).mh');assert.equal(get('CK_GAME_COMMANDS.lookup(fixtureHouse).hp===CK_GAME_COMMANDS.lookup(fixtureHouse).mh'),true);
 const pos=get('({x:CK_GAME_COMMANDS.lookup(fixturePassenger).x,y:CK_GAME_COMMANDS.lookup(fixturePassenger).y})');
 map.choose(pos);wheel('garrison');map.choose({x:31.5,y:30.5});
 await settle('CK_GAME_COMMANDS.lookup(fixturePassenger).ld?.netId===fixtureShip');assert.equal(get('CK_GAME_COMMANDS.lookup(fixturePassenger).ld?.netId'),game.fixtureShip);
 map.choose({x:31.5,y:30.5});wheel('disembark');map.choose({x:36.5,y:29.5});
 await settle('CK_GAME_COMMANDS.lookup(fixturePassenger).ld===null&&CK_GAME_COMMANDS.lookup(fixtureShip).cg.length===0');
 assert.equal(get('CK_GAME_COMMANDS.lookup(fixturePassenger).ld'),null);
 assert.equal(get('CK_GAME_COMMANDS.lookup(fixtureShip).cg.length'),0);
 assert.equal(get('S.wt[(CK_GAME_COMMANDS.lookup(fixturePassenger).y|0)*W+(CK_GAME_COMMANDS.lookup(fixturePassenger).x|0)]'),0);
 assert.equal(p.eval(p.hostGame,'CK_GAME_COMMANDS.lookup(fixtureShip).cg.length'),0);
});



test('both humans execute RT Patrol and Attack Move over authenticated HTTP with matching frame hashes',async t=>{
 const p=await battlefieldPair(t,false,false,true);
 for(const [game,live,team,type] of [[p.hostGame,p.hostLive,0,'patrol'],[p.guestGame,p.guestLive,1,'attack-move']]){
  const orders=[],description={textContent:''};
  const canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
  const map=game.CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return live.submit(order)},leave(){}});
  const unit=p.eval(game,`fixtureRanks[${team}][0]`);
  game.testRefreshMap(map,team);map.choose({x:unit.x,y:unit.y});
  map.control({7:true},{7:true});
  const options=game.CK_GAME_COMMANDS.unitOptions(p.eval(game,'S'),team,unit),index=options.findIndex(o=>o.type===type),angle=index*Math.PI*2/options.length;
  map.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true,0:true});map.control({},{});
  assert.equal(orders.length,0,'menu selection is local');
  const before=p.eval(game,`fixtureRanks[${team}][0].x`);
  map.choose({x:unit.x+3,y:unit.y+2});assert.equal(orders.length,1);assert.equal(orders[0].type,type);
  assert.equal(p.eval(game,`fixtureRanks[${team}][0].x`),before,'waits for the host frame');
  for(let i=0;i<12;i++)await p.cycle();
  assert.equal(live.snapshot().lastResult.ok,true);
  for(const replica of [p.hostGame,p.guestGame]){
   assert.equal(p.eval(replica,`fixtureRanks[${team}][0].pt.once`),type==='attack-move');
   assert.notEqual(p.eval(replica,`fixtureRanks[${team}][0].x`),before,'production movement executes');
  }
 }
});


test('authenticated Ballistics research and moving-target fire replay fixed aims identically over HTTP',async t=>{
 const p=await battlefieldPair(t,false,false,false,true);
 assert.equal(p.guestLive.submit({type:'research',entities:[p.guestGame.fixtureUniversity.netId],value:'ballistics'}).ok,true);
 for(let i=0;i<8;i++)await p.cycle();
 assert.equal(p.eval(p.hostGame,'S.tech[1].ballistics'),1);assert.equal(p.eval(p.guestGame,'S.tech[1].ballistics'),1);
 const targetId=p.hostGame.fixtureMovingTarget.netId,bowId=p.guestGame.fixtureBow.netId;
 assert.equal(p.hostLive.submit({type:'move',entities:[targetId],point:{x:23.5,y:20.5}}).ok,true);
 for(let i=0;i<4;i++)await p.cycle();
 assert.equal(p.guestLive.submit({type:'attack',entities:[bowId],target:targetId}).ok,true);
 let shot=false,damage=false;
 for(let i=0;i<40;i++){
  await p.cycle();
  if(p.eval(p.hostGame,'S.pj.some(p=>Number.isFinite(p.tx)&&Number.isFinite(p.ty)&&p.a.t===1)'))shot=true;
  if(p.eval(p.hostGame,'fixtureMovingTarget.hp<200'))damage=true;
 }
 if(!shot&&!damage){
  const state=p.eval(p.hostGame,
   "JSON.stringify({frame:S.vt,archer:{x:fixtureBow.x,y:fixtureBow.y,order:fixtureBow.o,stance:fixtureBow.st,cooldown:fixtureBow.cd,target:fixtureBow.tg?.netId,range:attackRange(fixtureBow),route:fixtureBow.p},target:{x:fixtureMovingTarget.x,y:fixtureMovingTarget.y,hp:fixtureMovingTarget.hp,order:fixtureMovingTarget.o,route:fixtureMovingTarget.p},distance:Math.hypot(fixtureBow.x-fixtureMovingTarget.x,fixtureBow.y-fixtureMovingTarget.y),projectiles:S.pj.length,ballistics:S.tech[1].ballistics})");
  console.log('de-ballistics-network-debug: '+JSON.stringify({shot,damage,state:JSON.parse(state)}));
 }
 // A short-lived projectile may launch, hit and disappear between HTTP
 // snapshots. A real ranged hit is stronger proof than sampling it in flight;
 // per-frame host/guest hashes above still enforce deterministic replay.
 assert.ok(shot||damage,'a ranged projectile must be observed in flight or land on the target');
 assert.equal(damage,true,'Ballistics must deal actual damage to the moving target');
});


test('authenticated Atonement and monk conversion revoke old ownership with matching HTTP replay',async t=>{
 const p=await battlefieldPair(t,false,false,false,false,true);
 const target=p.hostGame.fixtureConvertTarget.netId,monk=p.guestGame.fixtureMonk.netId;
 assert.equal(p.guestLive.submit({type:'research',entities:[p.guestGame.fixtureMonastery.netId],value:'atonement'}).ok,true);
 for(let i=0;i<8;i++)await p.cycle();
 assert.equal(p.eval(p.hostGame,'S.tech[1].atonement'),1);
 assert.equal(p.guestLive.submit({type:'convert',entities:[monk],target}).ok,true);
 let progress=false;
 for(let i=0;i<340&&p.eval(p.hostGame,'fixtureConvertTarget.t')===0;i++){
  await p.cycle();if(p.eval(p.hostGame,'fixtureMonk.cv>0'))progress=true;
 }
 assert.equal(progress,true);assert.equal(p.eval(p.hostGame,'fixtureConvertTarget.t'),1);assert.equal(p.eval(p.guestGame,'fixtureConvertTarget.t'),1);
 assert.ok(p.eval(p.hostGame,'fixtureMonk.faith')<1,'successful caster must recharge');
 const oldOwnerOrder={type:'move',entities:[target],point:{x:25,y:25}};
 for(const game of [p.hostGame,p.guestGame]){
  const before=game.testHash();game.oldOwnerOrder=oldOwnerOrder;
  assert.equal(p.eval(game,'CK_GAME_COMMANDS.execute(oldOwnerOrder,0,1)'),false,'former owner cannot command the converted monk');
  assert.equal(game.testHash(),before);
 }
 await p.cycle();

});
