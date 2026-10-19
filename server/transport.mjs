import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Anonymous bearer credentials establish a server-owned identity, not a user account.
// Run behind HTTPS on the game's origin. Never expose credentials in URLs or logs.
export function createTransport({ now = Date.now, ttl = 30 * 60_000,
  maxSessions = 1000, maxRooms = 500, maxQueue = 256 } = {}) {
  const sessions = new Map();
  const rooms = new Map();
  const secret = () => randomBytes(32).toString('base64url');
  const fail = (status, message) => Object.assign(new Error(message), { status });
  function closeRoom(room) {
    rooms.delete(room.id);
    for (const member of room.members) member.room = null;
  }
  function expire() {
    for (const [token, session] of sessions) {
      if (session.expires <= now()) {
        if (session.room) closeRoom(session.room);
        sessions.delete(token);
      }
    }
  }
  async function body(req) {
    if (req.headers['content-type'] !== 'application/json') throw fail(415, 'JSON required');
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4096) throw fail(413, 'Message too large');
      chunks.push(chunk);
    }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw fail(400, 'Invalid JSON'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail(400, 'Object required');
    return data;
  }
  function keys(data, expected) {
    if (Object.keys(data).sort().join(',') !== expected.sort().join(',')) throw fail(400, 'Unexpected fields');
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (status, value) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    try {
      // No CORS: the production reverse proxy must serve this on the game origin.
      if (req.headers['sec-fetch-site'] === 'cross-site') throw fail(403, 'Cross-site request rejected');
      expire();
      const path = req.url.startsWith('/api/multiplayer/') ? req.url.slice('/api/multiplayer'.length) : req.url;
      if (path === '/sessions' && req.method === 'POST') {
        keys(await body(req), []);
        if (sessions.size >= maxSessions) throw fail(503, 'Session capacity reached');
        const token = secret();
        const session = { sid: secret(), expires: now() + ttl, room: null, window: now(), count: 0 };
        sessions.set(token, session);
        return reply(201, { token, sid: session.sid, expires: session.expires });
      }
      const authorization = req.headers.authorization || '';
      const session = authorization.startsWith('Bearer ') ? sessions.get(authorization.slice(7)) : null;
      if (!session) throw fail(401, 'Valid session required');
      if (now() - session.window >= 1000) { session.window = now(); session.count = 0; }
      if (++session.count > 120) throw fail(429, 'Session rate limit reached');
      const data = req.method === 'POST' ? await body(req) : null;
      if (sessions.get(authorization.slice(7)) !== session || session.expires <= now()) throw fail(401, 'Session expired');
      if (path === '/rooms' && req.method === 'POST') {
        keys(data, []);
        if (session.room) throw fail(409, 'Already in a room');
        if (rooms.size >= maxRooms) throw fail(503, 'Room capacity reached');
        const room = { id: secret(), matchId: secret(), members: [session], queues: [[], []], next: [1, 1] };
        rooms.set(room.id, room);
        session.room = room;
        return reply(201, { roomId: room.id, matchId: room.matchId, team: 0 });
      }
      if (path === '/join' && req.method === 'POST') {
        keys(data, ['roomId']);
        if (session.room) throw fail(409, 'Already in a room');
        const room = rooms.get(data.roomId);
        if (!room) throw fail(404, 'Room unavailable');
        if (room.members.length !== 1) throw fail(409, 'Room full');
        room.members.push(session);
        session.room = room;
        return reply(200, { matchId: room.matchId, team: 1 });
      }
      if (path === '/session' && req.method === 'DELETE') {
        if (session.room) closeRoom(session.room);
        sessions.delete(authorization.slice(7));
        return reply(200, { closed: true });
      }
      const room = session.room;
      if (!room) throw fail(409, 'No active room');
      const team = room.members.indexOf(session);
      if (path === '/room' && req.method === 'GET') {
        return reply(200, { matchId: room.matchId, team,
          members: room.members.map((member, slot) => ({ sid: member.sid, team: slot })) });
      }
      if (path === '/room' && req.method === 'DELETE') {
        closeRoom(room);
        return reply(200, { closed: true });
      }
      if (path === '/messages' && req.method === 'POST') {
        keys(data, ['matchId', 'kind', 'payload']);
        // Awaiting the request body may have allowed another request to close this room.
        if (session.room !== room || session.expires <= now()) throw fail(409, 'Room ended');
        if (data.matchId !== room.matchId) throw fail(409, 'Wrong match');
        const allowed = team === 0 ? ['frame', 'receipt'] : ['command', 'ack'];
        if (!allowed.includes(data.kind)) throw fail(403, 'Sender role cannot send this message');
        if (!data.payload || typeof data.payload !== 'object' || Array.isArray(data.payload)) throw fail(400, 'Payload object required');
        if (Buffer.byteLength(JSON.stringify(data.payload)) > 1024) throw fail(413, 'Payload exceeds 1 KiB');
        if (room.members.length !== 2) throw fail(409, 'Waiting for peer');
        const peer = 1 - team;
        if (room.queues[peer].length >= maxQueue) {
          closeRoom(room);
          throw fail(409, 'Peer queue exhausted; match ended');
        }
        const envelope = { matchId: room.matchId, senderSid: session.sid, team,
          sequence: room.next[peer]++, kind: data.kind, payload: data.payload };
        room.queues[peer].push(envelope);
        return reply(202, { sequence: envelope.sequence });
      }
      if (path === '/messages' && req.method === 'GET') {
        // Polls are non-destructive. Lost HTTP responses are safe to retry.
        return reply(200, { messages: room.queues[team].slice(0, 32) });
      }
      if (path === '/messages/ack' && req.method === 'POST') {
        keys(data, ['matchId', 'sequence']);
        if (session.room !== room || session.expires <= now()) throw fail(409, 'Room ended');
        if (data.matchId !== room.matchId || !Number.isSafeInteger(data.sequence) ||
            data.sequence < 1 || data.sequence >= room.next[team]) throw fail(400, 'Invalid receipt');
        room.queues[team] = room.queues[team].filter(message => message.sequence > data.sequence);
        return reply(200, { acknowledged: data.sequence });
      }
      throw fail(404, 'Unknown endpoint');
    } catch (error) {
      reply(error.status || 500, { error: error.status ? error.message : 'Internal error' });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8787);
  createTransport().listen(port, '127.0.0.1', () => console.log(`Transport listening on 127.0.0.1:${port}`));
}
