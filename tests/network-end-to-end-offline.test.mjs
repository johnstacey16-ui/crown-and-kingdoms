import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const protocol=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
const commands=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
const delivery=readFileSync(new URL('../js/network-delivery.js',import.meta.url),'utf8');
const uplink=readFileSync(new URL('../js/network-uplink.js',import.meta.url),'utf8');

function newWorld(){
  const {source,sandbox}=headlessGame();
  const harness=`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC,commands=window.CK_GAME_COMMANDS;
    const delivery=window.CK_FRAME_DELIVERY,uplink=window.CK_COMMAND_UPLINK;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const matchId='production_world_match_nonce_v2';
    const host=sync.createCommandHost({roster,mapSize:W,delayFrames:1,
      lookupEntity:commands.lookup,execute:commands.execute});
    const ingress=uplink.createCommandIngress({roster,matchId,mapSize:W,host});
    const client=uplink.createCommandSender({roster,matchId,mapSize:W,
      sid:'guest-session',retryTicks:2,maxAttempts:4});
    const outbox=delivery.createOutbox({roster,mapSize:W,startFrame:0});
    const replica=sync.createFrameReplica({roster,mapSize:W,
      execute:commands.execute,startFrame:0});
    let steps=0;
    const advance=()=>{step(DT);steps++;return true};
    const receiver=delivery.createReceiver({roster,mapSize:W,replica,advance});
    const clock=delivery.createHostClock({host,outbox,advance,startFrame:0});
    globalThis.TEST_LINK={
      tc:t=>S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      submit:(order,frame)=>client.submit(order,frame),
      send:tick=>client.poll(tick),
      request:(envelope,sid)=>ingress.receive(envelope,sid,clock.state().frame),
      receipt:(message,sid)=>client.acknowledge(message,sid),
      tick:()=>clock.tick(),
      transmit:tick=>outbox.poll(tick),
      receive:(message,sid)=>receiver.receive(message,sid),
      ack:(message,sid)=>outbox.acknowledge(message,sid),
      hash:frame=>sync.worldCheckpoint(S,frame).hash,
      queue:t=>S.bs.find(b=>b.t===t&&b.k==='tc').q.length,
      steps:()=>steps
    };
  `;
  vm.runInNewContext(source+'\n'+protocol+'\n'+commands+'\n'+delivery+
    '\n'+uplink+'\n'+harness,sandbox,{filename:'network-full-command-trip.js'});
  return sandbox.TEST_LINK;
}

test('guest input retries → host command → 20 frame journals → guest simulation parity',()=>{
  const host=newWorld(),guest=newWorld();
  assert.equal(host.hash(0),guest.hash(0));
  const order={type:'train',entities:[guest.tc(1)],value:'vil'};
  assert.equal(guest.submit(order,2).ok,true);
  const first=guest.send(0).messages[0];
  assert.ok(first);
  assert.equal(host.request(first,'host-session').ok,false);
  const accepted=host.request(first,'guest-session');
  assert.equal(accepted.ok,true);
  assert.equal(accepted.receipt.status,'queued');
  // Simulate losing acceptance: exact retry must not enqueue twice.
  const retry=guest.send(2).messages[0];
  assert.equal(host.request(retry,'guest-session').duplicate,true);
  assert.equal(guest.receipt(accepted.receipt,'host-session').ok,true);
  for(let frame=1;frame<=20;frame++){
    assert.equal(host.tick().ok,true,'host frame '+frame);
    const message=host.transmit(frame).messages[0];
    assert.ok(message,'host must send frame '+frame);
    const replay=guest.receive(message,'host-session');
    assert.equal(replay.ok,true,'guest frame '+frame);
    assert.equal(host.ack(replay.ack,'guest-session').ok,true);
    assert.equal(host.hash(frame),guest.hash(frame),'production parity at '+frame);
  }
  assert.equal(host.steps(),20);
  assert.equal(guest.steps(),20);
  assert.equal(host.queue(1),1);
  assert.equal(guest.queue(1),1);
  assert.equal(host.queue(0),guest.queue(0));
});

test('cross-match or forged guest packets never mutate either production world',()=>{
  const host=newWorld(),guest=newWorld();
  guest.submit({type:'train',entities:[guest.tc(1)],value:'vil'},2);
  const packet=guest.send(0).messages[0];
  assert.equal(host.request({...packet,match:'other_valid_match_nonce'},'guest-session').ok,false);
  assert.equal(host.request(packet,'outsider').reason,'untrusted-sender');
  assert.equal(host.request(packet,'host-session').ok,false);
  assert.equal(guest.receipt({
    v:2,match:packet.match,sid:'guest-session',seq:1,frame:2,
    digest:packet.digest,status:'queued'
  },'guest-session').reason,'untrusted-host');
  assert.equal(guest.queue(1),0);
  assert.equal(host.queue(1),0);
  assert.equal(host.hash(0),guest.hash(0));
});
