/* Crown & Kingdoms — deterministic multiplayer protocol primitives (CK-007/008).
 * The opt-in authenticated battlefield uses these guarded command/frame primitives.
 * Legacy Supabase rooms remain marker-only. Identity must come from the authenticated
 * relay; map signatures alone never prove synchronized gameplay. */
(function (root) {
  'use strict';
  const VERSION = 2;
  const MAX_UNITS_PER_ORDER = 96;
  const MAX_ORDER_BYTES = 1024;
  const VALID_TYPES = new Set(['stop', 'move', 'attack-move', 'attack', 'gather', 'build', 'train', 'research', 'stance', 'rally', 'cancel', 'garrison', 'repair', 'unload', 'disembark']);
  const HEX = n => (n >>> 0).toString(16).padStart(8, '0');

  function isRecord(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function validId(s) { return typeof s === 'string' && /^[ub][1-9][0-9]{0,11}$/.test(s); }
  function validResourceId(s) { return typeof s === 'string' && /^n[1-9][0-9]{0,11}$/.test(s); }
  function byteSize(p) {
    const json = JSON.stringify(p);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).length;
    return unescape(encodeURIComponent(json)).length;
  }
  function validPoint(p, mapSize) {
    return isRecord(p) && Object.keys(p).length === 2 &&
      Object.keys(p).every(k => k === 'x' || k === 'y') &&
      Number.isFinite(p.x) && Number.isFinite(p.y) &&
      p.x >= 0 && p.y >= 0 && p.x < mapSize && p.y < mapSize;
  }
  function validOrder(order, mapSize) {
    if (!isRecord(order) || !VALID_TYPES.has(order.type) || !Number.isInteger(mapSize) || mapSize < 1 || mapSize > 1024) return false;
    if (!Array.isArray(order.entities) || !order.entities.length || order.entities.length > MAX_UNITS_PER_ORDER ||
        !order.entities.every(validId) || new Set(order.entities).size !== order.entities.length) return false;
    if (['move', 'attack-move', 'build', 'rally', 'disembark'].includes(order.type) && !validPoint(order.point, mapSize)) return false;
    if (['attack', 'garrison', 'repair'].includes(order.type) && !validId(order.target)) return false;
    if (order.type === 'gather' && !validResourceId(order.target)) return false;
    if (['build', 'train', 'research', 'stance'].includes(order.type) &&
        (typeof order.value !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/.test(order.value))) return false;
    if (order.type === 'rally' && order.target != null && !validId(order.target)) return false;
    // Training admits only the ordinary request and the Xbox five-unit batch.
    if (Object.hasOwn(order, 'count') &&
        (order.type !== 'train' || ![1, 5].includes(order.count))) return false;
    // No extra or executable data is admitted on a network order.
    const fields = ['type', 'entities'];
    if (['move', 'attack-move', 'build', 'rally', 'disembark'].includes(order.type)) fields.push('point');
    if (['attack', 'gather', 'garrison', 'repair'].includes(order.type) || order.type === 'rally' && order.target != null) fields.push('target');
    if (['build', 'train', 'research', 'stance'].includes(order.type)) fields.push('value');
    if (order.type === 'train') fields.push('count');
    return Object.keys(order).every(k => fields.includes(k));
  }
  function validPacket(p, mapSize) {
    if (!isRecord(p) || p.v !== VERSION || typeof p.sid !== 'string' ||
        p.sid.length < 3 || p.sid.length > 80 || /[\u0000-\u001f\u007f]/.test(p.sid) ||
        !Number.isSafeInteger(p.seq) || p.seq < 1 ||
        !Number.isSafeInteger(p.frame) || p.frame < 0 ||
        !Number.isInteger(p.team) || p.team < 0 || p.team > 7 ||
        !validOrder(p.order, mapSize) ||
        !Object.keys(p).every(k => ['v', 'sid', 'seq', 'frame', 'team', 'order'].includes(k))) return false;
    return byteSize(p) <= MAX_ORDER_BYTES;
  }

  // Network client input is NEVER applied here. A future host must look up
  // session -> team from authenticated room membership and entity -> team from
  // authoritative game state. Never trust the packet's claimed team by itself.
  function createInbox({ mapSize, teamForSid, ownsEntity, delayFrames = 3, maxAhead = 120 }) {
    if (typeof teamForSid !== 'function' || typeof ownsEntity !== 'function' ||
        !Number.isInteger(delayFrames) || delayFrames < 1 ||
        !Number.isInteger(maxAhead) || maxAhead <= delayFrames) throw Error('Invalid sync inbox configuration');
    const last = new Map();
    const queue = new Map();
    function receive(p, senderSid, currentFrame) {
      if (!validPacket(p, mapSize) || p.sid !== senderSid || !Number.isSafeInteger(currentFrame) || currentFrame < 0) return { ok: false, reason: 'invalid' };
      const team = teamForSid(senderSid);
      if (!Number.isInteger(team) || team !== p.team) return { ok: false, reason: 'ownership' };
      const expected = (last.get(senderSid) || 0) + 1;
      if (p.seq !== expected) return { ok: false, reason: p.seq < expected ? 'duplicate' : 'gap', expected };
      if (p.frame < currentFrame + delayFrames) return { ok: false, reason: 'late' };
      if (p.frame > currentFrame + maxAhead) return { ok: false, reason: 'too-far-ahead' };
      if (!p.order.entities.every(id => ownsEntity(id, team))) return { ok: false, reason: 'ownership' };
      // Attack/gather target belongs to either side; target validity is checked
      // against the live world when applying the order.
      last.set(senderSid, p.seq);
      if (!queue.has(p.frame)) queue.set(p.frame, []);
      // Clone immediately: caller-side mutation after validation must never
      // change which command the authoritative host eventually executes.
      queue.get(p.frame).push(JSON.parse(JSON.stringify(p)));
      return { ok: true };
    }
    function drain(frame) {
      if (!Number.isSafeInteger(frame) || frame < 0) throw Error('Invalid simulation frame');
      // Missing a deadline is a fatal synchronisation error, never drop an order silently.
      if ([...queue.keys()].some(f => f < frame)) throw Error('Missed multiplayer command frame');
      const result = queue.get(frame) || [];
      queue.delete(frame);
      // Compare session IDs by UTF-16 code units, not locale-sensitive collation.
      // Host journals and guest validation must agree across browser locales.
      return result.sort((a, b) => a.team - b.team ||
        (a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0) || a.seq - b.seq);
    }
    function pending() { return [...queue.values()].reduce((n, items) => n + items.length, 0); }
    return Object.freeze({ receive, drain, pending });
  }

  function stableValue(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 1000000) / 1000000 : null;
    if (value == null || typeof value === 'boolean' || typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(stableValue);
    if (isRecord(value)) {
      const obj = {};
      for (const key of Object.keys(value).sort()) {
        if (typeof value[key] !== 'function' && value[key] !== undefined) obj[key] = stableValue(value[key]);
      }
      return obj;
    }
    return null;
  }
  function checksum(snapshot) {
    // Require an explicit, serialisable gameplay projection (not live circular
    // unit objects). Canonical key ordering prevents insertion-order drift.
    const json = JSON.stringify(stableValue(snapshot));
    let hash = 0x811c9dc5;
    for (let i = 0; i < json.length; i++) {
      hash ^= json.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return 'fnv1a32-' + HEX(hash) + '-' + json.length.toString(16);
  }
  function compareCheckpoint(local, remote) {
    if (!isRecord(local) || !isRecord(remote) ||
        !Number.isSafeInteger(local.frame) || local.frame < 0 ||
        !Number.isSafeInteger(remote.frame) || remote.frame < 0 ||
        typeof local.hash !== 'string' || typeof remote.hash !== 'string' ||
        !/^fnv1a32-[0-9a-f]{8}-[0-9a-f]+$/.test(local.hash) ||
        !/^fnv1a32-[0-9a-f]{8}-[0-9a-f]+$/.test(remote.hash)) return 'invalid';
    if (local.frame !== remote.frame) return 'different-frame';
    return local.hash === remote.hash ? 'match' : 'desync';
  }
  // A two-human match locks each player to a different existing kingdom.
  // This is a host-published roster, not authentication: before actual remote
  // commands are accepted, the transport must provide a non-forgeable sender ID.
  function validSid(s) {
    return typeof s === 'string' && s.length >= 3 && s.length <= 80 &&
      !/[\u0000-\u001f\u007f]/.test(s);
  }
  function lockRoster(hostSid, guestSid, kingdomCount) {
    if (!validSid(hostSid) || !validSid(guestSid) || hostSid === guestSid ||
        !Number.isInteger(kingdomCount) || kingdomCount < 2 || kingdomCount > 4) {
      throw Error('A two-human match needs two distinct sessions and at least two kingdoms');
    }
    return Object.freeze({
      v: VERSION, kingdomCount,
      slots: Object.freeze([
        Object.freeze({ sid: hostSid, team: 0, role: 'host' }),
        Object.freeze({ sid: guestSid, team: 1, role: 'guest' })
      ])
    });
  }
  function validRoster(raw, hostSid, localSid, kingdomCount) {
    if (!isRecord(raw) || raw.v !== VERSION || raw.kingdomCount !== kingdomCount ||
        !Array.isArray(raw.slots) || raw.slots.length !== 2 ||
        !validSid(hostSid) || !validSid(localSid) ||
        !raw.slots.every(isRecord) ||
        raw.slots.some(s => Object.keys(s).length !== 3)) return false;
    const [host, guest] = raw.slots;
    return host.sid === hostSid && host.team === 0 && host.role === 'host' &&
      validSid(guest.sid) && guest.sid !== hostSid && guest.team === 1 && guest.role === 'guest' &&
      (localSid === hostSid || localSid === guest.sid);
  }
  function rosterTeam(roster, sid) {
    if (!roster || !Array.isArray(roster.slots)) return null;
    const slot = roster.slots.find(p => p.sid === sid);
    return slot && Number.isInteger(slot.team) ? slot.team : null;
  }

  // Host-side authoritative command queue. Transport senderSid must already
  // be VERIFIED by the server/transport (not copied from the packet payload).
  // Entity ownership is rechecked both when queued and at the execution frame;
  // a unit converted, destroyed or transferred in the meantime cannot execute.
  function createCommandHost({ roster, mapSize, lookupEntity, execute,
                               delayFrames = 3, maxAhead = 120 }) {
    if (!roster || !Array.isArray(roster.slots) || roster.slots.length !== 2 ||
        !validRoster(roster, roster.slots[0].sid, roster.slots[0].sid, roster.kingdomCount) ||
        typeof lookupEntity !== 'function' || typeof execute !== 'function') {
      throw Error('Invalid authoritative host setup');
    }
    function allowed(order, team) {
      if (!validOrder(order, mapSize)) return false;
      const buildingAction = ['train', 'research', 'rally', 'cancel', 'unload'].includes(order.type);
      const unitAction = ['stop', 'move', 'attack-move', 'attack', 'gather', 'build', 'stance', 'garrison', 'repair', 'disembark'].includes(order.type);
      if (buildingAction && order.type !== 'train' && order.entities.length !== 1) return false;
      if (!buildingAction && !unitAction) return false;
      return order.entities.every(id => {
        const entity = lookupEntity(id);
        return entity && entity.netId === id && entity.t === team &&
          Number.isFinite(entity.hp) && entity.hp > 0 &&
          (buildingAction ? id[0] === 'b' && !!entity.done : id[0] === 'u' && !entity.ld);
      });
    }
    const inbox = createInbox({
      mapSize, delayFrames, maxAhead,
      teamForSid: sid => rosterTeam(roster, sid),
      ownsEntity: (id, team) => {
        const entity = lookupEntity(id);
        return !!entity && entity.netId === id && entity.t === team &&
          Number.isFinite(entity.hp) && entity.hp > 0;
      }
    });
    function receive(packet, trustedSenderSid, currentFrame) {
      if (!validPacket(packet, mapSize) || !allowed(packet.order, packet.team))
        return { ok: false, reason: 'unauthorized-order' };
      // Inbox also verifies identity, sequence, team, ownership and deadlines.
      const result = inbox.receive(packet, trustedSenderSid, currentFrame);
      return result;
    }
    function applyFrameWithJournal(frame) {
      // Only successfully executed actions enter the immutable replay journal.
      // Rejected orders still receive individual application acknowledgements.
      const commands = [], results = [];
      for (const p of inbox.drain(frame)) {
        let reason = null, ok = false;
        if (!allowed(p.order, p.team)) reason = 'stale-ownership';
        else {
          try {
            ok = execute(JSON.parse(JSON.stringify(p.order)), p.team, frame) === true;
            if (!ok) reason = 'rejected-by-simulation';
          } catch (_) { reason = 'simulation-error'; }
        }
        results.push(Object.freeze({ sid:p.sid, seq:p.seq, frame, ok, reason }));
        if (ok) {
          const order = JSON.parse(JSON.stringify(p.order));
          Object.freeze(order.entities);
          if (order.point) Object.freeze(order.point);
          Object.freeze(order);
          commands.push(Object.freeze({ v:VERSION, sid:p.sid, seq:p.seq, frame,
            team:p.team, order }));
        }
      }
      return Object.freeze({
        frame,
        results:Object.freeze(results),
        journal:Object.freeze({ v:VERSION, frame, commands:Object.freeze(commands) })
      });
    }
    function applyFrame(frame) { return applyFrameWithJournal(frame).results; }
    return Object.freeze({ receive, applyFrame, applyFrameWithJournal, pending: inbox.pending });
  }

  // A future authenticated guest transport can feed this one-frame-at-a-time
  // replay gate. It never trusts a Broadcast packet's claimed host identity;
  // the caller MUST supply a server-verified sender identity independently.
  // CK_LIVE_SESSION feeds this gate only after the relay binds the host identity.
  function createFrameReplica({ roster, mapSize, execute, startFrame = 0, maxCommands = 96 }) {
    if (!roster || !Array.isArray(roster.slots) || roster.slots.length !== 2 ||
        !validRoster(roster, roster.slots[0].sid, roster.slots[0].sid, roster.kingdomCount) ||
        typeof execute !== 'function' || !Number.isInteger(mapSize) ||
        mapSize < 1 || mapSize > 1024 || !Number.isSafeInteger(startFrame) ||
        startFrame < 0 || !Number.isInteger(maxCommands) ||
        maxCommands < 1 || maxCommands > 96) throw Error('Invalid frame replica configuration');
    const hostSid = roster.slots[0].sid;
    let lastFrame = startFrame, halted = false;
    const appliedSeq = new Map();
    function receive(journal, trustedSenderSid) {
      if (halted) return { ok:false, reason:'halted' };
      if (trustedSenderSid !== hostSid) return { ok:false, reason:'untrusted-host' };
      if (!isRecord(journal) || Object.keys(journal).length !== 3 ||
          journal.v !== VERSION || !Number.isSafeInteger(journal.frame) ||
          journal.frame < 1 || !Array.isArray(journal.commands) ||
          journal.commands.length > maxCommands) return { ok:false, reason:'invalid' };
      if (journal.frame <= lastFrame) return { ok:false, reason:'replay' };
      if (journal.frame !== lastFrame + 1) return { ok:false, reason:'missing-frame' };
      // Validate the COMPLETE batch before applying a single operation.
      const seen = new Set();
      const nextSeq = new Map();
      let previous = null;
      for (const p of journal.commands) {
        if (!validPacket(p, mapSize) || p.frame !== journal.frame ||
            rosterTeam(roster, p.sid) !== p.team ||
            !p.order.entities.length) return { ok:false, reason:'invalid-order' };
        const key = p.sid + ':' + p.seq;
        if (seen.has(key)) return { ok:false, reason:'duplicate-order' };
        seen.add(key);
        // A legitimate denied host order may leave a gap in the accepted
        // journal, but a guest must never replay an older accepted sequence.
        const prior = nextSeq.has(p.sid) ? nextSeq.get(p.sid) : (appliedSeq.get(p.sid) || 0);
        if (p.seq <= prior) return { ok:false, reason:'replayed-command' };
        nextSeq.set(p.sid, p.seq);
        if (previous && (previous.team > p.team ||
            previous.team === p.team && (previous.sid > p.sid ||
            previous.sid === p.sid && previous.seq >= p.seq))) {
          return { ok:false, reason:'unsorted-orders' };
        }
        previous = p;
      }
      for (const p of journal.commands) {
        try {
          if (execute(JSON.parse(JSON.stringify(p.order)), p.team, journal.frame) !== true) {
            halted = true;
            return { ok:false, reason:'replica-application-failed', frame:journal.frame };
          }
        } catch (_) {
          halted = true;
          return { ok:false, reason:'replica-application-failed', frame:journal.frame };
        }
      }
      lastFrame = journal.frame;
      for (const [sid, seq] of nextSeq) appliedSeq.set(sid, seq);
      return { ok:true, frame:lastFrame, applied:journal.commands.length };
    }
    return Object.freeze({ receive, state:()=>Object.freeze({ lastFrame, halted }) });
  }

  // Produce a stable, gameplay-only state projection for MATCHED-frame
  // desync checks. The renderer, camera, local selection and audio cues are
  // intentionally excluded: they differ legitimately between controllers.
  // This is diagnostic coverage, not an authoritative reconnect snapshot.
  function worldCheckpoint(world, frame) {
    if (!isRecord(world) || !Number.isSafeInteger(frame) || frame < 0 ||
        !Array.isArray(world.us) || !Array.isArray(world.bs) ||
        !Array.isArray(world.nodes) || !Array.isArray(world.res) ||
        !Array.isArray(world.age) || !world.r || typeof world.r.state !== 'function') {
      throw Error('Cannot checksum an invalid simulation world');
    }
    const nodes = new Map(world.nodes.map((n, i) => [n, 'n' + i]));
    const relics = new Map((world.rel || []).map((n, i) => [n, 'r' + i]));
    const ref = o => {
      if (!o) return null;
      if (validId(o.netId) || validResourceId(o.netId)) return o.netId;
      return nodes.get(o) || relics.get(o) || null;
    };
    const sorted = list => list.sort((a, b) => a.id.localeCompare(b.id));
    const units = sorted(world.us.filter(u => u && u.hp > 0).map(u => ({
      id: u.netId, team:u.t, kind:u.k, x:u.x, y:u.y, hp:u.hp,
      order:u.o, path:u.p || [], target:ref(u.tg), load:ref(u.ld),
      cargo:u.car || 0, cargoType:u.ct, tradeCargo:u.tradeCargo || 0,
      tradeFromKey:u.tradeFromKey, cd:u.cd, retry:u.rp, ret:u.ret,
      autoWorker:u.autoWorker, ut:u.ut, unloadBeach:u.unloadBeach,
      retreating:u.retreating, retreatTarget:ref(u.retreatTarget),
      garrisoned:(u.cg || []).map(ref)
    })));
    const buildings = sorted(world.bs.filter(b => b && b.hp > 0).map(b => ({
      id:b.netId, team:b.t, kind:b.k, x:b.x, y:b.y,
      hp:b.hp, maxHealth:b.mh, complete:b.done, progress:b.pr,
      queue:b.q, researching:b.rs, cooldown:b.cd,
      rally:b.rally ? {x:b.rally.x,y:b.rally.y,target:ref(b.rally.t)} : null,
      garrisoned:(b.cg || []).map(ref)
    })));
    const projection = {
      v:VERSION, t:world.t, rng:world.r.state(), netNext:world.netNext,
      resources:world.res, age:world.age, tech:world.tech,
      civ:world.civ, diplomacy:world.dip, priorities:world.vp,
      victory:world.vc || [0,0], hill:world.kh, victoryTimer:world.vt,
      result:world.over || null, resultReason:world.why || null,
      landGrid:world.g ? Array.from(world.g) : null,
      waterGrid:world.wt ? Array.from(world.wt) : null,
      nodes:world.nodes.map(n => ({
        id:n.netId || null, kind:n.k, x:n.x, y:n.y, amount:n.amt, owner:n.t,
        farm:n.fm, animal:n.an, fish:n.fi, trap:n.trap
      })),
      units, buildings,
      projectiles:(world.pj || []).map(p => ({
        x:p.x,y:p.y,target:ref(p.t),attacker:p.a ? {kind:p.a.k,team:p.a.t} : null
      })),
      relics:(world.rel || []).map(r => ({x:r.x,y:r.y,carrier:ref(r.c),monastery:ref(r.m)})),
      ai:(world.ai || []).map(a => ({
        cooldown:a.cd, wave:a.wave, nextAttack:a.nx, strategy:a.rn,
        lastMarketTrade:a.lastMarketTrade ?? -99, lastTributeAt:a.lastTributeAt ?? -90,
        defenseAt:a.lastRaidDefense ?? -99, retryAt:a.targetRetryAt ?? 0,
        on:a.on || 0, workers:a.ws || 0,
        workerIds:(a.wu || []).map(ref), knownTargets:[...(a.kn || [])].map(ref).sort()
      }))
    };
    return Object.freeze({ frame, hash:checksum(projection) });
  }

  // Diagnostic-only live checkpoint pairing. Different render rates may cause
  // packets to arrive before or after the corresponding local simulation frame.
  // Pair ONLY identical frame numbers, keep bounded history, and never mistake
  // a matching hash for authenticated/authoritative multiplayer.
  function createCheckpointTracker({ cadence = 300, capacity = 12 } = {}) {
    if (!Number.isSafeInteger(cadence) || cadence < 1 ||
        !Number.isSafeInteger(capacity) || capacity < 2 || capacity > 120) {
      throw Error('Invalid checkpoint tracker configuration');
    }
    const local = new Map(), remote = new Map(), seenRemote = new Map();
    let latestLocalFrame = 0, compared = 0, mismatches = 0, last = null;
    const result = (status, frame) => Object.freeze({ status, frame });
    function valid(cp) {
      return isRecord(cp) && Object.keys(cp).length === 2 &&
        Number.isSafeInteger(cp.frame) && cp.frame > 0 && cp.frame % cadence === 0 &&
        typeof cp.hash === 'string' &&
        /^fnv1a32-[0-9a-f]{8}-[0-9a-f]+$/.test(cp.hash);
    }
    function resolve(frame) {
      if (!local.has(frame) || !remote.has(frame)) return result('waiting', frame);
      const status = compareCheckpoint(
        { frame, hash: local.get(frame) },
        { frame, hash: remote.get(frame) }
      );
      local.delete(frame);
      remote.delete(frame);
      compared++;
      if (status === 'desync') mismatches++;
      last = result(status, frame);
      return last;
    }
    function trim() {
      const oldest = Math.max(0, latestLocalFrame - cadence * capacity);
      for (const bucket of [local, remote, seenRemote]) {
        for (const frame of bucket.keys()) if (frame <= oldest) bucket.delete(frame);
      }
    }
    function recordLocal(cp) {
      if (!valid(cp)) return result('invalid', -1);
      if (cp.frame <= latestLocalFrame) return result('stale', cp.frame);
      latestLocalFrame = cp.frame;
      local.set(cp.frame, cp.hash);
      const outcome = resolve(cp.frame);
      trim();
      return outcome;
    }
    function recordRemote(cp) {
      if (!valid(cp)) return result('invalid', -1);
      if (cp.frame <= latestLocalFrame - cadence * capacity ||
          cp.frame > latestLocalFrame + cadence * capacity) {
        return result('out-of-window', cp.frame);
      }
      if (seenRemote.has(cp.frame)) {
        return result(seenRemote.get(cp.frame) === cp.hash ? 'duplicate' : 'conflicting', cp.frame);
      }
      seenRemote.set(cp.frame, cp.hash);
      remote.set(cp.frame, cp.hash);
      const outcome = resolve(cp.frame);
      trim();
      return outcome;
    }
    function stats() {
      return Object.freeze({ compared, mismatches, latestLocalFrame, last });
    }
    return Object.freeze({ recordLocal, recordRemote, stats });
  }

  root.CK_SIM_SYNC = Object.freeze({ VERSION, validId, validResourceId, validOrder, validPacket, createInbox, checksum, compareCheckpoint, lockRoster, validRoster, rosterTeam, createCommandHost, createFrameReplica, worldCheckpoint, createCheckpointTracker });
})(typeof window !== 'undefined' ? window : globalThis);

