/* Same-origin authenticated relay client. Loading this file opens no connection.
 * Tokens stay in memory. Only server envelopes supply trusted sender identity.
 * A failed operation stops the session; recovery requires a fresh match. */
(function(root){
  'use strict';
  const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
  const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  function createClient({ timeoutMs = 8000 } = {}) {
    const origin = new URL(root.location.origin);
    if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) throw Error('HTTPS required');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw Error('Invalid timeout');
    const base = origin.origin + '/api/multiplayer';
    let token = null, sid = null, team = null, matchId = null, roomId = null;
    let phase = 'idle', members = [], lastHandled = 0, polling = null;
    const controllers = new Set();
    const active = () => phase !== 'closed' && phase !== 'failed';
    function stop(failed) {
      phase = failed ? 'failed' : 'closed';
      for (const controller of controllers) controller.abort();
      controllers.clear();
      const credential = token;
      token = null;
      members = [];
      // Best-effort revocation; expiry remains the fallback if the network is gone.
      if (credential) void request('/session', 'DELETE', undefined, credential, true).catch(() => {});
    }
    async function request(path, method = 'GET', data, credential = token, cleanup = false) {
      const controller = new AbortController();
      if (!cleanup) controllers.add(controller);
      const timer = root.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await root.fetch(base + path, {
          method, redirect: 'error', credentials: 'omit', cache: 'no-store',
          headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) },
          ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: controller.signal
        });
        if (!response.ok) throw Error('Relay request failed (' + response.status + ')');
        const result = await response.json();
        if (!cleanup && !active()) throw Error('Session ended');
        return result;
      } finally {
        root.clearTimeout(timer);
        controllers.delete(controller);
      }
    }
    async function guard(operation) {
      try { return await operation(); }
      catch (error) { if (active()) stop(true); throw error; }
    }
    function snapshot() {
      return Object.freeze({ phase, sid, team, matchId, roomId,
        members: Object.freeze(members.map(member => Object.freeze({ ...member }))) });
    }
    async function refreshRoster() {
      if (!['waiting', 'ready'].includes(phase)) throw Error('No active room');
      return guard(async () => {
        const room = await request('/room');
        if (!exact(room, ['matchId', 'team', 'members']) || room.matchId !== matchId || room.team !== team ||
            !Array.isArray(room.members) || room.members.length < 1 || room.members.length > 2 ||
            !room.members.every((member, slot) => exact(member, ['sid', 'team']) && id(member.sid) && member.team === slot) ||
            room.members[team]?.sid !== sid || new Set(room.members.map(member => member.sid)).size !== room.members.length ||
            members.some((member, slot) => member.sid !== room.members[slot]?.sid)) throw Error('Invalid or changed roster');
        members = room.members;
        phase = members.length === 2 ? 'ready' : 'waiting';
        return snapshot();
      });
    }
    async function connect(invitation) {
      if (phase !== 'idle') throw Error('Client already used');
      if (invitation !== undefined && !id(invitation)) throw Error('Invalid invitation');
      phase = 'connecting';
      return guard(async () => {
        const session = await request('/sessions', 'POST', {});
        if (!exact(session, ['token', 'sid', 'expires']) || !id(session.token) || !id(session.sid) ||
            !Number.isSafeInteger(session.expires) || session.expires <= Date.now()) throw Error('Invalid session');
        token = session.token;
        sid = session.sid;
        team = invitation === undefined ? 0 : 1;
        const room = await request(team === 0 ? '/rooms' : '/join', 'POST', team === 0 ? {} : { roomId: invitation });
        if (!exact(room, team === 0 ? ['roomId', 'matchId', 'team'] : ['matchId', 'team']) ||
            !id(room.matchId) || room.team !== team || (team === 0 && !id(room.roomId))) throw Error('Invalid room');
        matchId = room.matchId;
        roomId = team === 0 ? room.roomId : invitation;
        phase = 'waiting';
        return refreshRoster();
      });
    }
    async function send(kind, payload) {
      if (phase !== 'ready') throw Error('Peer not ready');
      return guard(async () => {
        if (!(team === 0 ? ['frame', 'receipt', 'setup', 'commit'] : ['command', 'ack', 'ready', 'committed']).includes(kind) ||
            !payload || typeof payload !== 'object' || Array.isArray(payload) || bytes(payload) > 1024) throw Error('Invalid outgoing message');
        const result = await request('/messages', 'POST', { matchId, kind, payload });
        if (!exact(result, ['sequence']) || !Number.isSafeInteger(result.sequence) || result.sequence < 1) throw Error('Invalid send receipt');
        return result.sequence;
      });
    }
    function poll(handle) {
      if (polling) return polling;
      if (phase !== 'ready' || typeof handle !== 'function') return Promise.reject(Error('Peer/handler not ready'));
      polling = guard(async () => {
        const result = await request('/messages');
        if (!exact(result, ['messages']) || !Array.isArray(result.messages) || result.messages.length > 32) throw Error('Invalid message batch');
        const allowed = team === 0 ? ['command', 'ack', 'ready', 'committed'] : ['frame', 'receipt', 'setup', 'commit'];
        // Validate the entire batch before invoking any gameplay callback.
        let previous = null;
        for (const message of result.messages) {
          if (!exact(message, ['matchId', 'senderSid', 'team', 'sequence', 'kind', 'payload']) ||
              message.matchId !== matchId || message.team !== 1 - team || message.senderSid !== members[1 - team].sid ||
              !allowed.includes(message.kind) || !Number.isSafeInteger(message.sequence) || message.sequence < 1 ||
              (previous !== null && message.sequence !== previous + 1) ||
              (previous === null && message.sequence > lastHandled + 1) ||
              !message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload) || bytes(message.payload) > 1024) throw Error('Invalid sender or message sequence');
          previous = message.sequence;
        }
        for (const message of result.messages) {
          if (!active()) throw Error('Session ended');
          if (message.sequence <= lastHandled) continue;
          if (await handle(message.kind, message.payload, message.senderSid) !== true) throw Error('Message handler rejected payload');
          if (!active()) throw Error('Session ended');
          lastHandled = message.sequence;
        }
        if (result.messages.length) {
          const ack = await request('/messages/ack', 'POST', { matchId, sequence: lastHandled });
          if (!exact(ack, ['acknowledged']) || ack.acknowledged !== lastHandled) throw Error('Invalid transport acknowledgment');
        }
        return result.messages.length;
      }).finally(() => { polling = null; });
      return polling;
    }
    return Object.freeze({ connect, refreshRoster, send, poll, snapshot, close: () => stop(false) });
  }
  root.CK_AUTH_TRANSPORT = Object.freeze({ createClient });
})(typeof window !== 'undefined' ? window : globalThis);
