/* Crown & Kingdoms — authoritative in-simulation command adapter.
 * This is intentionally NOT connected to Supabase Broadcast. A remote packet
 * must first pass independently authenticated sender binding and the host's
 * CK_SIM_SYNC.createCommandHost() queue before execute() is called.
 * The current online room remains markers only.
 */
(function (root) {
  'use strict';
  const STANCES = Object.freeze({
    aggressive: 0, defensive: 1, 'stand-ground': 2, passive: 3, 'no-attack': 4
  });

  function lookup(id) {
    if (!root.CK_SIM_SYNC || !root.CK_SIM_SYNC.validId(id) || !S) return null;
    const list = id[0] === 'u' ? S.us : S.bs;
    if (!Array.isArray(list)) return null;
    return list.find(e => e && e.netId === id) || null;
  }

  function owned(order, team) {
    const objects = order.entities.map(lookup);
    if (!objects.length || objects.some((e, i) => !e || e.netId !== order.entities[i] ||
        e.t !== team || !Number.isFinite(e.hp) || e.hp <= 0)) return null;
    return objects;
  }

  function activeUnits(objects) {
    return objects.every(u => u.netId[0] === 'u' && !u.ld && U[u.k]);
  }
  function activeBuildings(objects) {
    return objects.length > 0 && objects.every(b => b.netId[0] === 'b' && b.done && B[b.k]);
  }

  function moveUnits(units, point) {
    // Precompute every route before changing any unit command. Failed
    // all-member orders cannot strand a partly updated selection.
    const routes = [];
    for (const u of units) {
      const distance = Math.hypot(u.x - point.x, u.y - point.y);
      const route = distance <= 1 ? [] : path(u, gp(point.x, point.y, 1));
      if (!route && distance > 1) return false;
      routes.push(route || []);
    }
    units.forEach((u, i) => {
      u.o = routes[i].length ? 'm' : 'i';
      u.p = routes[i].slice();
      u.pt = null;
      u.tg = null;
      u.as = 0;
      u.autoWorker = 0;
      u.guardTarget = null;
      u.rp = 1;
      if (u.k === 'cart' || u.k === 'cog') {
        u.manualTradeMove = true;
        u.tradePaused = false;
      }
    });
    return true;
  }

  function execute(order, team, frame) {
    // This is a production simulation adapter, not a trust boundary. The
    // createCommandHost inbox rechecks the sender, frame and ownership first.
    if (!S || mode !== 'play' || !root.CK_SIM_SYNC ||
        !Number.isSafeInteger(frame) || frame < 0 ||
        !Number.isInteger(team) || team < 0 || team >= S.teamN ||
        !root.CK_SIM_SYNC.validOrder(order, W) ||
        !Number.isInteger(W) || H !== W) return false;
    const entities = owned(order, team);
    if (!entities) return false;

    if (order.type === 'train' || order.type === 'research' ||
        order.type === 'rally' || order.type === 'cancel') {
      if (!activeBuildings(entities) || order.type !== 'train' && entities.length !== 1) return false;
      const b = entities[0];
      if (order.type === 'train') {
        const count = Object.hasOwn(order, 'count') ? order.count : 1;
        const buildings = entities.filter(b => Array.isArray(b.q) && !b.rs &&
          Array.isArray(B[b.k].tr) && B[b.k].tr.includes(order.value));
        let queued = 0;
        // Match solo batching: each accepted unit pays its own cost and
        // reserves population/queue space. Stop at the first rejected unit.
        for (let i = 0; i < count; i++) {
          // Stable ties follow selection order, just as trainSelection() does.
          const ordered = buildings.slice().sort((a, b) => a.q.length - b.q.length);
          if (!ordered.some(building => train(building, order.value) === true)) break;
          queued++;
        }
        return queued > 0;
      }
      if (order.type === 'research') return research(b, order.value) === true;
      if (order.type === 'cancel') return cancelQ(b) === true;
      if (!Array.isArray(B[b.k].tr) || !B[b.k].tr.length || order.target != null)
        return false;
      b.rally = { x: order.point.x, y: order.point.y, t: null };
      return true;
    }

    if (!activeUnits(entities)) return false;

    if (order.type === 'stop') {
      for (const u of entities) {
        u.o = 'i'; u.p = []; u.tg = null; u.pt = null; u.rp = 0;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null; u.ret = 0;
        u.retreating = false; u.retreatTarget = null;
        u.retreatRestUntil = 0; u.retreatRouteRetryAt = 0;
        u.ut = null; u.unloadBeach = null; u.unloadRouteRetryAt = 0;
        if (u.k === 'cart' || u.k === 'cog') {
          u.tradePaused = true; u.manualTradeMove = false;
        }
      }
      return true;
    }
    if (order.type === 'move') return moveUnits(entities, order.point);
    if (order.type === 'attack-move') {
      if (entities.some(u => ['vil', 'fish', 'cart', 'cog', 'trn', 'mon'].includes(u.k)))
        return false;
      for (const u of entities) {
        u.pt = { a: [u.x, u.y], b: [order.point.x, order.point.y], to: 1, once: true };
        u.o = 'p'; u.tg = null; u.p = []; u.rp = 0;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null;
      }
      return true;
    }
    if (order.type === 'attack') {
      const target = lookup(order.target);
      if (!target || target.hp <= 0 || target.ld || !isHostile(team, target.t) ||
          entities.some(u => u.st === 4 || !U[u.k] || !(U[u.k].dmg > 0)))
        return false;
      // Visibility/line-of-sight authentication is not implemented for both
      // human teams. DO NOT expose this adapter to untrusted network traffic.
      for (const u of entities) {
        u.o = 'a'; u.tg = target; u.p = []; u.pt = null; u.rp = 0;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null;
      }
      return true;
    }
    if (order.type === 'stance') {
      if (!Object.prototype.hasOwnProperty.call(STANCES, order.value) ||
          entities.some(u => u.k === 'vil')) return false;
      const stance = STANCES[order.value];
      for (const u of entities) {
        u.st = stance;
        if (stance === 4 && (u.o === 'a' || u.o === 'v')) {
          u.o = 'i'; u.tg = null; u.p = [];
        }
      }
      return true;
    }
    // "gather" needs persistent resource-node IDs, and "build" needs
    // visibility, site, builder and network-identity acceptance first.
    return false;
  }

  root.CK_GAME_COMMANDS = Object.freeze({
    lookup,
    execute,
    implementedTypes: Object.freeze([
      'move', 'stop', 'attack-move', 'attack', 'train', 'research', 'rally', 'stance', 'cancel'
    ])
  });
})(typeof window !== 'undefined' ? window : globalThis);

