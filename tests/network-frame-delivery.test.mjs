import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const syncCode=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
const commandsCode=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
const deliveryCode=readFileSync(new URL('../js/network-delivery.js',import.meta.url),'utf8');

function peers(options='') {
  const {source,sandbox}=headlessGame();
  const harness=`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC,api=window.CK_GAME_COMMANDS,delivery=window.CK_FRAME_DELIVERY;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const host=sync.createCommandHost({roster,mapSize:W,
      lookupEntity:api.lookup,execute:api.execute});
    const replica=sync.createFrameReplica({roster,mapSize:W,
      execute:api.execute,startFrame:5});
    const outbox=delivery.createOutbox({roster,mapSize:W,startFrame:5,${options}});
    const receiver=delivery.createReceiver({roster,mapSize:W,replica,${options}});
    const packet=(sid,team,seq,frame,order)=>({v:sync.VERSION,sid,team,seq,frame,order});
    globalThis.LINK={
      tc:t=>S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      packet,
      command:(sid,team,seq,frame,order)=>host.receive(packet(sid,team,seq,frame,order),sid,2),
      journal:frame=>host.applyFrameWithJournal(frame).journal,
      enqueue:journal=>outbox.enqueue(journal),
      poll:(clock,count)=>outbox.poll(clock,count),
      ack:(message,sid)=>outbox.acknowledge(message,sid),
      accept:(message,sid)=>receiver.receive(message,sid),
      sent:()=>outbox.state(),
      received:()=>receiver.state(),
      hash:frame=>sync.worldCheckpoint(S,frame).hash,
      food:t=>S.res[t].f,
      queue:t=>S.bs.find(b=>b.t===t&&b.k==='tc').q.length,
      tick:()=>step(DT),
    };
  `;
  vm.runInNewContext(source+'\n'+syncCode+'\n'+commandsCode+'\n'+deliveryCode+'\n'+harness,
    sandbox,{filename:'headless-multiplayer-delivery.js'});
  return sandbox.LINK;
}
const empty=frame=>({v:2,frame,commands:[]});

test('loss of an ACK causes retransmission and idempotent guest acknowledgment',()=>{
  const host=peers(),guest=peers();
  assert.equal(host.hash(5),guest.hash(5));
  const order={type:'train',entities:[host.tc(1)],value:'vil'};
  assert.equal(host.command('guest-session',1,1,6,order).ok,true);
  assert.equal(host.enqueue(host.journal(6)).ok,true);
  assert.equal(host.poll(0).messages.length,1);
  const firstMessage=host.poll(6).messages[0];
  assert.equal(guest.accept(firstMessage,'host-session').ok,true);
  assert.equal(guest.queue(1),1);
  // Guest ACK was lost; delivery of the same immutable envelope is safe.
  const resent=host.poll(12).messages[0];
  const duplicate=guest.accept(resent,'host-session');
  assert.equal(duplicate.ok,true);
  assert.equal(duplicate.duplicate,true);
  assert.equal(guest.queue(1),1);
  assert.equal(host.ack(duplicate.ack,'guest-session').ok,true);
  assert.equal(host.sent().pending,0);
  assert.equal(host.hash(6),guest.hash(6));
  for(let i=0;i<20;i++){host.tick();guest.tick();}
  assert.equal(host.hash(26),guest.hash(26));
});

test('fail-closed outbox requires a contiguous frame stream and bounded capacity',()=>{
  const host=peers('capacity:1');
  assert.equal(host.enqueue(empty(8)).reason,'noncontiguous-frame');
  assert.equal(host.enqueue(empty(6)).ok,true);
  assert.equal(host.enqueue(empty(7)).reason,'backpressure');
  assert.equal(host.poll(0).messages.length,1);
  const correct={v:2,frame:6,digest:host.poll(1).messages[0]?.digest};
  assert.equal(correct.digest,undefined); // Not due to retransmit yet.
  const delivered=host.poll(6).messages[0];
  assert.equal(host.ack({v:2,frame:6,digest:'bogus'},'guest-session').reason,'digest-mismatch');
  assert.equal(host.ack({v:2,frame:6,digest:delivered.digest},'guest-session').ok,true);
  assert.equal(host.enqueue(empty(7)).ok,true);
  assert.equal(host.sent().lastEnqueued,7);
});

test('host only accepts a matching ACK from a verified guest and already-sent frame',()=>{
  const host=peers();
  assert.equal(host.enqueue(empty(6)).ok,true);
  const envelope=host.poll(0).messages[0];
  const ack={v:2,frame:6,digest:envelope.digest};
  assert.equal(host.ack(ack,'host-session').reason,'untrusted-guest');
  assert.equal(host.ack({...ack,extra:true},'guest-session').reason,'invalid-ack');
  assert.equal(host.ack({...ack,digest:'different'},'guest-session').reason,'digest-mismatch');
  assert.equal(host.sent().pending,1);
  assert.equal(host.ack(ack,'guest-session').ok,true);
  assert.equal(host.ack(ack,'guest-session').reason,'unknown-frame');
});

test('out-of-order ACKs never discard unacknowledged earlier frames',()=>{
  const host=peers();
  host.enqueue(empty(6));host.enqueue(empty(7));
  const sent=host.poll(0).messages;
  assert.equal(sent.length,2);
  const ack7={v:2,frame:7,digest:sent[1].digest};
  assert.equal(host.ack(ack7,'guest-session').reason,'out-of-order-ack');
  assert.equal(host.sent().pending,2);
  assert.equal(host.ack({v:2,frame:6,digest:sent[0].digest},'guest-session').ok,true);
  assert.equal(host.ack(ack7,'guest-session').ok,true);
  assert.equal(host.sent().lastAcked,7);
});

test('wrong host sender, altered digest or oversized envelope cannot change guest state',()=>{
  const guest=peers();
  const original=guest.food(1);
  const valid={v:2,frame:6,journal:empty(6)};
  valid.digest=undefined;
  assert.equal(guest.accept(valid,'host-session').reason,'invalid-envelope');
  assert.equal(guest.accept({...valid,digest:'fake'},'host-session').reason,'invalid-envelope');
  assert.equal(guest.accept({...valid,digest:'fake'},'guest-session').reason,'untrusted-host');
  assert.equal(guest.food(1),original);
  assert.equal(guest.received().lastFrame,5);
});

test('retry exhaustion halts the outbox rather than dropping commands silently',()=>{
  const host=peers('retryTicks:2,maxAttempts:2');
  host.enqueue(empty(6));
  assert.equal(host.poll(0).messages.length,1);
  assert.equal(host.poll(1).messages.length,0);
  assert.equal(host.poll(2).messages.length,1);
  assert.equal(host.poll(4).reason,'retry-exhausted');
  assert.equal(host.sent().pending,1);
  assert.equal(host.enqueue(empty(7)).reason,'halted');
});

test('1 KB budget prevents a large command journal from being partially sent',()=>{
  const host=peers('maxBytes:1024');
  const commands=[];
  for(let seq=1;seq<=14;seq++)
    commands.push(host.packet('guest-session',1,seq,6,
      {type:'train',entities:[host.tc(1)],value:'vil'}));
  const big={v:2,frame:6,commands};
  assert.equal(host.enqueue(big).reason,'oversized-frame');
  assert.equal(host.sent().lastEnqueued,5);
  assert.equal(host.sent().pending,0);
});

test('outbox messages are frozen and cannot be modified after validation',()=>{
  const host=peers();
  const order={type:'train',entities:[host.tc(1)],value:'vil'};
  const journal={v:2,frame:6,commands:[host.packet('guest-session',1,1,6,order)]};
  host.enqueue(journal);
  order.value='wrong';
  const message=host.poll(0).messages[0];
  assert.ok(Object.isFrozen(message));
  assert.ok(Object.isFrozen(message.journal.commands[0].order.entities));
  assert.equal(message.journal.commands[0].order.value,'vil');
});

test('module stays disconnected from live self-reported Supabase Broadcast identities',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const transport=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
  assert.match(html,/network-delivery\.js/);
  assert.match(sw,/network-delivery\.js/);
  assert.doesNotMatch(transport,/CK_FRAME_DELIVERY\.(?:createOutbox|createReceiver)/);
  assert.match(transport,/synchronizedWorld: false/);
});
