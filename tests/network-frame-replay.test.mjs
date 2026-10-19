import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { headlessGame } from './helpers/headless-game.mjs';

const protocol = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const commands = readFileSync(new URL('../js/network-commands.js', import.meta.url), 'utf8');

function newPeer(startFrame = 5) {
  const { source, sandbox } = headlessGame();
  const harness = `
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC;
    const adapter=window.CK_GAME_COMMANDS;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const host=sync.createCommandHost({roster,mapSize:W,
      lookupEntity:adapter.lookup,execute:adapter.execute});
    const replica=sync.createFrameReplica({roster,mapSize:W,
      execute:adapter.execute,startFrame:${startFrame}});
    const packet=(sid,team,seq,frame,order)=>({v:sync.VERSION,sid,team,seq,frame,order});
    globalThis.PEER={
      tc(t){return S.bs.find(b=>b.t===t&&b.k==='tc').netId;},
      soldier(t){const v=S.us.find(u=>u.t===t);return addU(t,'mil',v.x+.1,v.y+.1).netId;},
      packet,
      accept(packet,sid){return host.receive(packet,sid,2);},
      hostFrame(frame){return host.applyFrameWithJournal(frame);},
      guestFrame(journal,sid){return replica.receive(journal,sid);},
      guestState(){return replica.state();},
      hash(frame){return sync.worldCheckpoint(S,frame).hash;},
      step(){step(DT);},
      food(t){return S.res[t].f;},
      queue(t){return S.bs.find(b=>b.t===t&&b.k==='tc').q.length;}
    };
  `;
  vm.runInNewContext(source + '\n' + protocol + '\n' + commands + '\n' + harness,
    sandbox, { filename: 'host-command-frame-replay.js' });
  return sandbox.PEER;
}

test('host emits an applied-command journal that an independent seeded guest can reproduce', () => {
  const host=newPeer(),guest=newPeer();
  assert.equal(host.hash(5),guest.hash(5), 'the seeded worlds begin identically');
  const packets=[
    host.packet('guest-session',1,1,6,{type:'train',entities:[host.tc(1)],value:'vil'}),
    host.packet('host-session',0,1,6,{type:'train',entities:[host.tc(0)],value:'vil'})
  ];
  assert.equal(host.accept(packets[0],'guest-session').ok,true);
  assert.equal(host.accept(packets[1],'host-session').ok,true);
  const {journal,results}=host.hostFrame(6);
  assert.equal(results.length,2);
  assert.ok(results.every(x=>x.ok));
  assert.equal(journal.commands.length,2);
  assert.equal(journal.commands[0].team,0);
  assert.equal(journal.commands[1].team,1);
  assert.equal(guest.guestFrame(journal,'guest-session').reason,'untrusted-host');
  assert.equal(guest.guestFrame(journal,'host-session').ok,true);
  assert.equal(host.queue(0),1);
  assert.equal(guest.queue(0),1);
  assert.equal(host.queue(1),1);
  assert.equal(guest.queue(1),1);
  assert.equal(host.hash(6),guest.hash(6));
  for(let i=0;i<20;i++){host.step();guest.step();}
  assert.equal(host.hash(26),guest.hash(26), 'real production simulation stays deterministic after replay');
  assert.equal(guest.guestState().lastFrame,6);
});

test('rejected host command generates a receipt but cannot be replayed on the guest', () => {
  const host=newPeer(),guest=newPeer();
  const tc=host.tc(1);
  host.accept(host.packet('guest-session',1,1,6,
    {type:'train',entities:[tc],value:'unobtainium'}),'guest-session');
  const {journal,results}=host.hostFrame(6);
  assert.equal(results[0].ok,false);
  assert.equal(results[0].reason,'rejected-by-simulation');
  assert.equal(journal.commands.length,0);
  const before=guest.food(1);
  assert.equal(guest.guestFrame(journal,'host-session').ok,true);
  assert.equal(guest.food(1),before);
  assert.equal(host.hash(6),guest.hash(6));
});

test('strict replica rejects duplicates, skipped frames and untrusted sender without executing', () => {
  const peer=newPeer(0);
  const empty=frame=>({v:2,frame,commands:[]});
  assert.equal(peer.guestFrame(empty(2),'host-session').reason,'missing-frame');
  assert.equal(peer.guestFrame(empty(1),'guest-session').reason,'untrusted-host');
  assert.equal(peer.guestFrame(empty(1),'host-session').ok,true);
  assert.equal(peer.guestFrame(empty(1),'host-session').reason,'replay');
  assert.equal(peer.guestFrame(empty(3),'host-session').reason,'missing-frame');
  assert.equal(peer.guestFrame(empty(2),'host-session').ok,true);
  assert.equal(peer.guestState().lastFrame,2);
});

test('malformed second packet rejects the whole journal before the first command is executed', () => {
  const host=newPeer(),guest=newPeer();
  const unit=host.tc(1);
  host.accept(host.packet('guest-session',1,1,6,
    {type:'train',entities:[unit],value:'vil'}),'guest-session');
  const {journal}=host.hostFrame(6);
  const valid=journal.commands[0];
  const forged={...valid, seq:2, team:0};
  const invalid={v:2,frame:6,commands:[valid,forged]};
  const food=guest.food(1);
  assert.equal(guest.guestFrame(invalid,'host-session').reason,'invalid-order');
  assert.equal(guest.food(1),food);
  assert.equal(guest.queue(1),0);
  assert.equal(guest.guestFrame(journal,'host-session').ok,true);
  assert.equal(guest.queue(1),1);
});

test('journal object is frozen deeply enough to protect order identifiers and points', () => {
  const host=newPeer();
  const unit=host.soldier(1);
  host.accept(host.packet('guest-session',1,1,6,
    {type:'stance',entities:[unit],value:'defensive'}),'guest-session');
  const {journal}=host.hostFrame(6);
  assert.ok(Object.isFrozen(journal));
  assert.ok(Object.isFrozen(journal.commands));
  assert.ok(Object.isFrozen(journal.commands[0]));
  assert.ok(Object.isFrozen(journal.commands[0].order));
  assert.ok(Object.isFrozen(journal.commands[0].order.entities));
  assert.throws(()=>{journal.commands[0].order.entities[0]='u999';},TypeError);
});

test('a real replica application failure halts future frames rather than hiding desync', () => {
  const host=newPeer(),guest=newPeer();
  host.accept(host.packet('guest-session',1,1,6,
    {type:'train',entities:[host.tc(1)],value:'vil'}),'guest-session');
  const {journal}=host.hostFrame(6);
  // A divergent guest has already started research at that building.
  const divergent={
    ...journal,
    commands:journal.commands.map(c=>({...c,order:{...c.order,value:'not-a-unit'}}))
  };
  assert.equal(guest.guestFrame(divergent,'host-session').reason,'replica-application-failed');
  assert.equal(guest.guestState().halted,true);
  assert.equal(guest.guestFrame(journal,'host-session').reason,'halted');
  assert.equal(guest.guestState().lastFrame,5);
});
