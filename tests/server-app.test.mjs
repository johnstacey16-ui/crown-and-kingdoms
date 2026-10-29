import assert from 'node:assert/strict';
import { createApplication } from '../server/app.mjs';

const server = createApplication();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const request = (path, options) => fetch(origin + path, options);
try {
  for (const [path, type, marker] of [
    ['/', 'text/html', '<canvas'],
    ['/index.html?release=test', 'text/html', '<canvas'],
    ['/js/network-session.js', 'text/javascript', 'CK_LIVE_SESSION'],
    ['/styles.css', 'text/css', 'canvas'],
    ['/assets/atlas-manifest.json', 'application/json', 'painted-raster-v14-motion'],
    ['/sw.js', 'text/javascript', 'no-store']
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
    assert.ok((await response.text()).includes(marker), path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  for(const name of ['painted-motion-mgd','painted-motion-cata','painted-motion-conq','painted-motion-boyar','painted-motion-tarkan','painted-motion-huszar','painted-motion-camel','painted-motion-mamel','painted-motion-chuko','painted-motion-hcan','painted-motion-plumed','painted-motion-gbeto','painted-motion-jan','painted-motion-genoa','painted-environment','painted-resources','painted-units','painted-units-v2','painted-buildings','painted-terrain','painted-motion-mil','painted-motion-knight','painted-motion-vil','painted-motion-arc','painted-motion-xbow','painted-motion-spear','painted-motion-scout','painted-motion-skirm','painted-motion-mon','painted-motion-axe','painted-motion-lbow','painted-motion-woad','painted-motion-bers','painted-motion-saml','painted-motion-tk','painted-motion-huskarl','painted-motion-jaguar','painted-motion-kamayuk','painted-motion-shotel']){
    const response=await request('/assets/'+name+'.webp');
    assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/webp/);
    const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
  const health = await request('/healthz');
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal(health.headers.get('cache-control'), 'no-store');
  const head = await request('/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  for (const path of ['/AGENTS.md', '/server/transport.mjs', '/tests/server-app.test.mjs',
    '/.git/config', '/Dockerfile', '/railway.json', '/js/%2e%2e/server/transport.mjs',
    '/assets/%252e%252e%252fserver%252fapp.mjs', '/js/missing.js', '/%ZZ',
    '/sessions']) {
    const response = await request(path);
    assert.ok([400, 404].includes(response.status), path);
  }
  const invalidMethod = await request('/index.html', { method: 'POST' });
  assert.equal(invalidMethod.status, 405);
  assert.equal(invalidMethod.headers.get('allow'), 'GET, HEAD');
  const makeSession = async () => {
    const response = await request('/api/multiplayer/sessions', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
    });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return response.json();
  };
  const host = await makeSession(), guest = await makeSession();
  const api = async (path, token, method = 'GET', body) => {
    const response = await request('/api/multiplayer' + path, {
      method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    assert.ok(response.ok, path + ': ' + response.status);
    return response.json();
  };
  const room = await api('/rooms', host.token, 'POST', {});
  const joined = await api('/join', guest.token, 'POST', { roomId: room.roomId });
  assert.equal(joined.matchId, room.matchId);
  await api('/messages', guest.token, 'POST', { matchId: room.matchId, kind: 'command', payload: { probe: true } });
  const polled = await api('/messages', host.token);
  assert.equal(polled.messages[0].senderSid, guest.sid);
  assert.equal(polled.messages[0].team, 1);
  const unauth = await request('/api/multiplayer/messages');
  assert.equal(unauth.status, 401);
  const crossSite = await request('/api/multiplayer/sessions', {
    method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, body: '{}'
  });
  assert.equal(crossSite.status, 403);
  await api('/session', host.token, 'DELETE');
  await api('/session', guest.token, 'DELETE');
  console.log('Combined game hosting, restricted static routes, health and authenticated two-player relay passed');
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

