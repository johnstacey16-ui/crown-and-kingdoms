/* Authenticated opening-state agreement. Verification never starts simulation. */
(function(root){
  'use strict';
  const VERSION = 'ck-auth-start-1';
  const exact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) &&
    Object.keys(o).length === keys.length && keys.every(k => Object.hasOwn(o, k));
  function create({ transport, validateConfig, prepare, now = Date.now, timeoutMs = 30000 }) {
    if (!transport || typeof validateConfig !== 'function' || typeof prepare !== 'function' ||
        !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) throw Error('Invalid startup options');
    const identity = transport.snapshot();
    if (identity.phase !== 'ready' || identity.members.length !== 2) throw Error('Two authenticated players required');
    let phase = 'waiting', config = null, hash = null, deadline = null, pumping = null;
    const live = () => !['failed', 'closed'].includes(phase);
    const hashOK = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value);
    function snapshot() { return Object.freeze({ phase, config, hash, team: identity.team, matchId: identity.matchId }); }
    function close() { phase = 'closed'; transport.close(); }
    function fail() { phase = 'failed'; transport.close(); }
    function current() {
      const room = transport.snapshot();
      if (!live() || room.phase !== 'ready' || room.members.length !== 2 || room.team !== identity.team || room.matchId !== identity.matchId ||
          room.members.some((member, i) => member.sid !== identity.members[i]?.sid)) throw Error('Startup room ended');
      if (deadline !== null && now() >= deadline) throw Error('Startup timed out');
    }
    async function generate(value) {
      if (!validateConfig(value)) throw Error('Invalid starting settings');
      // Starting settings are a flat numeric record, owned immutably by this handshake.
      if (!value || Array.isArray(value) || !Object.values(value).every(Number.isSafeInteger)) throw Error('Invalid settings record');
      config = Object.freeze({ ...value });
      const result = await prepare(config);
      current();
      if (!hashOK(result)) throw Error('Invalid opening hash');
      hash = result;
    }
    async function begin(settings) {
      if (identity.team !== 0 || phase !== 'waiting') throw Error('Only the waiting host can prepare a match');
      phase = 'preparing'; deadline = now() + timeoutMs;
      try {
        current(); await generate(settings);
        await transport.send('setup', { v: VERSION, config, hash });
        current(); phase = 'awaiting-ready';
      } catch (error) { if (live()) fail(); throw error; }
    }
    async function receive(kind, payload, sender) {
      current();
      if (sender !== identity.members[1 - identity.team].sid || payload?.v !== VERSION) throw Error('Wrong startup peer/version');
      if (identity.team === 1 && phase === 'waiting' && kind === 'setup') {
        if (!exact(payload, ['v', 'config', 'hash']) || !hashOK(payload.hash)) throw Error('Invalid setup');
        phase = 'preparing'; deadline = now() + timeoutMs;
        await generate(payload.config);
        if (hash !== payload.hash) throw Error('Opening worlds differ');
        await transport.send('ready', { v: VERSION, hash });
        current(); phase = 'awaiting-commit'; return true;
      }
      if (!exact(payload, ['v', 'hash']) || payload.hash !== hash) throw Error('Wrong opening confirmation');
      if (identity.team === 0 && phase === 'awaiting-ready' && kind === 'ready') {
        await transport.send('commit', { v: VERSION, hash });
        current(); phase = 'awaiting-commit-ack'; return true;
      }
      if (identity.team === 1 && phase === 'awaiting-commit' && kind === 'commit') {
        await transport.send('committed', { v: VERSION, hash });
        current(); phase = 'verified'; deadline = null; return true;
      }
      if (identity.team === 0 && phase === 'awaiting-commit-ack' && kind === 'committed') {
        phase = 'verified'; deadline = null; return true;
      }
      throw Error('Unexpected startup message');
    }
    function pump() {
      if (pumping) return pumping;
      pumping = (async () => {
        try {
          current();
          // Do not consume gameplay envelopes after the startup consumer hands off.
          if (phase !== 'verified') await transport.poll(receive);
          current(); return snapshot();
        } catch (error) { if (live()) fail(); throw error; }
      })().finally(() => { pumping = null; });
      return pumping;
    }
    return Object.freeze({ begin, pump, snapshot, close });
  }
  root.CK_MATCH_STARTUP = Object.freeze({ create, VERSION });
})(typeof window !== 'undefined' ? window : globalThis);
