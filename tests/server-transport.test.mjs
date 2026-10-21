import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createTransport } from '../server/transport.mjs';

async function fixture(t, options = {}) {
  const server = createTransport(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  async function request(path, token, data, method = data === undefined ? 'GET' : 'POST') {
    const response = await fetch(url + path, { method, headers: {
      'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
    }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    return { status: response.status, ...await response.json() };
  }
  const host = await request('/sessions', null, {});
  const guest = await request('/sessions', null, {});
  const room = await request('/rooms', host.token, {});
  assert.equal(room.status, 201);
  assert.equal((await request('/join', guest.token, { roomId: room.roomId })).status, 200);
  return { request, host, guest, room };
}

test('real HTTP sessions bind identities and lock two-player membership', async t => {
  const { request, host, guest, room } = await fixture(t);
  assert.equal((await request('/room', 'forged')).status, 401);
  assert.notEqual(host.sid, guest.sid);
  const roster = await request('/room', guest.token);
  assert.deepEqual(roster.members, [{ sid: host.sid, team: 0 }, { sid: guest.sid, team: 1 }]);
  const third = await request('/sessions', null, {});
  assert.equal((await request('/join', third.token, { roomId: room.roomId })).status, 409);
  assert.equal((await request('/messages', third.token)).status, 409);
  assert.equal((await request('/rooms', host.token, {})).status, 409);
});

test('relay stamps verified sender, rejects spoofing and wrong match or role', async t => {
  const { request, host, guest, room } = await fixture(t);
  const command = { matchId: room.matchId, kind: 'command', payload: { sid: host.sid } };
  assert.equal((await request('/messages', guest.token, { ...command, senderSid: host.sid })).status, 400);
  assert.equal((await request('/messages', guest.token, { ...command, matchId: 'old' })).status, 409);
  assert.equal((await request('/messages', guest.token, { ...command, kind: 'frame' })).status, 403);
  assert.equal((await request('/messages', host.token, command)).status, 403);
  assert.equal((await request('/messages', guest.token, command)).status, 202);
  const received = await request('/messages', host.token);
  assert.equal(received.messages[0].senderSid, guest.sid);
  assert.equal(received.messages[0].team, 1);
  assert.equal(received.messages[0].payload.sid, host.sid); // Never trust payload identity.
  assert.deepEqual((await request('/messages', host.token)).messages, received.messages);
  assert.equal((await request('/messages/ack', host.token, { matchId: room.matchId, sequence: 2 })).status, 400);
  assert.equal((await request('/messages/ack', host.token, { matchId: room.matchId, sequence: 1 })).status, 200);
  assert.deepEqual((await request('/messages', host.token)).messages, []);
  assert.equal((await request('/messages/ack', host.token, { matchId: room.matchId, sequence: 1 })).status, 200);
});

test('payload limits and peer backpressure stop rather than drop gameplay', async t => {
  const { request, host, guest, room } = await fixture(t, { maxQueue: 1 });
  const frame = { matchId: room.matchId, kind: 'frame', payload: {} };
  assert.equal((await request('/messages', host.token, { ...frame, payload: { text: 'x'.repeat(1024) } })).status, 413);
  assert.equal((await request('/messages', host.token, frame)).status, 202);
  assert.equal((await request('/messages', host.token, frame)).status, 409);
  assert.equal((await request('/room', guest.token)).status, 409);
  assert.equal((await request('/room', host.token)).status, 409);
});

test('expiry and leaving terminate both memberships and prevent room reuse', async t => {
  let clock = 0;
  const { request, host, guest, room } = await fixture(t, { now: () => clock, ttl: 100 });
  assert.equal((await request('/room', guest.token, undefined, 'DELETE')).status, 200);
  assert.equal((await request('/room', host.token)).status, 409);
  assert.equal((await request('/join', guest.token, { roomId: room.roomId })).status, 404);
  const next = await request('/rooms', host.token, {});
  assert.notEqual(next.matchId, room.matchId);
  clock = 100;
  assert.equal((await request('/room', host.token)).status, 401);
  assert.equal((await request('/join', guest.token, { roomId: next.roomId })).status, 401);
});

test('session quota and authenticated rate limit bound resource use', async t => {
  const { request, host } = await fixture(t, { maxSessions: 2, now: () => 0 });
  assert.equal((await request('/sessions', null, {})).status, 503);
  let result;
  for (let i = 0; i < 121; i++) result = await request('/room', host.token);
  assert.equal(result.status, 429);
});

test('successful activity keeps both players alive beyond the initial session lease', async t => {
  let clock = 0;
  const { request, host, guest } = await fixture(t, { now: () => clock, ttl: 100 });
  for (clock = 90; clock <= 270; clock += 90) {
    assert.equal((await request('/room', host.token)).status, 200);
    assert.equal((await request('/messages', guest.token)).status, 200);
  }
  clock = 370; // Exact idle deadline after the last successful activity.
  assert.equal((await request('/room', host.token)).status, 401);
  assert.equal((await request('/room', guest.token)).status, 401);
});

test('one active player cannot renew the idle peer or retain its room', async t => {
  let clock = 0;
  const { request, host, guest } = await fixture(t, { now: () => clock, ttl: 100 });
  clock = 90;
  assert.equal((await request('/messages', host.token)).status, 200);
  clock = 100;
  assert.equal((await request('/room', host.token)).status, 409);
  assert.equal((await request('/room', guest.token)).status, 401);
  assert.equal((await request('/rooms', host.token, {})).status, 201);
});

test('rejected authenticated traffic cannot renew the idle lease', async t => {
  let clock = 0;
  const { request, host, room } = await fixture(t, { now: () => clock, ttl: 100 });
  clock = 90;
  assert.equal((await request('/messages', host.token, {
    matchId: room.matchId, kind: 'command', payload: {}
  })).status, 403);
  clock = 100;
  assert.equal((await request('/room', host.token)).status, 401);
});

