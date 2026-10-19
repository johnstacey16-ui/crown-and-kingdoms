import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createTransport } from '../server/transport.mjs';
import { networkWorld } from './helpers/network-world.mjs';

const source = readFileSync(new URL('../js/network-transport.js', import.meta.url), 'utf8');
function client(origin, fetcher = fetch, options) {
  const context = { location: { origin }, fetch: fetcher, URL, AbortController,
    TextEncoder, setTimeout, clearTimeout };
  vm.runInNewContext(source, context);
  return context.CK_AUTH_TRANSPORT.createClient(options);
}
async function fixture(t, intercept = fetch) {
  const server = createTransport();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const host = client(origin, intercept), guest = client(origin);
  t.after(() => new Promise(resolve => {
    host.close(); guest.close();
    server.close(resolve); server.closeAllConnections();
  }));
  const created = await host.connect();
  assert.equal(created.phase, 'waiting');
  await guest.connect(created.roomId);
  await host.refreshRoster();
  return { host, guest, origin };
}

test('browser adapter carries a paid guest order and 20 matching production frames over HTTP', async t => {
  const { host, guest } = await fixture(t);
  const roster = host.snapshot();
  const options = { hostSid: roster.members[0].sid, guestSid: roster.members[1].sid, matchId: roster.matchId };
  const hostWorld = networkWorld(options), guestWorld = networkWorld(options);
  assert.equal(hostWorld.hash(0), guestWorld.hash(0));
  assert.equal(guestWorld.submit({ type: 'train', entities: [guestWorld.tc(1)], value: 'vil' }, 2).ok, true);
  await guest.send('command', guestWorld.send(0).messages[0]);
  await host.poll(async (kind, payload, sender) => {
    assert.equal(kind, 'command');
    const accepted = hostWorld.request(payload, sender);
    assert.equal(accepted.ok, true);
    await host.send('receipt', accepted.receipt);
    return true;
  });
  await guest.poll((kind, payload, sender) => kind === 'receipt' && guestWorld.receipt(payload, sender).ok);
  for (let frame = 1; frame <= 20; frame++) {
    assert.equal(hostWorld.tick().ok, true);
    await host.send('frame', hostWorld.transmit(frame).messages[0]);
    await guest.poll(async (kind, payload, sender) => {
      assert.equal(kind, 'frame');
      const applied = guestWorld.receive(payload, sender);
      assert.equal(applied.ok, true);
      await guest.send('ack', applied.ack);
      return true;
    });
    await host.poll((kind, payload, sender) => kind === 'ack' && hostWorld.ack(payload, sender).ok);
    assert.equal(hostWorld.hash(frame), guestWorld.hash(frame), 'world parity at HTTP frame ' + frame);
  }
  assert.equal(hostWorld.queue(1), 1);
  assert.equal(guestWorld.queue(1), 1);
  assert.equal(hostWorld.steps(), 20);
  assert.equal(guestWorld.steps(), 20);
  assert.equal(Object.hasOwn(host.snapshot(), 'token'), false);
});

test('requests never cache, follow redirects, or use cookies; concurrent polls share one handler', async t => {
  const seen = [];
  const { host, guest } = await fixture(t, (url, options) => { seen.push(options); return fetch(url, options); });
  await guest.send('command', { sid: host.snapshot().sid });
  let calls = 0;
  const first = host.poll((kind, payload, sender) => {
    calls++;
    assert.equal(sender, guest.snapshot().sid);
    assert.notEqual(sender, payload.sid);
    return true;
  });
  assert.equal(host.poll(() => { throw Error('overlapping handler'); }), first);
  await first;
  assert.equal(await host.poll(() => { calls++; return true; }), 0);
  assert.equal(calls, 1);
  for (const options of seen) {
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
  }
});

test('forged sender or a gap in a later envelope rejects the whole batch before callbacks', async t => {
  for (const tamper of [message => { message.senderSid = 'x'.repeat(43); }, message => { message.sequence += 1; }]) {
    let corrupt = false;
    const { host, guest } = await fixture(t, async (url, options) => {
      const response = await fetch(url, options);
      if (corrupt && url.endsWith('/messages') && options.method === 'GET') {
        const data = await response.json(); tamper(data.messages[1]);
        return Response.json(data);
      }
      return response;
    });
    await guest.send('command', {}); await guest.send('command', {});
    corrupt = true;
    let calls = 0;
    await assert.rejects(host.poll(() => { calls++; return true; }), /Invalid sender/);
    assert.equal(calls, 0);
    assert.equal(host.snapshot().phase, 'failed');
  }
});

test('a rejected gameplay callback never acknowledges the message and terminates the session', async t => {
  let ackCount = 0;
  const { host, guest } = await fixture(t, (url, options) => {
    if (url.endsWith('/messages/ack')) ackCount++;
    return fetch(url, options);
  });
  await guest.send('command', {});
  await assert.rejects(host.poll(() => false), /handler rejected/);
  assert.equal(ackCount, 0);
  assert.equal(host.snapshot().phase, 'failed');
});

test('closing during a delayed poll prevents callbacks and cancels the HTTP request', async t => {
  let began, abortObserved = false;
  const started = new Promise(resolve => { began = resolve; });
  const { host, guest } = await fixture(t, (url, options) => {
    if (url.endsWith('/messages') && options.method === 'GET') {
      began();
      return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => {
        abortObserved = true; reject(Error('aborted'));
      }));
    }
    return fetch(url, options);
  });
  await guest.send('command', {});
  const polling = host.poll(() => { throw Error('must not run'); });
  const rejected = assert.rejects(polling, /aborted/);
  await started;
  host.close();
  await rejected;
  assert.equal(abortObserved, true);
  assert.equal(host.snapshot().phase, 'closed');
});

test('HTTP errors, redirects, and deadlines fail closed; non-local HTTP is rejected', async t => {
  assert.throws(() => client('http://example.com'), /HTTPS required/);
  const { origin } = await fixture(t);
  for (const fetcher of [
    async () => Response.json({ error: 'no' }, { status: 401 }),
    async () => { throw TypeError('redirect rejected'); },
    (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('timeout'))))
  ]) {
    const connection = client(origin, fetcher, { timeoutMs: 20 });
    await assert.rejects(connection.connect());
    assert.equal(connection.snapshot().phase, 'failed');
  }
});

test('service worker bypasses authenticated relay traffic and retains normal shell caching', () => {
  const handlers = new Map();
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), {
    self: { location: { origin: 'https://game.example' }, addEventListener: (name, handle) => handlers.set(name, handle) },
    URL, caches: { open: async () => ({ match: async () => new Response('cached') }) }
  });
  for (const request of [
    new Request('https://game.example/api/multiplayer/messages'),
    new Request('https://game.example/room', { headers: { Authorization: 'Bearer secret' } }),
    new Request('https://game.example/other', { cache: 'no-store' })
  ]) handlers.get('fetch')({ request, respondWith() { assert.fail('Must not intercept private traffic'); } });
  let intercepted = false;
  handlers.get('fetch')({ request: new Request('https://game.example/art.svg'), respondWith(promise) { intercepted = true; void promise; } });
  assert.equal(intercepted, true);
});
