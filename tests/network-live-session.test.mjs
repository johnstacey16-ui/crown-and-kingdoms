import test from 'node:test';
import assert from 'node:assert/strict';
import { pair, attachDOM, eventually } from './helpers/authenticated-game.mjs';

async function livePair(t, defaults = true) {
  const fixture=await pair(t);
  const {host,guest,hostGame,guestGame}=fixture;
  if(defaults)hostGame.testPreviewDefaults();
  const hp=hostGame.CK_AUTH_LOBBY.preparation(),gp=guestGame.CK_AUTH_LOBBY.preparation();
  const hs=hostGame.CK_MATCH_STARTUP.create({transport:host,validateConfig:hostGame.CK_AUTH_LOBBY.validConfig,prepare:hp.prepare});
  const gs=guestGame.CK_MATCH_STARTUP.create({transport:guest,validateConfig:guestGame.CK_AUTH_LOBBY.validConfig,prepare:gp.prepare});
  await hs.begin(hostGame.CK_AUTH_LOBBY.settings(123456));
  await gs.pump();await hs.pump();await gs.pump();await hs.pump();
  let clock=0;
  hostGame.performance.now=guestGame.performance.now=()=>clock;
  let lastFrame;
  const hostTransport={...host,send:async(kind,payload)=>{
    if(kind==='frame')lastFrame=JSON.parse(JSON.stringify(payload));
    return host.send(kind,payload);
  }};
  const hostLive=hp.live(hostTransport,hs.snapshot()),guestLive=gp.live(guest,gs.snapshot());
  t.after(()=>{hostLive.close();guestLive.close();hp.restore();gp.restore();});
  async function cycle() {
    clock+=40;
    await hostLive.pump();await guestLive.pump();
    assert.equal(hostLive.snapshot().frame,guestLive.snapshot().frame);
    assert.equal(hostGame.testHash(),guestGame.testHash());
  }
  return {...fixture,hostLive,guestLive,cycle,lastFrame:()=>lastFrame,elapse:ms=>{clock+=ms;}};
}

test('verified startup hands off to live HTTP clocks with both teams paid orders and no human-team AI', async t=>{
  const p=await livePair(t);
  const hostAi=p.hostGame.testAi(),guestAi=p.guestGame.testAi();
  assert.equal(p.hostLive.snapshot().frame,0);
  await assert.rejects(p.guestLive.begin(),/host/);
  await p.hostLive.begin();
  await p.cycle(); // Guest accepts run, host still waits for run-ready.
  assert.equal(p.hostLive.snapshot().frame,0);
  await p.cycle();
  assert.equal(p.hostLive.snapshot().frame,1);
  const before=[p.hostGame.testTeam(0),p.hostGame.testTeam(1)];
  assert.equal(p.hostLive.submit({type:'train',entities:[before[0].tc],value:'vil'}).ok,true);
  assert.equal(p.guestLive.submit({type:'train',entities:[before[1].tc],value:'vil'}).ok,true);
  assert.equal(p.guestLive.submit({type:'train',entities:[before[1].tc],value:'vil'}).reason,'pending-command');
  for(let i=0;i<20;i++)await p.cycle();
  for(const team of [0,1]){
    assert.equal(p.hostGame.testTeam(team).queue,1);
    assert.ok(p.hostGame.testTeam(team).food<before[team].food,'training paid for by team '+team);
  }
  assert.equal(p.hostLive.snapshot().lastResult.ok,true);
  assert.equal(p.guestLive.snapshot().lastResult.ok,true);
  assert.equal(p.hostGame.testAi(),hostAi);assert.equal(p.guestGame.testAi(),guestAi);
  assert.equal(p.hostGame.testWorld().mode,'multiplayer');
  assert.equal(p.guestGame.testWorld().mode,'multiplayer');
  assert.equal(p.guestLive.submit({type:'cancel',entities:[before[1].tc]}).ok,true);
  for(let i=0;i<8;i++)await p.cycle();
  assert.equal(p.hostGame.testTeam(1).queue,0);
  assert.equal(p.hostGame.testTeam(0).queue,1);
  assert.equal(p.hostGame.testTeam(1).food,before[1].food);
});

test('population-blocked training reports rejection to the guest without charging or desynchronizing', async t=>{
  const p=await livePair(t,false);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const before=p.hostGame.testTeam(1);
  assert.equal(p.guestLive.submit({type:'train',entities:[before.tc],value:'vil'}).ok,true);
  for(let i=0;i<8;i++)await p.cycle();
  assert.equal(p.guestLive.snapshot().lastResult.ok,false);
  assert.equal(p.guestLive.snapshot().lastResult.reason,'rejected-by-simulation');
  assert.equal(p.hostGame.testTeam(1).queue,0);
  assert.equal(p.hostGame.testTeam(1).food,before.food);
});

test('retransmitted frame and duplicate acknowledgments never step either world twice', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const frame=p.lastFrame(),hash=p.hostGame.testHash();
  await p.host.send('frame',frame);
  await p.guestLive.pump();
  assert.equal(p.guestLive.snapshot().frame,1);
  await p.hostLive.pump(); // Original ACK plus duplicate ACK, with no elapsed frame interval.
  assert.equal(p.hostLive.snapshot().phase,'running');
  assert.equal(p.hostLive.snapshot().frame,1);
  assert.equal(p.hostGame.testHash(),hash);assert.equal(p.guestGame.testHash(),hash);
});

test('host and guest move their own villagers over HTTP with identical positions and hashes', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const before=[p.hostGame.testUnit(0),p.guestGame.testUnit(1)];
  for(const [team,session] of [[0,p.hostLive],[1,p.guestLive]]){
    const unit=before[team];
    assert.equal(session.submit({type:'move',entities:[unit.id],point:{x:unit.x+3,y:unit.y+3}}).ok,true);
  }
  for(let i=0;i<20;i++)await p.cycle();
  assert.equal(p.hostLive.snapshot().lastResult.ok,true);
  assert.equal(p.guestLive.snapshot().lastResult.ok,true);
  for(const team of [0,1]){
    const after=p.hostGame.testUnit(team),replica=p.guestGame.testUnit(team);
    assert.ok(Math.hypot(after.x-before[team].x,after.y-before[team].y)>0.1);
    assert.equal(JSON.stringify(after),JSON.stringify(replica));
  }
});

test('guest cannot move an opposing unit and malformed destinations never enter the uplink', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const own=p.guestGame.testUnit(1),enemy=p.hostGame.testUnit(0);
  for(const point of [{x:-1,y:1},{x:NaN,y:1},{x:10000,y:1}]){
    assert.equal(p.guestLive.submit({type:'move',entities:[own.id],point}).ok,false);
  }
  assert.equal(p.guestLive.submit({type:'move',entities:[enemy.id],point:{x:enemy.x+3,y:enemy.y+3}}).ok,true);
  await p.guestLive.pump();
  await assert.rejects(p.hostLive.pump(),/Command rejected/);
  assert.equal(JSON.stringify(p.hostGame.testUnit(0)),JSON.stringify(enemy));
});

test('both players can stop moving villagers over HTTP and remain synchronized',async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  for(const [team,session] of [[0,p.hostLive],[1,p.guestLive]]){
    const u=p.hostGame.testUnit(team);
    assert.equal(session.submit({type:'move',entities:[u.id],point:{x:u.x+3,y:u.y+3}}).ok,true);
  }
  for(let i=0;i<20;i++)await p.cycle();
  for(const [team,session] of [[0,p.hostLive],[1,p.guestLive]]){
    const u=p.hostGame.testUnit(team);assert.equal(u.order,'m');
    assert.equal(session.submit({type:'stop',entities:[u.id]}).ok,true);
    assert.equal(p.hostGame.testUnit(team).order,'m','no optimistic stop');
  }
  for(let i=0;i<10;i++)await p.cycle();
  const stopped=[p.hostGame.testUnit(0),p.hostGame.testUnit(1)];
  assert.equal(p.hostLive.snapshot().lastResult.ok,true);
  assert.equal(p.guestLive.snapshot().lastResult.ok,true);
  for(let i=0;i<10;i++)await p.cycle();
  for(const team of [0,1]){
    assert.equal(stopped[team].order,'i');
    assert.equal(JSON.stringify(p.hostGame.testUnit(team)),JSON.stringify(stopped[team]));
    assert.equal(JSON.stringify(p.guestGame.testUnit(team)),JSON.stringify(stopped[team]));
  }
});

test('guest cannot stop an opposing unit',async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const enemy=p.hostGame.testUnit(0);
  assert.equal(p.guestLive.submit({type:'stop',entities:[enemy.id]}).ok,true);
  await p.guestLive.pump();await assert.rejects(p.hostLive.pump(),/Command rejected/);
  assert.equal(JSON.stringify(p.hostGame.testUnit(0)),JSON.stringify(enemy));
});

test('both town centres accept synchronized rally orders without changing existing unit orders',async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const units=[p.hostGame.testUnit(0),p.hostGame.testUnit(1)];
  const points=[p.hostGame.testRallyPoint(0),p.hostGame.testRallyPoint(1)];
  for(const [team,session] of [[0,p.hostLive],[1,p.guestLive]]){
    assert.equal(session.submit({type:'rally',entities:[p.hostGame.testTeam(team).tc],point:points[team]}).ok,true);
  }
  for(let i=0;i<10;i++)await p.cycle();
  for(const team of [0,1]){
    assert.equal(JSON.stringify(p.hostGame.testRally(team)),JSON.stringify({...points[team],t:null}));
    assert.equal(JSON.stringify(p.hostGame.testRally(team)),JSON.stringify(p.guestGame.testRally(team)));
    assert.equal(p.hostGame.testUnit(team).order,units[team].order);
  }
  assert.equal(p.hostLive.snapshot().lastResult.ok,true);
  assert.equal(p.guestLive.snapshot().lastResult.ok,true);
  // Shorten only the fixture's training duration; production payment, spawning,
  // rally pathfinding and frame execution still use the real game code.
  const population=[p.hostGame.testTeam(0).units,p.hostGame.testTeam(1).units];
  p.hostGame.testFastTraining();p.guestGame.testFastTraining();
  for(const [team,session] of [[0,p.hostLive],[1,p.guestLive]]){
    assert.equal(session.submit({type:'train',entities:[p.hostGame.testTeam(team).tc],value:'vil'}).ok,true);
  }
  for(let i=0;i<14;i++)await p.cycle();
  for(const team of [0,1]){
    assert.equal(p.hostGame.testTeam(team).units,population[team]+1);
    const unit=p.hostGame.testNewestUnit(team);
    assert.equal(unit.order,'m');assert.ok(unit.path.length>0);
    assert.equal(unit.autoWorker,0);
    assert.equal(JSON.stringify(unit),JSON.stringify(p.guestGame.testNewestUnit(team)));
  }
});

test('guest rally cannot modify the opposing town centre',async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const before=JSON.stringify(p.hostGame.testRally(0));
  assert.equal(p.guestLive.submit({type:'rally',entities:[p.hostGame.testTeam(0).tc],point:{x:20,y:22}}).ok,true);
  await p.guestLive.pump();await assert.rejects(p.hostLive.pump(),/Command rejected/);
  assert.equal(JSON.stringify(p.hostGame.testRally(0)),before);
});

test('unreachable rally leaves a newly trained host villager idle instead of retaining automatic gathering',async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const unit=p.hostGame.testUnit(0),tc=p.hostGame.testTeam(0).tc;
  // This seeded world's offset is unreachable from the town-centre spawn.
  assert.equal(p.hostLive.submit({type:'rally',entities:[tc],point:{x:unit.x+5,y:unit.y+5}}).ok,true);
  for(let i=0;i<10;i++)await p.cycle();
  p.hostGame.testFastTraining();p.guestGame.testFastTraining();
  assert.equal(p.hostLive.submit({type:'train',entities:[tc],value:'vil'}).ok,true);
  for(let i=0;i<14;i++)await p.cycle();
  const spawned=p.hostGame.testNewestUnit(0);
  assert.notEqual(spawned.id,unit.id);assert.equal(spawned.order,'i');
  assert.equal(spawned.path.length,0);assert.equal(spawned.autoWorker,0);
  assert.equal(JSON.stringify(spawned),JSON.stringify(p.guestGame.testNewestUnit(0)));
});

test('host cannot step past an unacknowledged frame and timeout terminates the room', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();
  p.elapse(40);await p.hostLive.pump();
  assert.equal(p.hostLive.snapshot().frame,1);assert.equal(p.guestLive.snapshot().frame,0);
  const hash=p.hostGame.testHash();
  for(let i=0;i<4;i++){p.elapse(40);await p.hostLive.pump();}
  assert.equal(p.hostLive.snapshot().frame,1);assert.equal(p.hostGame.testHash(),hash);
  p.elapse(8000);
  await assert.rejects(p.hostLive.pump(),/timed out/);
  assert.equal(p.hostLive.snapshot().phase,'failed');
  assert.equal(p.hostGame.testHash(),hash);
});

test('divergent guest state stops before acknowledging and no more host frames advance', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  p.guestGame.testChangeFood();
  p.elapse(40);await p.hostLive.pump();
  await assert.rejects(p.guestLive.pump(),/hash mismatch/);
  assert.equal(p.guestLive.snapshot().phase,'failed');
  const frame=p.hostLive.snapshot().frame;
  // Revocation is asynchronous; the in-flight frame still blocks host stepping.
  await new Promise(resolve=>setTimeout(resolve,10));
  await assert.rejects(p.hostLive.pump());
  assert.equal(p.hostLive.snapshot().frame,frame);
});

test('unsupported combat orders are unavailable and a guest cannot train in the host kingdom', async t=>{
  const p=await livePair(t);
  await p.hostLive.begin();await p.cycle();await p.cycle();
  assert.equal(p.guestLive.submit({type:'attack',entities:['u1'],target:'b1'}).reason,'unsupported-preview-command');
  const before=p.hostGame.testTeam(0);
  assert.equal(p.guestLive.submit({type:'train',entities:[before.tc],value:'vil'}).ok,true);
  await p.guestLive.pump();
  await assert.rejects(p.hostLive.pump(),/Command rejected/);
  assert.equal(p.hostGame.testTeam(0).queue,0);
  assert.equal(p.hostGame.testTeam(0).food,before.food);
});

test('live driver shares concurrent polls and closing prevents further simulation', async t=>{
  const p=await livePair(t);
  const first=p.hostLive.pump();assert.equal(p.hostLive.pump(),first);await first;
  await p.hostLive.begin();await p.cycle();await p.cycle();
  const frame=p.hostLive.snapshot().frame;
  p.hostLive.close();
  await assert.rejects(p.hostLive.pump(),/ended/);
  assert.equal(p.hostLive.snapshot().frame,frame);
  assert.equal(p.hostLive.snapshot().phase,'closed');
});

test('DOM preview runs after verification and routes the guest training button to team one', async t=>{
  const {host,guest,hostGame,guestGame}=await pair(t);host.close();guest.close();
  hostGame.testPreviewDefaults();
  const hd=attachDOM(hostGame),gd=attachDOM(guestGame);
  hostGame.CK_AUTH_LOBBY.open(()=>{});guestGame.CK_AUTH_LOBBY.open(()=>{});
  assert.equal(gd.button('Stop selected unit').style.display,'none');
  t.after(()=>{hostGame.CK_AUTH_LOBBY.close();guestGame.CK_AUTH_LOBBY.close();});
  hd.button('Create private room').click();await eventually(()=>hd.input().value.length===43);
  gd.input().value=hd.input().value;gd.button('Join room').click();
  await eventually(()=>!hd.button('Verify shared map').disabled);
  for(let i=0;i<20&&hd.button('Run live preview').disabled;i++){
    await hd.button('Verify shared map').click();await new Promise(resolve=>setTimeout(resolve,15));
  }
  await eventually(()=>!hd.button('Run live preview').disabled);
  assert.equal(gd.button('Run live preview').disabled,true);
  for(let i=0;i<20&&gd.button('Train villager').disabled;i++){
    await hd.button('Run live preview').click();await new Promise(resolve=>setTimeout(resolve,15));
  }
  await eventually(()=>!gd.button('Train villager').disabled);
  gd.button('Train villager').click();
  await eventually(()=>hostGame.testTeam(1).queue===1&&guestGame.testTeam(1).queue===1);
  assert.equal(hostGame.testTeam(0).queue,0);assert.equal(guestGame.testTeam(0).queue,0);
  assert.ok(hostGame.testWorld().time>0);
  assert.equal(hostGame.testWorld().mode,'multiplayer');
  await eventually(()=>!gd.button('Train villager').disabled);
  gd.button('Control units on map').click();guestGame.testControl(0);
  assert.equal(gd.button('Stop selected unit').disabled,false);
  gd.button('Stop selected unit').click();
  assert.equal(gd.button('Stop selected unit').disabled,true);
  await eventually(()=>guestGame.testUnit(1).order==='i'&&hostGame.testUnit(1).order==='i');
  guestGame.testControl(1); // Leave the map, then leave the room.
  guestGame.testControl(1);
  await eventually(()=>/Room setup stopped/.test(hd.status().textContent));
  const frozen=hostGame.testWorld().time;
  await new Promise(resolve=>setTimeout(resolve,60));
  assert.equal(hostGame.testWorld().time,frozen);
});
