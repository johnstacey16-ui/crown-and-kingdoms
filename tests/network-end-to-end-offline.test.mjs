import test from 'node:test';
import assert from 'node:assert/strict';
import { networkWorld as newWorld } from './helpers/network-world.mjs';

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

