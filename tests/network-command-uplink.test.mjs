import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const syncCode=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
const commandsCode=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
const uplinkCode=readFileSync(new URL('../js/network-uplink.js',import.meta.url),'utf8');
const MATCH='test_match_nonce_v2_20261019';

function game(options='') {
  const {source,sandbox}=headlessGame();
  const harness=`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC,orders=window.CK_GAME_COMMANDS;
    const uplink=window.CK_COMMAND_UPLINK;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const host=sync.createCommandHost({roster,mapSize:W,
      lookupEntity:orders.lookup,execute:orders.execute});
    const ingress=uplink.createCommandIngress({roster,matchId:'${MATCH}',
      mapSize:W,host,${options}});
    const guests=uplink.createCommandSender({roster,matchId:'${MATCH}',
      mapSize:W,sid:'guest-session'});
    const home=uplink.createCommandSender({roster,matchId:'${MATCH}',
      mapSize:W,sid:'host-session'});
    globalThis.UPLINK_TEST={
      guests,home,ingress,
      tc:t=>S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      food:t=>S.res[t].f,
      queue:t=>S.bs.find(b=>b.t===t&&b.k==='tc').q.length,
      offer:(p,sid,currentFrame=2)=>ingress.receive(p,sid,currentFrame),
      frame:n=>host.applyFrameWithJournal(n),
      hash:n=>sync.worldCheckpoint(S,n).hash,
      checksum:x=>sync.checksum(x)
    };
  `;
  vm.runInNewContext(source+'\n'+syncCode+'\n'+commandsCode+'\n'+uplinkCode+'\n'+harness,
    sandbox,{filename:'network-command-uplink-integration.js'});
  return sandbox.UPLINK_TEST;
}

test('guest command ACK loss is harmless: one accepted train command and one real resource debit',()=>{
  const g=game();
  const order={type:'train',entities:[g.tc(1)],value:'vil'};
  assert.equal(g.guests.submit(order,6).ok,true);
  const before=g.food(1);
  const first=g.guests.poll(0).messages[0];
  assert.equal(first.packet.team,1);
  assert.equal(first.packet.sid,'guest-session');
  assert.equal(g.offer(first,'host-session').reason,'invalid-envelope');
  const accepted=g.offer(first,'guest-session');
  assert.equal(accepted.ok,true);
  assert.equal(accepted.duplicate,false);
  assert.equal(accepted.receipt.status,'queued');
  assert.equal(g.offer(first,'guest-session').duplicate,true);
  const retry=g.guests.poll(4).messages[0];
  assert.deepEqual(JSON.parse(JSON.stringify(retry)),JSON.parse(JSON.stringify(first)));
  assert.equal(g.offer(retry,'guest-session').duplicate,true);
  assert.equal(g.guests.acknowledge(accepted.receipt,'host-session').ok,true);
  assert.equal(g.guests.state().nextSeq,2);
  const applied=g.frame(6);
  assert.equal(applied.results.length,1);
  assert.equal(applied.results[0].ok,true);
  assert.equal(applied.journal.commands.length,1);
  assert.equal(g.queue(1),1);
  assert.ok(g.food(1)<before);
  assert.equal(g.guests.state().pending,false);
});

test('two authenticated roster slots can queue orders with independent client sequences',()=>{
  const g=game();
  const food=[g.food(0),g.food(1)];
  for(const [sender,sid,team] of [
    [g.home,'host-session',0],[g.guests,'guest-session',1]
  ]){
    assert.equal(sender.submit({type:'train',entities:[g.tc(team)],value:'vil'},6).ok,true);
    const message=sender.poll(0).messages[0];
    const accepted=g.offer(message,sid);
    assert.equal(accepted.ok,true);
    assert.equal(sender.acknowledge(accepted.receipt,'host-session').ok,true);
  }
  const receipts=g.frame(6).results;
  assert.deepEqual(Array.from(receipts,x=>x.ok),[true,true]);
  assert.equal(g.queue(0),1);
  assert.equal(g.queue(1),1);
  assert.ok(g.food(0)<food[0]&&g.food(1)<food[1]);
});

test('verified host identity, nonce, command digest and receipt contents are all required',()=>{
  const g=game();
  assert.equal(g.guests.submit({type:'train',entities:[g.tc(1)],value:'vil'},6).ok,true);
  const p=g.guests.poll(0).messages[0];
  const r=g.offer(p,'guest-session');
  assert.equal(r.ok,true);
  for(const fake of [
    {...r.receipt,match:'different_match_nonce'},
    {...r.receipt,digest:'different'},
    {...r.receipt,frame:7},
    {...r.receipt,seq:2},
    {...r.receipt,status:'applied'},
    {...r.receipt,extra:true}
  ]) assert.equal(g.guests.acknowledge(fake,'host-session').ok,false);
  assert.equal(g.guests.acknowledge(r.receipt,'guest-session').reason,'untrusted-host');
  assert.equal(g.guests.state().pending,true);
  assert.equal(g.guests.acknowledge(r.receipt,'host-session').ok,true);
  assert.equal(g.guests.acknowledge(r.receipt,'host-session').reason,'unknown-receipt');
});

test('cross-match replay, altered orders and forged guest identities cannot poison the host queue',()=>{
  const g=game();
  g.guests.submit({type:'train',entities:[g.tc(1)],value:'vil'},6);
  const packet=g.guests.poll(0).messages[0];
  assert.equal(g.offer({...packet,match:'old_match_nonce_20261018'},'guest-session').reason,'invalid-envelope');
  assert.equal(g.offer({...packet,digest:'bogus'},'guest-session').reason,'invalid-envelope');
  assert.equal(g.offer(packet,'intruder-session').reason,'untrusted-sender');
  assert.equal(g.offer(packet,'host-session').reason,'invalid-envelope');
  assert.equal(g.offer(packet,'guest-session').ok,true);
  const modified=JSON.parse(JSON.stringify(packet));
  modified.packet.order.value='arc';
  modified.digest=g.checksum({match:modified.match,packet:modified.packet});
  assert.equal(g.offer(modified,'guest-session').reason,'conflicting-retry');
  assert.equal(g.frame(6).journal.commands.length,1);
});

test('a rejected late order is never falsely ACKed or consumed by the host',()=>{
  const g=game();
  g.guests.submit({type:'train',entities:[g.tc(1)],value:'vil'},6);
  const p=g.guests.poll(0).messages[0];
  assert.equal(g.offer(p,'guest-session',6).reason,'late');
  assert.equal(g.guests.state().pending,true);
  assert.equal(g.frame(6).results.length,0);
  assert.equal(g.queue(1),0);
  // After rejecting a late packet, the authoritative inbox remains empty.
  assert.equal(g.guests.state().nextSeq,1);
});

test('outbound commands are immutable and stop-and-wait prevents sequence gaps',()=>{
  const g=game();
  const order={type:'train',entities:[g.tc(1)],value:'vil'};
  assert.equal(g.guests.submit(order,6).ok,true);
  order.value='hacked';
  const p=g.guests.poll(0).messages[0];
  assert.equal(p.packet.order.value,'vil');
  assert.equal(Object.isFrozen(p.packet.order.entities),true);
  assert.equal(g.guests.submit(order,7).reason,'pending-command');
  assert.equal(g.guests.state().nextSeq,1);
});

test('bounded retry exhaustion stops the sender without inventing an acceptance',()=>{
  const ctx={TextEncoder,window:{}};
  vm.runInNewContext(syncCode+'\n'+uplinkCode,ctx);
  const sync=ctx.window.CK_SIM_SYNC, api=ctx.window.CK_COMMAND_UPLINK;
  const roster=sync.lockRoster('host-session','guest-session',2);
  const sender=api.createCommandSender({
    roster,mapSize:64,sid:'guest-session',matchId:MATCH,
    retryTicks:2,maxAttempts:2
  });
  assert.equal(sender.submit({type:'move',entities:['u2'],point:{x:3,y:4}},6).ok,true);
  assert.equal(sender.poll(0).messages.length,1);
  assert.equal(sender.poll(1).messages.length,0);
  assert.equal(sender.poll(2).messages.length,1);
  assert.equal(sender.poll(4).reason,'retry-exhausted');
  assert.equal(sender.state().halted,'retry-exhausted');
  assert.equal(sender.submit({type:'move',entities:['u2'],point:{x:3,y:4}},7).reason,'halted');
});

test('an accepted-command receipt never claims a command actually executed',()=>{
  const g=game();
  const invalid={type:'train',entities:[g.tc(1)],value:'impossible_unit'};
  assert.equal(g.guests.submit(invalid,6).ok,true);
  const packet=g.guests.poll(0).messages[0];
  const received=g.offer(packet,'guest-session');
  assert.equal(received.receipt.status,'queued');
  const frame=g.frame(6);
  assert.equal(frame.results[0].ok,false);
  assert.equal(frame.journal.commands.length,0);
  assert.equal(g.queue(1),0);
});

test('uplink remains disconnected from untrusted Supabase marker-room events',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const multiplayer=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
  assert.match(html,/network-uplink\.js/);
  assert.match(sw,/network-uplink\.js/);
  assert.doesNotMatch(multiplayer,/CK_COMMAND_UPLINK\.(?:createCommandSender|createCommandIngress)/);
  assert.match(multiplayer,/synchronizedWorld: false/);
});
