/* Crown & Kingdoms — deterministic multiplayer protocol primitives (CK-007/008).
 * This is NOT the live multiplayer simulation. The current transport still carries
 * lobby/presence markers only; simulation commands must not be enabled until team
 * ownership, stable entity IDs and an authoritative tick clock are integrated.
 * Never treat a map signature or these unit-tested primitives as live match proof. */
(function (root) {
  'use strict';
  const VERSION = 2;
  const MAX_UNITS_PER_ORDER = 96;
  const MAX_ORDER_BYTES = 1024;
  const VALID_TYPES = new Set(['move', 'attack-move', 'attack', 'gather', 'build', 'train', 'research', 'stance', 'rally']);
  const HEX = n => (n >>> 0).toString(16).padStart(8, '0');

  function isRecord(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function validId(s) { return typeof s === 'string' && /^[ub][1-9][0-9]{0,11}$/.test(s); }
  function byteSize(p) {
    const json = JSON.stringify(p);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).length;
    return unescape(encodeURIComponent(json)).length;
  }
  function validPoint(p, mapSize) {
    return isRecord(p) && Number.isFinite(p.x) && Number.isFinite(p.y) &&
      p.x >= 0 && p.y >= 0 && p.x < mapSize && p.y < mapSize;
  }
  function validOrder(order, mapSize) {
    if (!isRecord(order) || !VALID_TYPES.has(order.type) || !Number.isInteger(mapSize) || mapSize < 1 || mapSize > 1024) return false;
    if (!Array.isArray(order.entities) || !order.entities.length || order.entities.length > MAX_UNITS_PER_ORDER ||
        !order.entities.every(validId) || new Set(order.entities).size !== order.entities.length) return false;
    if (['move', 'attack-move', 'build', 'rally'].includes(order.type) && !validPoint(order.point, mapSize)) return false;
    if (['attack', 'gather'].includes(order.type) && !validId(order.target)) return false;
    if (['build', 'train', 'research', 'stance'].includes(order.type) &&
        (typeof order.value !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/.test(order.value))) return false;
    if (order.type === 'rally' && order.target != null && !validId(order.target)) return false;
    // No extra or executable data is admitted on a network order.
    const fields = ['type', 'entities'];
    if (['move', 'attack-move', 'build', 'rally'].includes(order.type)) fields.push('point');
    if (['attack', 'gather'].includes(order.type) || order.type === 'rally' && order.target != null) fields.push('target');
    if (['build', 'train', 'research', 'stance'].includes(order.type)) fields.push('value');
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
      queue.get(p.frame).push(p);
      return { ok: true };
    }
    function drain(frame) {
      if (!Number.isSafeInteger(frame) || frame < 0) throw Error('Invalid simulation frame');
      // Missing a deadline is a fatal synchronisation error, never drop an order silently.
      if ([...queue.keys()].some(f => f < frame)) throw Error('Missed multiplayer command frame');
      const result = queue.get(frame) || [];
      queue.delete(frame);
      return result.sort((a, b) => a.team - b.team || a.sid.localeCompare(b.sid) || a.seq - b.seq);
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
  root.CK_SIM_SYNC = Object.freeze({ VERSION, validId, validOrder, validPacket, createInbox, checksum, compareCheckpoint });
})(typeof window !== 'undefined' ? window : globalThis);
