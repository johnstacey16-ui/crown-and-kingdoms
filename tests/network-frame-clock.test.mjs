import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const protocol = readFileSync(new URL('../js/network-sync.js', import.meta.url),'utf8');
const adapter = readFileSync(new URL('../js/network-commands.js', import.meta.url),'utf8');
const delivery = readFileSync(new URL('../js/network-delivery.js', import.meta.url),'utf8');

// Each instance is a separate seeded copy of the actual production simulation.
function world(capacity=32) {
  const {source,sandbox} = headlessGame();
  const harness = `
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC, api=window.CK_GAME_COMMANDS;
    const link=window.CK_FRAME_DELIVERY;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const host=sync.createCommandHost({roster,mapSize:W,delayFrames:1,
      lookupEntity:api.lookup,execute:api.execute});
    const outbox=link.createOutbox({roster,mapSize:W,startFrame:0,
      capacity:${capacity},maxBytes:1024,retryTicks:2,maxAttempts:5});
    let steps=0, stepShouldFail=false;
    const advance=frame=>{
      if(stepShouldFail)return false;
      step(DT);steps++;return true;
    };
    const replica=sync.createFrameReplica({roster,mapSize:W,
      execute:api.execute,startFrame:0});
    const receiver=link.createReceiver({roster,mapSize:W,replica,advance});
    const clock=link.createHostClock({host,outbox,advance,startFrame:0});
    globalThis.CLOCK_TEST = {
      tc:t=>S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      submit:(sid,team,seq,frame,order)=>host.receive({
        v:sync.VERSION,sid,team,seq,frame,order},sid,clock.state().frame),
      tick:()=>clock.tick(),
      receive:(msg,sid='host-session')=>receiver.receive(msg,sid),
      poll:time=>outbox.poll(time),
      ack:(a,sid='guest-session')=>outbox.acknowledge(a,sid),
      hash:f=>sync.worldCheckpoint(S,f).hash,
      queue:t=>S.bs.find(b=>b.t===t&&b.k==='tc').q.length,
      steps:()=>steps,clock:()=>clock.state(),outbox:()=>outbox.state(),
      receiver:()=>receiver.state(),
      failStep:()=>{stepShouldFail=true}
    };
  `;
  vm.runInNewContext(source+'\n'+protocol+'\n'+adapter+'\n'+delivery+'\n'+harness,
    sandbox,{filename:'network-clock-world.js'});
  return sandbox.CLOCK_TEST;
}

test('two complete production worlds advance only on the same authoritative frame stream',()=>{
  const host=world(),guest=world();
  assert.equal(host.hash(0),guest.hash(0));
  const tc=[host.tc(0),host.tc(1)];
  assert.equal(host.submit('host-session',0,1,2,
    {type:'train',entities:[tc[0]],value:'vil'}).ok,true);
  assert.equal(host.submit('guest-session',1,1,2,
    {type:'train',entities:[tc[1]],value:'vil'}).ok,true);
  for(let frame=1;frame<=20;frame++){
    const tick=host.tick();
    assert.equal(tick.ok,true,'host frame '+frame);
    const packet=host.poll(frame).messages[0];
    assert.equal(packet.frame,frame);
    const replay=guest.receive(packet);
    assert.equal(replay.ok,true,'guest frame '+frame);
    assert.equal(host.ack(replay.ack).ok,true);
    assert.equal(host.hash(frame),guest.hash(frame),'same world at '+frame);
  }
  assert.equal(host.steps(),20);
  assert.equal(guest.steps(),20);
  assert.equal(host.queue(0),1);
  assert.equal(guest.queue(1),1);
  assert.equal(host.outbox().pending,0);
});

test('out-of-order delivery cannot run future simulation ticks; lost ACK cannot double-step',()=>{
  const host=world(),guest=world();
  assert.equal(host.tick().ok,true);
  assert.equal(host.tick().ok,true);
  const packets=host.poll(0).messages;
  assert.equal(packets.length,2);
  assert.equal(guest.receive(packets[1]).reason,'missing-frame');
  assert.equal(guest.steps(),0);
  const one=guest.receive(packets[0]);
  assert.equal(one.ok,true);
  assert.equal(guest.steps(),1);
  assert.equal(guest.receive(packets[0]).duplicate,true);
  assert.equal(guest.steps(),1);
  const two=guest.receive(packets[1]);
  assert.equal(two.ok,true);
  assert.equal(guest.steps(),2);
  assert.equal(host.ack(two.ack).reason,'out-of-order-ack');
  assert.equal(host.ack(one.ack).ok,true);
  assert.equal(host.ack(two.ack).ok,true);
  assert.equal(host.hash(2),guest.hash(2));
});

test('full outbox halts host before applying commands or ticking the world',()=>{
  const host=world(1), guest=world(1);
  assert.equal(host.tick().ok,true);
  const same=host.hash(1),steps=host.steps();
  const command={type:'train',entities:[host.tc(1)],value:'vil'};
  assert.equal(host.submit('guest-session',1,1,2,command).ok,true);
  const blocked=host.tick();
  assert.equal(blocked.reason,'backpressure');
  assert.equal(host.clock().frame,1);
  assert.equal(host.hash(1),same);
  assert.equal(host.steps(),steps);
  assert.equal(host.queue(1),0,'queued training is not prematurely executed');
  const first=host.poll(0).messages[0];
  const response=guest.receive(first);
  assert.equal(response.ok,true);
  assert.equal(host.ack(response.ack).ok,true);
  assert.equal(host.tick().ok,true);
  const second=host.poll(1).messages[0];
  const reply=guest.receive(second);
  assert.equal(reply.ok,true);
  assert.equal(host.ack(reply.ack).ok,true);
  assert.equal(host.queue(1),1);
  assert.equal(guest.queue(1),1);
  assert.equal(host.hash(2),guest.hash(2));
});

test('replica step failure produces NO acknowledgment and halts subsequent frames',()=>{
  const host=world(),guest=world();
  host.tick(); const first=host.poll(0).messages[0];
  guest.failStep();
  assert.equal(guest.receive(first).reason,'simulation-step-failed');
  assert.equal(guest.receiver().halted,true);
  assert.equal(guest.steps(),0);
  assert.equal(guest.receive(first).reason,'halted');
  assert.equal(host.outbox().pending,1);
});

test('host step failure does not report a completed frame and halts',()=>{
  const host=world();
  host.failStep();
  assert.equal(host.tick().reason,'simulation-step-failed');
  assert.equal(host.clock().frame,0);
  assert.equal(host.clock().halted,'simulation-step-failed');
  assert.equal(host.tick().reason,'halted');
  assert.equal(host.steps(),0);
});

test('host and guest clocks remain unused by untrusted marker-room Broadcast',()=>{
  const multiplayer=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
  assert.doesNotMatch(multiplayer,/CK_FRAME_DELIVERY\.(?:createHostClock|createReceiver)/);
  assert.match(multiplayer,/synchronizedWorld: false/);
});
