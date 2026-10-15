import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .filter((match) => !/type=["']application\/json["']/i.test(match[0]));
assert.ok(scripts.length, 'The real game script must be present');

const listeners = new Map();
const context2d = new Proxy({
  canvas: null,
  createImageData(width, height) {
    return { data: new Uint8ClampedArray(width * height * 4), width, height };
  },
  getImageData(x, y, width, height) {
    return { data: new Uint8ClampedArray(width * height * 4), width, height };
  },
  measureText(text) { return { width: String(text).length * 8 }; },
  createLinearGradient() { return { addColorStop() {} }; },
  createRadialGradient() { return { addColorStop() {} }; },
}, {
  get(target, key) {
    if (key in target) return target[key];
    return () => {};
  },
  set(target, key, value) { target[key] = value; return true; },
});
const canvas = {
  width: 1280, height: 720, style: {},
  getContext() { context2d.canvas = canvas; return context2d; },
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
  addEventListener() {},
};
const document = {
  hidden: false,
  documentElement: { clientWidth: 1280, clientHeight: 720 },
  getElementById(id) {
    if (id === 'c') return canvas;
    if (id === 'ck-assets') return { tagName: 'SCRIPT', textContent: '{"atlases":[]}' };
    return null;
  },
  createElement(tag) {
    if (tag === 'canvas') return { ...canvas, style: {}, getContext: () => context2d };
    return { style: {}, addEventListener() {} };
  },
  addEventListener(name, fn) { listeners.set('document:' + name, fn); },
};
const storage = new Map();
const sandbox = {
  console: { ...console, warn() {}, error() {} },
  document,
  innerWidth: 1280,
  innerHeight: 720,
  navigator: { getGamepads: () => [] },
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  setInterval() { return 1; },
  setTimeout() { return 1; },
  clearTimeout() {},
  addEventListener(name, fn) { listeners.set(name, fn); },
  removeEventListener() {},
  Image: class { set src(value) { this._src = value; } },
  Date,
  Math,
  Uint8Array,
  Uint8ClampedArray,
  Float32Array,
  Int16Array,
  Int32Array,
  ArrayBuffer,
  Map,
  Set,
  JSON,
  Promise,
};
sandbox.window = sandbox;
sandbox.window.devicePixelRatio = 1;
sandbox.window.top = sandbox.window;
sandbox.window.addEventListener = sandbox.addEventListener;
sandbox.window.CK_ASSETS = null;
sandbox.window.AudioContext = undefined;
sandbox.window.webkitAudioContext = undefined;
sandbox.requestAnimationFrame = () => {};
const source = scripts.map((match) => match[1]).join('\n');
const harness = `
let aiPeak = {};
const aiMilitaryCount = (team) => S.us.filter((u) => u.t === team && u.hp > 0 && u.k !== 'vil' && !U[u.k].sh && !['king', 'cart', 'mon'].includes(u.k)).length;
globalThis.__CK_TEST__ = {
  start(seed, age = 0) { seedOv = seed; cmp = null; gameMode = 0; startAge = age; start(); aiPeak = {}; for (let team = 1; team < S.teamN; team++) aiPeak[team] = aiMilitaryCount(team); },
  startMap(seed, mapIndex, teams = 4) { seedOv = seed; mt = mapIndex; mapLayout = 0; msz = 0; kingdoms = teams; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  startLayout(layoutIndex, teams = 4) { mapLayout = layoutIndex; applyMapLayout(); kingdoms = teams; msz = 0; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  startCampaign(index) { startScenario(index); return this.state(); },
  tick(dt) { step(dt); for (let team = 1; team < S.teamN; team++) aiPeak[team] = Math.max(aiPeak[team] || 0, aiMilitaryCount(team)); },
  completeFirstCampaignMission() {
    startScenario(0);
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    if (!tc) throw new Error('First Hearth must start with a Town Centre');
    for (const kind of ['house', 'lumber', 'bar']) {
      if (!put(0, kind, tc.x + 8, tc.y + 8)) throw new Error('Could not place campaign objective building: ' + kind);
    }
    while (S.us.filter((u) => u.t === 0 && u.k === 'vil').length < 10) {
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not spawn villagers for campaign objective test');
      addU(0, 'vil', p[0], p[1]);
    }
    while (cmil(0) < 4) {
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not spawn soldiers for campaign objective test');
      addU(0, 'mil', p[0], p[1]);
    }
    return { mission: cmp.i, requiredGoals: CAMP[cmp.i].goals.map((g) => g.id) };
  },
  beginShipRepair() {
    let pair = null;
    for (let y = 2; y < H - 2 && !pair; y++) for (let x = 2; x < W - 2 && !pair; x++) {
      if (S.wt[y * W + x] !== 1 || S.nd[y * W + x]) continue;
      for (const [dx, dy] of D8) {
        const lx = x + dx, ly = y + dy, li = ly * W + lx;
        if (S.wt[li] === 0 && !S.g[li] && !S.nd[li]) { pair = { sx: x, sy: y, vx: lx, vy: ly }; break; }
      }
    }
    if (!pair) throw new Error('Seeded map has no clear coastal tile pair for ship repair');
    const ship = addU(0, 'gal', pair.sx + 0.5, pair.sy + 0.5);
    ship.hp = U[ship.k].hp * 0.5; ship.testRepairTarget = true;
    const worker = addU(0, 'vil', pair.vx + 0.5, pair.vy + 0.5);
    S.sel = [worker];
    if (!orderSel(ship, ship.x, ship.y)) throw new Error('Real player order should accept a villager ship-repair command');
    return { hp: ship.hp, maxHp: U[ship.k].hp, order: worker.o, distance: Math.hypot(worker.x - ship.x, worker.y - ship.y) };
  },
  beginNavalCombat() {
    const pass = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 &&
      S.wt[y * W + x] === 1 && !S.nd[y * W + x];
    const seen = new Uint8Array(W * H);
    let best = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const index = y * W + x;
      if (seen[index] || !pass(x, y)) continue;
      const component = [[x, y]];
      seen[index] = 1;
      for (let head = 0; head < component.length; head++) {
        const [cx, cy] = component[head];
        for (const [dx, dy] of D8) {
          const nx = cx + dx, ny = cy + dy, ni = ny * W + nx;
          if (seen[ni] || !pass(nx, ny)) continue;
          if (dx && dy && (!pass(cx + dx, cy) || !pass(cx, cy + dy))) continue;
          seen[ni] = 1; component.push([nx, ny]);
        }
      }
      if (component.length > best.length) best = component;
    }
    if (best.length < 20) throw new Error('Seeded map has no usable water component for naval combat');
    let pair = null, bestDistance = Infinity;
    for (let i = 0; i < best.length; i++) for (let j = i + 1; j < best.length; j++) {
      const distance = Math.hypot(best[i][0] - best[j][0], best[i][1] - best[j][1]);
      if (distance >= 3 && distance <= 5 && distance < bestDistance) {
        pair = [best[i], best[j]]; bestDistance = distance;
      }
    }
    if (!pair) throw new Error('Could not find adjacent clear water tiles for opposing ships');
    const attacker = addU(0, 'gal', pair[0][0] + 0.5, pair[0][1] + 0.5);
    const target = addU(1, 'gal', pair[1][0] + 0.5, pair[1][1] + 0.5);
    target.testNavalTarget = true; attacker.o = 'a'; attacker.tg = target;
    return { attacker: { x: attacker.x, y: attacker.y }, targetHp: target.hp, targetMaxHp: U[target.k].hp, targetKey: [target.t, target.k, target.x, target.y].join(':') };
  },
  beginNavalMove() {
    const pass = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 &&
      S.wt[y * W + x] === 1 && !S.nd[y * W + x];
    const seen = new Uint8Array(W * H);
    let best = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const index = y * W + x;
      if (seen[index] || !pass(x, y)) continue;
      const component = [[x, y]];
      seen[index] = 1;
      for (let head = 0; head < component.length; head++) {
        const [cx, cy] = component[head];
        for (const [dx, dy] of D8) {
          const nx = cx + dx, ny = cy + dy, ni = ny * W + nx;
          if (seen[ni] || !pass(nx, ny)) continue;
          if (dx && dy && (!pass(cx + dx, cy) || !pass(cx, cy + dy))) continue;
          seen[ni] = 1;
          component.push([nx, ny]);
        }
      }
      if (component.length > best.length) best = component;
    }
    if (best.length < 12) throw new Error('Seeded map has no usable navigable-water component for a ship movement test');
    const start = best[0];
    let target = start, farthest = -1;
    for (const tile of best) {
      const distance = Math.hypot(tile[0] - start[0], tile[1] - start[1]);
      if (distance > farthest) { farthest = distance; target = tile; }
    }
    const ship = addU(0, 'gal', start[0] + 0.5, start[1] + 0.5);
    const goal = gp(target[0] + 0.5, target[1] + 0.5, 0.6);
    const route = path(ship, goal);
    if (!route || route.length < 6) throw new Error('Could not find a meaningful real ship route through navigable water');
    ship.testNaval = true; ship.o = 'm'; ship.p = route; ship.rp = 10;
    return { start: { x: ship.x, y: ship.y }, target, routeLength: route.length };
  },
  beginTradeRoute() {
    const playerTc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const enemyTc = S.bs.find((b) => b.t !== 0 && b.k === 'tc' && b.done);
    if (!playerTc || !enemyTc) throw new Error('The seeded match must have player and enemy Town Centres');
    const findMarketSite = (tc, team) => {
      for (let radius = 3; radius <= 18; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const x = Math.floor(tc.x + 1) + dx, y = Math.floor(tc.y + 1) + dy;
            if (okPlace(team, 'market', x, y)) return [x, y];
          }
        }
      }
      return null;
    };
    const srcSite = findMarketSite(playerTc, 0);
    const dstSite = findMarketSite(enemyTc, enemyTc.t);
    if (!srcSite || !dstSite) throw new Error('Could not find legal market sites for the trade-route test');
    const src = addB(0, 'market', srcSite[0], srcSite[1], true);
    const dst = addB(enemyTc.t, 'market', dstSite[0], dstSite[1], true);
    const p = spawnPos(src);
    if (!p) throw new Error('Could not find a legal trade-cart spawn tile');
    const cart = addU(0, 'cart', p[0], p[1]);
    cart.tradeFromKey = [0, 'market', src.x, src.y].join(':');
    const distance = Math.hypot((src.x + src.s / 2) - (dst.x + dst.s / 2), (src.y + src.s / 2) - (dst.y + dst.s / 2));
    if (distance < 10) throw new Error('Trade route is too short to provide a meaningful gold-delivery test');
    return { gold: S.res[0].g, distance };
  },
  beginHouseConstruction() {
    const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!u) throw new Error('The seeded match must contain a builder');
    let site = null;
    const ux = Math.floor(u.x), uy = Math.floor(u.y);
    for (let radius = 2; radius <= 12 && !site; radius++) {
      for (let dy = -radius; dy <= radius && !site; dy++) {
        for (let dx = -radius; dx <= radius && !site; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const x = ux + dx, y = uy + dy;
          if (okPlace(0, 'house', x, y)) site = [x, y];
        }
      }
    }
    if (!site) throw new Error('Could not find a legal explored tile for the construction test');
    const b = addB(0, 'house', site[0], site[1], false);
    u.o = 'b'; u.tg = b; u.p = []; u.rp = 0;
    return { x: b.x, y: b.y, buildSeconds: B.house.bt };
  },
  runSiegeTargetTest() {
    const team = 1;
    const aiTc = S.bs.find((b) => b.t === team && b.k === 'tc' && b.done);
    const playerTc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    if (!aiTc || !playerTc) throw new Error('Seeded match must have both Town Centres');
    S.age[team] = 2;
    S.res[team] = { f: 5000, w: 5000, g: 5000, s: 5000 };
    const castle = addB(0, 'castle', playerTc.x + 10, playerTc.y + 10, true);
    const tower = addB(0, 'tower', playerTc.x + 7, playerTc.y + 1, true);
    const ram = addU(team, 'ram', aiTc.x + 2, aiTc.y + 2);
    const infantry = [];
    for (let i = 0; i < 20; i++) infantry.push(addU(team, 'mil', aiTc.x + 3 + (i % 5), aiTc.y + 3 + Math.floor(i / 5)));
    for (const u of [ram, ...infantry]) { u.o = 'i'; u.tg = null; u.p = []; u.retreating = 0; }
    const ai = S.ai[team];
    ai.cd = 0; ai.nx = 0; ai.wave = 0; ai.on = 0; ai.stg = null;
    aiTeam(team, 1 / 30);
    const waveStarted = ai.wave > 0 && !!ai.stg;
    const selectedSiegeTarget = !!ai.stg && ai.stg.siegeT === castle;
    const primaryTarget = ai.stg?.tg || null;
    const stagedMixedArmy = !!ai.stg && infantry.some((u) => u.o === 'm' || u.o === 'a');
    S.t += 51;
    ai.cd = 0;
    aiTeam(team, 1 / 30);
    return {
      waveStarted,
      selectedSiegeTarget,
      siegeUnitTargetedCastle: ram.o === 'a' && ram.tg === castle,
      infantryAssignedToPrimaryTarget: !!primaryTarget && infantry.some((u) => u.o === 'a' && u.tg === primaryTarget),
      stagedMixedArmy,
      towerExists: tower.hp > 0,
    };
  },
  runDefenseResponse() {
    const team = 1;
    const tc = S.bs.find((b) => b.t === team && b.k === 'tc' && b.done);
    if (!tc) throw new Error('Seeded AI must have a completed Town Centre');
    const intruder = addU(0, 'mil', tc.x + 4, tc.y + 4);
    intruder.hp = 10000; intruder.mh = 10000;
    const defenders = [
      addU(team, 'mil', tc.x + 6, tc.y + 4),
      addU(team, 'spear', tc.x + 7, tc.y + 4),
    ];
    for (const u of defenders) { u.o = 'i'; u.tg = null; u.p = []; u.retreating = 0; }
    const worker = S.us.find((u) => u.t === team && u.k === 'vil' && !u.ld);
    if (!worker) throw new Error('Seeded AI must have a villager available for the defence test');
    worker.x = tc.x + 4; worker.y = tc.y + 5; worker.o = 'i'; worker.tg = null; worker.p = []; worker.ld = null;
    S.ai[team].cd = 0;
    aiTeam(team, 1 / 30);
    return {
      militaryResponded: defenders.some((u) => u.o === 'a' && u.tg === intruder),
      villagerGarrisoned: worker.o === 'B' && worker.tg === tc,
    };
  },
  beginRelicIncome() {
    const size = B.monastery.s;
    let site = null;
    for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
      let clear = true;
      for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
        const index = (y + dy) * W + x + dx;
        if (S.g[index] || S.wt[index]) { clear = false; break; }
      }
      if (clear) site = { x, y };
    }
    if (!site) throw new Error('Could not find a clear site for the relic-income test Monastery');
    const monastery = addB(0, 'monastery', site.x, site.y, true);
    const relic = S.rel.find(r => !r.m && !r.c);
    if (!relic) throw new Error('Seeded match must contain an unclaimed relic for the relic-income test');
    relic.m = monastery;
    for (const u of S.us) if (u.t === 0) { u.o = 'i'; u.tg = null; u.p = []; u.rp = 0; }
    S.res[0].g = 0;
    return { gold: S.res[0].g, relics: S.rel.filter(r => r.m === monastery).length };
  },
  beginFarmReseed() {
    const worker = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!worker) throw new Error('The seeded match must contain a player villager for farm reseeding');
    let node = null;
    for (let y = 2; y < H - 2 && !node; y++) for (let x = 2; x < W - 3 && !node; x++) {
      const a = y * W + x, b = a + 1;
      if (S.wt[a] || S.wt[b] || S.g[a] || S.g[b] || S.nd[a] || S.nd[b]) continue;
      worker.x = x + 0.5; worker.y = y + 0.5;
      node = addN('f', x + 1, y, 0.01, 1);
    }
    if (!node) throw new Error('Could not find two adjacent open land tiles for farm reseeding');
    node.testFarmReseed = true;
    S.res[0].w = 60;
    worker.o = 'g'; worker.tg = node; worker.ct = 'f'; worker.p = []; worker.ret = 0; worker.car = 0;
    return { wood: S.res[0].w, amount: node.amt };
  },
  beginGatherResearch() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    return tc ? research(tc, 'gath') : false;
  },
  beginManAtArmsResearch() {
    let barracks = S.bs.find((b) => b.t === 0 && b.k === 'bar' && b.done);
    if (!barracks) {
      const size = B.bar.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          if (S.g[(y + dy) * W + x + dx] || S.wt[(y + dy) * W + x + dx]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test Barracks');
      barracks = addB(0, 'bar', site.x, site.y, true);
    }
    let unit = S.us.find((u) => u.t === 0 && u.k === 'mil');
    if (!unit) {
      const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not find a spawn position for the existing-unit upgrade test');
      unit = addU(0, 'mil', p[0], p[1]);
    }
    const beforeMax = mhp(unit);
    unit.hp = beforeMax - 10;
    unit.testTechTarget = true;
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(barracks, 'man')) throw new Error('Barracks should accept affordable Man-at-Arms research');
    return { beforeMax, beforeHp: unit.hp };
  },
  addPostUpgradeMilitia() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not find a valid spawn position for post-upgrade Militia');
    const unit = addU(0, 'mil', p[0], p[1]);
    unit.testTechNew = true;
  },
  orderWoodGather() {
    const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!u) throw new Error('The seeded match must contain a player villager');
    const nodes = S.nodes.filter((n) => n.k === 'w' && n.amt > 0);
    nodes.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
    const n = nodes[0];
    if (!n) throw new Error('The seeded match must contain a wood resource node');
    u.o = 'g'; u.tg = n; u.ct = n.k; u.car = 0; u.ret = 0; u.p = []; u.rp = 0; u.autoWorker = 0;
  },
  state() {
    return {
      time: S.t,
      ticks: S.vt,
      layout: mapLayout,
      units: S.us.length,
      buildings: S.bs.length,
      playerGold: S.res[0].g,
      campaign: cmp ? { index: cmp.i, goals: { ...cmp.d }, time: cmp.t } : null,
      repairTarget: (() => {
        const u = S.us.find((u) => u.testRepairTarget === true);
        return u ? { hp: u.hp, maxHp: U[u.k].hp } : null;
      })(),
      repairWorker: (() => {
        const u = S.us.find((u) => u.o === 'rep' && u.t === 0 && u.k === 'vil');
        return u ? { order: u.o, targetHp: u.tg?.hp ?? null } : null;
      })(),
      navalCombatTarget: (() => {
        const u = S.us.find((u) => u.testNavalTarget === true);
        return u ? { hp: u.hp, maxHp: U[u.k].hp, dead: !!u.dead } : null;
      })(),
      navalShip: (() => {
        const u = S.us.find((u) => u.t === 0 && u.k === 'gal' && u.testNaval === true);
        return u ? { x: u.x, y: u.y, order: u.o, water: S.wt[(u.y | 0) * W + (u.x | 0)] === 1 } : null;
      })(),
      houseConstruction: (() => {
        const b = S.bs.find((b) => b.t === 0 && b.k === 'house');
        return b ? { done: b.done, progress: b.pr, hp: b.hp, maxHp: b.mh } : null;
      })(),
      farmReseed: (() => { const n = S.nodes.find((n) => n.testFarmReseed); return n ? { amount: n.amt, wood: S.res[0].w, farm: !!n.fm } : null; })(),
      scoreCache: S.scoreCache.slice(),
      resources: S.res.map((r) => ({ ...r })),
      gameOver: S.over,
      research: {
        gatherRate: S.tech[0].gath || 0,
        manAtArms: S.tech[0].man || 0,
        townCentreResearch: (S.bs.find((b) => b.t === 0 && b.k === 'tc') || {}).rs || null,
      },
      upgradedUnits: {
        existing: (() => { const u = S.us.find((u) => u.testTechTarget); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
        newlyTrained: (() => { const u = S.us.find((u) => u.testTechNew); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
      },
      mapAudit: S.mapAudit ? { ...S.mapAudit } : null,
      aiPeak: { ...aiPeak },
      aiGrowth: S.ai.map((a, team) => team === 0 || !a ? null : ({
        team,
        age: S.age[team],
        buildings: S.bs.filter((b) => b.t === team && b.hp > 0).length,
        completedMilitaryBuildings: S.bs.filter((b) => b.t === team && b.done && ['bar', 'rng', 'stable', 'siege'].includes(b.k)).length,
        militaryUnits: S.us.filter((u) => u.t === team && u.hp > 0 && u.k !== 'vil' && !U[u.k].sh && !['king', 'cart', 'mon'].includes(u.k)).length,
        wave: a.wave || 0,
      })).filter(Boolean),
      woodNodes: S.nodes.filter((n) => n.k === 'w').reduce((sum, n) => sum + n.amt, 0),
      worker: (() => {
        const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
        return u ? { x: u.x, y: u.y, order: u.o, carrying: u.car, returning: u.ret } : null;
      })(),
    };
  },
};
`;
const vmContext = vm.createContext(sandbox);
new vm.Script(source + '\n' + harness, { filename: 'index.html:simulation-smoke' }).runInContext(vmContext, { timeout: 15000 });

const game = sandbox.__CK_TEST__;
assert.ok(game, 'Test hooks must be attached after the real game script initialises');
game.start(123456);
const before = game.state();
assert.ok(before.units > 0, 'A real match should spawn units');
assert.ok(before.buildings > 0, 'A real match should create starting buildings');
assert.equal(before.time, 0, 'A fresh match should begin at zero game time');
for (let tick = 0; tick < 60; tick += 1) game.tick(1 / 30);
const after = game.state();
assert.equal(after.ticks, 60, 'The actual simulation step must execute 60 ticks');
assert.ok(Math.abs(after.time - 2) < 1e-9, '60 ticks at 30 Hz must advance game time by two seconds');
assert.equal(after.units, before.units, 'The short smoke window should not spontaneously remove starting units');
assert.ok(after.scoreCache.some((score) => Number.isFinite(score) && score > 0),
  'The real simulation should refresh its derived kingdom-score cache');
assert.ok(after.resources.every((r) => Object.values(r).every((v) => Number.isFinite(v))),
  'Resource state must remain finite after the ticks');
assert.equal(after.gameOver, null, 'The smoke match should remain active');
console.log(`simulation-smoke: 60 real ticks passed (units=${after.units}, buildings=${after.buildings}, gameTime=${after.time}s)`);

game.start(123456);
game.orderWoodGather();
const economyBefore = game.state();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const economyAfter = game.state();
assert.ok(
  economyAfter.woodNodes < economyBefore.woodNodes ||
  economyAfter.worker?.carrying > 0 ||
  economyAfter.resources[0].w > economyBefore.resources[0].w,
  'A real villager gathering order should harvest wood, carry it, or deliver it within 60 simulated seconds',
);
assert.ok(economyAfter.worker, 'The gathering villager should remain alive');
console.log(`economy-smoke: villager order advanced 60s (wood=${economyBefore.woodNodes}->${economyAfter.woodNodes}, carried=${economyAfter.worker.carrying}, playerWood=${economyBefore.resources[0].w}->${economyAfter.resources[0].w})`);

game.start(123456, 1);
assert.equal(game.beginGatherResearch(), true, 'The Town Centre should accept affordable Gather Rate research');
assert.equal(game.state().research.gatherRate, 0, 'Research must not apply before its timer completes');
for (let tick = 0; tick < 930; tick += 1) game.tick(1 / 30);
const researchAfter = game.state();
assert.equal(researchAfter.research.gatherRate, 1, 'Completing research must apply the real Gather Rate technology effect');
assert.equal(researchAfter.research.townCentreResearch, null, 'The completed research queue should clear');
console.log('research-smoke: Gather Rate research completed through 31 simulated seconds and applied to the real technology state');

game.start(123456, 1);
const hpBeforeUpgrade = game.beginManAtArmsResearch();
for (let tick = 0; tick < 930; tick += 1) game.tick(1 / 30);
const hpAfterUpgrade = game.state();
assert.equal(hpAfterUpgrade.research.manAtArms, 1, 'Man-at-Arms research should complete through the real research timer');
assert.equal(hpAfterUpgrade.upgradedUnits.existing.maxHp, hpBeforeUpgrade.beforeMax + 15,
  'The researched hit-point bonus must increase the maximum HP of an existing Militia unit');
assert.equal(hpAfterUpgrade.upgradedUnits.existing.hp, hpBeforeUpgrade.beforeHp + 15,
  'Upgrading an injured unit must preserve its existing damage rather than fully healing it');
game.addPostUpgradeMilitia();
const hpWithNewUnit = game.state().upgradedUnits.newlyTrained;
assert.equal(hpWithNewUnit.maxHp, hpBeforeUpgrade.beforeMax + 15,
  'New Militia created after research must inherit the same HP bonus');
assert.equal(hpWithNewUnit.hp, hpWithNewUnit.maxHp,
  'New Militia should spawn at its upgraded maximum HP');
console.log('technology-hp-smoke: completed Man-at-Arms research upgrades existing injured units and newly created units without erasing damage');

game.start(123456);
const plannedHouse = game.beginHouseConstruction();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const constructionAfter = game.state();
assert.ok(constructionAfter.houseConstruction, 'The real house should remain in the game state');
assert.equal(constructionAfter.houseConstruction.done, true,
  'A villager ordered to build a legal house site should complete it within 60 simulated seconds');
assert.equal(constructionAfter.houseConstruction.hp, constructionAfter.houseConstruction.maxHp,
  'A completed house should have full hit points');
assert.ok(constructionAfter.buildings >= 5, 'The completed house should be included in the live building state');
console.log(`construction-smoke: house at ${plannedHouse.x},${plannedHouse.y} completed in 60 simulated seconds (build time=${plannedHouse.buildSeconds}s)`);

game.start(123456, 1);
const tradeBefore = game.beginTradeRoute();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const tradeAfter = game.state();
assert.ok(tradeAfter.playerGold > tradeBefore.gold,
  'A real trade cart travelling between completed allied/enemy markets should deliver gold');
console.log(`trade-smoke: cart route distance=${tradeBefore.distance.toFixed(1)} tiles, player gold ${tradeBefore.gold}->${tradeAfter.playerGold} over 60 simulated seconds`);

game.start(123456);
const navalBefore = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const navalAfter = game.state();
assert.ok(navalAfter.navalShip, 'The test ship should remain present in the real simulation');
assert.ok(Math.hypot(navalAfter.navalShip.x - navalBefore.start.x, navalAfter.navalShip.y - navalBefore.start.y) > 4,
  'The real ship movement order should move the ship across the water route');
assert.equal(navalAfter.navalShip.water, true, 'The ship should remain on navigable water during the movement smoke test');
console.log(`naval-smoke: ship moved across water (route=${navalBefore.routeLength} path points, displacement=${Math.hypot(navalAfter.navalShip.x - navalBefore.start.x, navalAfter.navalShip.y - navalBefore.start.y).toFixed(1)} tiles)`);

game.start(123456);
const combatBefore = game.beginNavalCombat();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const combatAfter = game.state();
assert.ok(combatAfter.navalCombatTarget, 'The enemy galley should remain inspectable in the live simulation');
assert.ok(combatAfter.navalCombatTarget.hp < combatBefore.targetHp || combatAfter.navalCombatTarget.dead,
  'A real galley attack order should damage or destroy the enemy ship');
console.log(`naval-combat-smoke: enemy galley HP ${combatBefore.targetHp}->${combatAfter.navalCombatTarget.hp} over 30 simulated seconds`);

game.start(123456);
const repairBefore = game.beginShipRepair();
assert.equal(repairBefore.order, 'rep', 'The real villager command should enter ship-repair state');
for (let tick = 0; tick < 300; tick += 1) game.tick(1 / 30);
const repairAfter = game.state();
assert.ok(repairAfter.repairTarget, 'The damaged ship should remain in the real simulation');
assert.ok(repairAfter.repairTarget.hp > repairBefore.hp, 'The real repair order should restore ship hit points');
assert.ok(repairAfter.repairTarget.hp <= repairAfter.repairTarget.maxHp, 'Repairing must not exceed maximum ship health');
console.log(`ship-repair-smoke: galley HP ${repairBefore.hp}->${repairAfter.repairTarget.hp} over 10 simulated seconds`);



const campaignBefore = game.completeFirstCampaignMission();
for (let tick = 0; tick < 15; tick += 1) game.tick(1 / 30);
const campaignAfter = game.state();
assert.equal(campaignBefore.mission, 0, 'The campaign smoke should initialise First Hearth');
for (const goal of campaignBefore.requiredGoals) {
  assert.equal(campaignAfter.campaign.goals[goal], 1, `Campaign objective ${goal} should be marked complete by the real objective tracker`);
}
assert.equal(campaignAfter.gameOver, 'win', 'Completing all First Hearth objectives should trigger the real mission-win state');
console.log(`campaign-smoke: First Hearth completed; objectives=${campaignBefore.requiredGoals.join(',')}, result=${campaignAfter.gameOver}`);

game.start(123456);
const aiBefore = game.state();
for (let tick = 0; tick < 21600; tick += 1) game.tick(1 / 30);
const aiAfter = game.state();
const activeAi = aiAfter.aiGrowth.filter((a) => a && a.team > 0);
assert.ok(activeAi.length > 0, 'The seeded match should initialise at least one rival AI kingdom');
assert.ok(activeAi.some((a) => a.buildings > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.buildings ?? 0) ||
  a.militaryUnits > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.militaryUnits ?? 0) ||
  a.age > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.age ?? 0)),
  'Rival AI must make measurable economic, military or age progression during twelve simulated minutes');
assert.ok(activeAi.some((a) => a.age >= 1),
  'At least one rival should complete Feudal Age after meeting building and food prerequisites');
assert.ok(activeAi.some((a) => a.completedMilitaryBuildings > 0),
  'Rival AI should establish a completed military production building');
assert.ok(Object.values(aiAfter.aiPeak).some((count) => count >= 4),
  'At least one rival should field a four-unit force at some point during eight simulated minutes');
assert.ok(activeAi.some((a) => a.wave > 0),
  'At least one rival should launch a coordinated attack wave during twelve simulated minutes');
assert.ok(aiAfter.gameOver === null || aiAfter.gameOver === 'lose',
  'The twelve-minute unattended growth window may end in an AI victory over the idle player, but must not produce a draw or player victory');
console.log('ai-growth-smoke: rival AI progressed over 720 simulated seconds: ' +
  activeAi.map((a) => `team ${a.team}: age=${a.age}, buildings=${a.buildings}, military=${a.militaryUnits}, wave=${a.wave}`).join('; '));

game.start(123456);
const defence = game.runDefenseResponse();
assert.equal(defence.militaryResponded, true, 'Idle AI defenders should engage a hostile intruder near their Town Centre');
assert.equal(defence.villagerGarrisoned, true, 'AI villagers near a threatened Town Centre should garrison');
console.log('ai-defence-smoke: idle military engaged a hostile intruder and a nearby villager garrisoned');

game.start(246810);
const siegeAttack = game.runSiegeTargetTest();
assert.equal(siegeAttack.waveStarted, true, 'A sufficiently large AI army should initiate a coordinated wave');
assert.equal(siegeAttack.selectedSiegeTarget, true, 'Siege targeting should prefer a completed hostile Castle over a Tower or Town Centre');
assert.equal(siegeAttack.siegeUnitTargetedCastle, true, 'A staged battering ram should receive the selected Castle target');
assert.equal(siegeAttack.infantryAssignedToPrimaryTarget, true, 'Non-siege units should retain the primary attack target');
console.log('ai-siege-smoke: coordinated wave selected the Castle for the ram and retained the Town Centre target for infantry');

game.start(123456);
const relicBefore = game.beginRelicIncome();
assert.equal(relicBefore.relics, 1, 'The relic-income test should place one relic in the completed Monastery');
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const relicAfter = game.state();
assert.ok(relicAfter.playerGold >= relicBefore.gold + 29.5,
  'A relic held in a completed Monastery should generate approximately 30 gold over 60 simulated seconds');
console.log(`relic-income-smoke: one relic generated ${relicAfter.playerGold - relicBefore.gold} gold over 60 simulated seconds`);

game.start(123456);
const farmBefore = game.beginFarmReseed();
assert.equal(farmBefore.wood, 60, 'The farm reseed test should begin with the required 60 wood');
game.tick(1 / 30);
const farmAfter = game.state().farmReseed;
assert.equal(farmAfter.farm, true, 'The exhausted resource must remain a farm node after reseeding');
assert.equal(farmAfter.wood, 0, 'Automatic farm reseeding must charge 60 wood');
assert.ok(farmAfter.amount >= 175, 'The exhausted farm should be replenished with its base food capacity');
console.log(`farm-reseed-smoke: depleted farm replenished to ${farmAfter.amount} food for 60 wood`);

const generatedMaps = [];
for (let mapIndex = 0; mapIndex < 12; mapIndex += 1) {
  const result = game.startMap(73000 + mapIndex, mapIndex, 4);
  assert.equal(result.mapAudit?.landReachable, true, `Generated map ${mapIndex} should connect all four starting land regions`);
  assert.ok(result.mapAudit.waterCells > 0, `Generated map ${mapIndex} should contain water cells`);
  assert.equal(result.mapAudit.starts, 4, `Generated map ${mapIndex} should audit all four starting locations`);
  generatedMaps.push({ mapIndex, landComponents: result.mapAudit.landComponents, waterComponents: result.mapAudit.waterComponents, dockableStarts: result.mapAudit.dockableStarts });
}
console.log('generated-map-smoke: all 12 actual map types generated with connected starting land: ' +
  generatedMaps.map((m) => `map ${m.mapIndex}: land components=${m.landComponents}, water components=${m.waterComponents}, dockable starts=${m.dockableStarts}`).join('; '));

const causewaySkirmish = game.startLayout(12, 4);
assert.equal(causewaySkirmish.layout, 12, 'The selectable Causeway layout must load directly in a four-kingdom match');
assert.equal(causewaySkirmish.mapAudit?.landReachable, true, 'All four skirmish starting land regions must connect across the shallow crossings');
assert.equal(causewaySkirmish.mapAudit?.starts, 4, 'The four-kingdom Causeway map must audit every starting position');
assert.ok(causewaySkirmish.mapAudit?.waterCells > 0, 'The four-kingdom Causeway map must retain a navigable-water corridor');
const causewayShipStart = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const causewayShipAfter = game.state().navalShip;
assert.ok(causewayShipAfter, 'The ship used for the Causeway water-route test must remain in the simulation');
assert.ok(Math.hypot(causewayShipAfter.x - causewayShipStart.start.x, causewayShipAfter.y - causewayShipStart.start.y) > 4,
  'A ship must traverse the actual Causeway layout water corridor, not merely spawn on water');
assert.equal(causewayShipAfter.water, true, 'The Causeway ship must remain on navigable water during the route test');
console.log('causeway-layout-smoke: layout 12 generated for four kingdoms with connected land and a traversable ship route');

game.start(123456);
const causewayCampaign = game.startCampaign(16);
assert.equal(causewayCampaign.campaign?.index, 16, 'The seventeenth campaign mission should start through the real scenario loader');
assert.equal(causewayCampaign.layout, 12, 'The Causeway mission must select the dedicated map layout');
assert.equal(causewayCampaign.mapAudit?.landReachable, true, 'Campaign player and rival starting land must connect across the shallow crossings');
assert.equal(causewayCampaign.mapAudit?.starts, 2, 'The campaign map audit must recognise its player and rival starting positions');
assert.ok(causewayCampaign.mapAudit?.waterCells > 0, 'The Causeway campaign must retain a navigable-water corridor');
assert.ok(causewayCampaign.buildings >= 4 && causewayCampaign.units > 0, 'The Causeway mission must create its starting economy and forces');
console.log('causeway-campaign-smoke: mission 17 loaded on layout 12 with connected starting land and a live water corridor');






