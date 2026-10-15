import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/economy.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/formations.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/minimap.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
assert.ok(source.length > 200000, 'The external real game engine must be present');

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
  performance: { now: () => Number(process.hrtime.bigint()) / 1e6 },
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
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ atlases: [] }) }),
};
sandbox.window = sandbox;
sandbox.window.devicePixelRatio = 1;
sandbox.window.top = sandbox.window;
sandbox.window.addEventListener = sandbox.addEventListener;
sandbox.window.CK_ASSETS = null;
sandbox.window.AudioContext = undefined;
sandbox.window.webkitAudioContext = undefined;
sandbox.requestAnimationFrame = () => {};
const harness = `
let aiPeak = {};
const aiMilitaryCount = (team) => S.us.filter((u) => u.t === team && u.hp > 0 && u.k !== 'vil' && !U[u.k].sh && !['king', 'cart', 'mon'].includes(u.k)).length;
globalThis.__CK_TEST__ = {
  start(seed, age = 0) { seedOv = seed; cmp = null; gameMode = 0; startAge = age; start(); aiPeak = {}; for (let team = 1; team < S.teamN; team++) aiPeak[team] = aiMilitaryCount(team); },
  startMap(seed, mapIndex, teams = 4) { seedOv = seed; mt = mapIndex; mapLayout = 0; msz = 0; kingdoms = teams; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  startLayout(layoutIndex, teams = 4) { mapLayout = layoutIndex; applyMapLayout(); kingdoms = teams; msz = 0; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  startCampaign(index) { startScenario(index); return this.state(); },
  saveLoadRoundTrip() {
    slot = 0;
    const snapshot = () => ({
      time: S.t,
      size: W,
      units: S.us.length,
      buildings: S.bs.length,
      nodeCount: S.nodes.length,
      resources: S.res.map((r) => ({ ...r })),
      technology: S.tech.map((t) => ({ ...t })),
      campaign: cmp ? { index: cmp.i, time: cmp.t, goals: { ...cmp.d }, events: { ...cmp.e } } : null,
    });
    const before = snapshot();
    saveG();
    const stored = localStorage.getItem(skey(slot));
    if (!stored) throw new Error('Saving the active match did not write a local save slot');
    const payload = JSON.parse(stored);
    if (payload.v !== 1) throw new Error('Saved game did not use the supported save format');
    S.us.length = 0;
    S.bs.length = 0;
    S.nodes.length = 0;
    S.rel.length = 0;
    S.res[0].f = -12345;
    if (S.tech[0]) S.tech[0].cons = !S.tech[0].cons;
    cmp = null;
    const loaded = loadG();
    return { loaded, version: payload.v, bytes: stored.length, before, after: snapshot() };
  },
  tick(dt) { step(dt); for (let team = 1; team < S.teamN; team++) aiPeak[team] = Math.max(aiPeak[team] || 0, aiMilitaryCount(team)); },
  auditHusbandrySpeeds() {
    const previous = S.tech[0].husb;
    try {
      S.tech[0].husb = 1;
      return {
        knight: unitSpeed({ t: 0, k: 'knight' }),
        infantry: unitSpeed({ t: 0, k: 'mil' }),
        transport: unitSpeed({ t: 0, k: 'trn' }),
        transportBase: U.trn.sp,
        conqMounted: CAVARM.has('conq'),
      };
    } finally {
      if (previous === undefined) delete S.tech[0].husb;
      else S.tech[0].husb = previous;
    }
  },
  auditConscriptionRates() {
    const previous = S.tech[0].cons;
    try {
      S.tech[0].cons = 1;
      return {
        barracks: trainRate({ t: 0, k: 'bar' }, 'mil'),
        castle: trainRate({ t: 0, k: 'castle' }, 'knight'),
        monastery: trainRate({ t: 0, k: 'monastery' }, 'mon'),
        galley: trainRate({ t: 0, k: 'dock' }, 'gal'),
        villager: trainRate({ t: 0, k: 'tc' }, 'vil'),
        cart: trainRate({ t: 0, k: 'market' }, 'cart'),
        fish: trainRate({ t: 0, k: 'dock' }, 'fish'),
        transport: trainRate({ t: 0, k: 'dock' }, 'trn'),
        tradeCog: trainRate({ t: 0, k: 'dock' }, 'cog'),
      };
    } finally {
      if (previous === undefined) delete S.tech[0].cons;
      else S.tech[0].cons = previous;
    }
  },
  auditSpatialTargets() {
    const originalUnits=S.us,originalBuildings=S.bs;
    const probes=[
      {t:0,k:'knight',x:8,y:8,hp:100},
      {t:1,k:'knight',x:31.8,y:32.1,hp:100},
      {t:2,k:'knight',x:64,y:63.9,hp:100},
      {t:0,k:'knight',x:128,y:128,hp:100},
    ];
    const units=probes.concat([
      {t:1,k:'mil',x:8.5,y:8,hp:100},
      {t:1,k:'mil',x:7.5,y:8,hp:100},
      {t:1,k:'mil',x:8,y:8,hp:0},
      {t:1,k:'mil',x:8.1,y:8,hp:100,ld:1},
    ]);
    for(let i=0;i<396;i++)units.push({
      t:1+(i%3),k:'mil',x:4+((i*17)%176),y:4+((i*31)%176),
      hp:i%29===0?0:100,ld:i%19===0?1:0
    });
    const linear=(u,r)=>{
      let best=null,bd=r;
      for(const e of S.us)if(isHostile(u.t,e.t)&&e.hp>0&&!e.ld){
        const d=Math.hypot(e.x-u.x,e.y-u.y);
        if(d<bd){bd=d;best=e}
      }
      return best
    };
    let queries=0,mismatches=0,tiePreserved=false;
    try {
      S.us=units;S.bs=[];foeGridDirty=true;
      const cases=[[probes[0],1],[probes[0],6],[probes[1],9],[probes[2],4],[probes[3],12]];
      for(const [u,r] of cases){
        const expected=linear(u,r),actual=foe(u,r);
        if(actual!==expected)mismatches++;
        if(u===probes[0]&&r===1)tiePreserved=actual===units[4];
        queries++;
      }
      units[9].x=probes[0].x+0.2;units[9].y=probes[0].y+0.1;
      foeGridDirty=true;
      if(foe(probes[0],2)!==linear(probes[0],2))mismatches++;
      queries++;
      return {queries,mismatches,tiePreserved,units:units.length,buckets:FOE_BUCKETS.size};
    } finally {
      S.us=originalUnits;S.bs=originalBuildings;foeGridDirty=true;
    }
  },
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
  beginChemistryResearch() {
    S.age[0] = 3;
    this.beginNavalCombat();
    const attacker = S.us.find((u) => u.t === 0 && u.k === 'gal' && u.o === 'a' && u.tg?.testNavalTarget);
    const target = S.us.find((u) => u.testNavalTarget === true);
    if (!attacker || !target) throw new Error('Could not prepare the Chemistry naval-combat test');
    attacker.o = 'i'; attacker.tg = null; attacker.p = [];
    attacker.testChemistryAttacker = true;
    S.tech[1] = {};
    const targetHp = target.hp;
    dmgT(attacker, target);
    S.chemistryBaseDamage = targetHp - target.hp;
    target.hp = targetHp; target.dead = 0;
    let university = S.bs.find((b) => b.t === 0 && b.k === 'univ' && b.done);
    if (!university) {
      const size = B.univ.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          const index = (y + dy) * W + x + dx;
          if (S.g[index] || S.wt[index] || S.nd[index]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test University');
      university = addB(0, 'univ', site.x, site.y, true);
    }
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(university, 'chem')) throw new Error('University should accept affordable Chemistry research');
    return { baselineDamage: S.chemistryBaseDamage };
  },
  resolveChemistryShot() {
    this.beginNavalCombat();
    const target = [...S.us].reverse().find((u) => u.testNavalTarget === true);
    const attacker = target && [...S.us].reverse().find((u) => u.t === 0 && u.k === 'gal' && u.o === 'a' && u.tg === target);
    if (!attacker || !target) throw new Error('Chemistry combatants could not be recreated after the research timer');
    S.tech[1] = {};
    attacker.hp = U[attacker.k].hp; attacker.dead = 0;
    target.hp = U[target.k].hp; target.dead = 0;
    const before = target.hp;
    dmgT(attacker, target);
    return {
      baselineDamage: S.chemistryBaseDamage,
      actualDamage: before - target.hp,
      attackBonus: S.tech[0].atkb?.gal || 0
    };
  },
  beginBloodlinesResearch() {
    S.age[0] = 2;
    let stable = S.bs.find((b) => b.t === 0 && b.k === 'stable' && b.done);
    if (!stable) {
      const size = B.stable.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          const index = (y + dy) * W + x + dx;
          if (S.g[index] || S.wt[index] || S.nd[index]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test Stable');
      stable = addB(0, 'stable', site.x, site.y, true);
    }
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not spawn the existing cavalry test unit');
    const unit = addU(0, 'knight', p[0], p[1]);
    const beforeMax = mhp(unit);
    unit.hp = beforeMax - 10;
    unit.testBloodlinesTarget = true;
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(stable, 'blood')) throw new Error('Stable should accept affordable Bloodlines research');
    return { beforeMax, beforeHp: unit.hp };
  },
  addPostUpgradeKnight() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not find a spawn position for a post-Bloodlines Knight');
    const unit = addU(0, 'knight', p[0], p[1]);
    unit.testBloodlinesNew = true;
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
  benchmarkArmy(count, ticks = 15) {
    this.start(13579);
    const baseCount = S.us.length;
    for (let i = 0; i < count; i++) {
      const x = 4 + (i % 20) * 4;
      const y = 4 + Math.floor(i / 20) * 3.5;
      const unit = addU(i % Math.min(4, S.teamN), 'mil', x, y);
      unit.o = 'i'; unit.tg = null; unit.p = []; unit.sc = 1000; unit.as = 0; unit.retreating = 0;
    }
    const added = S.us.length - baseCount;
    const started = performance.now();
    for (let i = 0; i < ticks; i++) step(1 / 30);
    const elapsedMs = performance.now() - started;
    return { requested: count, added, units: S.us.length, ticks, elapsedMs, time: S.t, mapSize: W };
  },
  auditTownBellReservations() {
    const shelters = S.bs.filter((b) => b.t === 0 && b.done && b.hp > 0 && GAR[b.k]);
    if (!shelters.length) throw new Error('The seeded match must have an eligible player shelter');
    for (const b of shelters) b.cg = [];
    for (const u of S.us) {
      if (u.t === 0 && u.k === 'vil') u.ld = true;
      if (u.t === 0 && u.o === 'B') { u.o = 'i'; u.tg = null; }
    }
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done && b.hp > 0);
    const workers = [];
    for (let i = 0; i < 100; i++) {
      const u = addU(0, 'vil', tc.x + 1 + (i % 7) * 0.15, tc.y + 1 + Math.floor(i / 7) * 0.15);
      u.ld = null; u.o = 'i'; u.tg = null; u.p = []; u.rp = 0;
      workers.push(u);
    }
    const totalCapacity = shelters.reduce((sum, b) => sum + GAR[b.k], 0);
    const sent = townBell(0);
    const assigned = workers.filter((u) => u.o === 'B' && shelters.includes(u.tg));
    const occupancy = shelters.map((b) => ({
      kind: b.k, capacity: GAR[b.k],
      assigned: assigned.filter((u) => u.tg === b).length,
    }));
    return { sent, assigned: assigned.length, totalCapacity, occupancy, unassigned: workers.length - assigned.length };
  },
  state() {
    return {
      time: S.t,
      ticks: S.vt,
      layout: mapLayout,
      enemyGalleys: S.us.filter((u) => u.t === 1 && u.k === 'gal' && u.hp > 0).length,
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
        bloodlines: S.tech[0].blood || 0,
        chemistry: S.tech[0].chem || 0,
        townCentreResearch: (S.bs.find((b) => b.t === 0 && b.k === 'tc') || {}).rs || null,
      },
      upgradedUnits: {
        existing: (() => { const u = S.us.find((u) => u.testTechTarget); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
        newlyTrained: (() => { const u = S.us.find((u) => u.testTechNew); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
      },
      bloodlineUnits: {
        existing: (() => { const u = S.us.find((u) => u.testBloodlinesTarget); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
        newlyCreated: (() => { const u = S.us.find((u) => u.testBloodlinesNew); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
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
const conscriptionRates = game.auditConscriptionRates();
for (const key of ['barracks','castle','monastery','galley']) {
  assert.equal(conscriptionRates[key], 4 / 3, 'Conscription should speed military production at ' + key);
}
for (const key of ['villager','cart','fish','transport','tradeCog']) {
  assert.equal(conscriptionRates[key], 1, 'Conscription must not speed economic or transport queue ' + key);
}
console.log('conscription-smoke: military queues run at 4/3 speed; economy/trade/transport queues remain unchanged');
const husbandrySpeeds = game.auditHusbandrySpeeds();
assert.ok(Math.abs(husbandrySpeeds.knight - 2.31) < 1e-9, 'Husbandry must increase Knight movement speed by 10%');
assert.equal(husbandrySpeeds.infantry, 1.4, 'Husbandry must not increase infantry speed');
assert.equal(husbandrySpeeds.transport, husbandrySpeeds.transportBase, 'Husbandry must not increase transport-ship speed');
assert.equal(husbandrySpeeds.conqMounted, true, 'Mounted unique cavalry must be included in the mounted set');
console.log('husbandry-smoke: cavalry receives +10% speed; infantry and transport ships are unchanged');

const targetAudit=game.auditSpatialTargets();
assert.equal(targetAudit.queries,6,'Spatial target audit must compare several radii and bucket boundaries');
assert.equal(targetAudit.mismatches,0,'Spatial target search must match the original linear nearest-hostile scan');
assert.equal(targetAudit.tiePreserved,true,'Equidistant targets must preserve original unit-order tie breaking');
assert.ok(targetAudit.units>=400,'Spatial target audit must cover a 400-unit synthetic army');
assert.ok(targetAudit.buckets>1,'Spatial target index must partition the army into local buckets');
console.log('spatial-target-smoke: '+targetAudit.queries+' queries matched linear targeting across '+targetAudit.units+' units and '+targetAudit.buckets+' buckets');
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

game.start(123456, 1);
const bloodlinesBefore = game.beginBloodlinesResearch();
for (let tick = 0; tick < 1230; tick += 1) game.tick(1 / 30);
const bloodlinesAfter = game.state();
assert.equal(bloodlinesAfter.research.bloodlines, 1, 'Bloodlines research should complete in the real Stable timer');
assert.equal(bloodlinesAfter.bloodlineUnits.existing.maxHp, bloodlinesBefore.beforeMax + 20,
  'Bloodlines must increase the maximum HP of cavalry that already exists');
assert.equal(bloodlinesAfter.bloodlineUnits.existing.hp, bloodlinesBefore.beforeHp + 20,
  'Bloodlines must preserve existing cavalry damage while adding HP');
game.addPostUpgradeKnight();
const newBloodlineKnight = game.state().bloodlineUnits.newlyCreated;
assert.equal(newBloodlineKnight.maxHp, bloodlinesBefore.beforeMax + 20,
  'New cavalry created after Bloodlines must inherit its HP bonus');
assert.equal(newBloodlineKnight.hp, newBloodlineKnight.maxHp,
  'New cavalry must spawn at its upgraded maximum HP');
console.log('bloodlines-smoke: Stable research improves existing and newly created cavalry without erasing existing damage');

game.start(123456, 1);
const chemistryBefore = game.beginChemistryResearch();
for (let tick = 0; tick < 1830; tick += 1) game.tick(1 / 30);
const chemistryAfter = game.state();
assert.equal(chemistryAfter.research.chemistry, 1, 'Chemistry research should complete through the real University timer');
const chemistryShot = game.resolveChemistryShot();
assert.equal(chemistryShot.attackBonus, 1, 'Completed Chemistry must add its ship-attack bonus to the technology ledger');
assert.equal(chemistryShot.actualDamage, chemistryBefore.baselineDamage + 1,
  'A researched War Galley shot must deal exactly one more damage than the same unresearched shot');
console.log('chemistry-smoke: University research increased real War Galley damage by one');


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

const brokenIsles = game.startLayout(13, 4);
assert.equal(brokenIsles.layout, 13, 'Broken Isles must load as layout 13');
assert.equal(brokenIsles.mapAudit?.starts, 4, 'Broken Isles must recognise all four starting positions');
assert.equal(brokenIsles.mapAudit?.landReachable, true, 'Shallow crossings must keep every starting kingdom land-connected');
assert.ok(brokenIsles.mapAudit?.waterCells > 0, 'Broken Isles must retain navigable water channels');
assert.ok((brokenIsles.mapAudit?.waterNetworkCoverage || 0) >= 50, 'The largest Broken Isles channel network must cover at least half of mapped water cells');
const brokenShipStart = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const brokenShipAfter = game.state().navalShip;
assert.ok(brokenShipAfter, 'The Broken Isles movement ship must remain active');
assert.ok(Math.hypot(brokenShipAfter.x - brokenShipStart.start.x, brokenShipAfter.y - brokenShipStart.start.y) > 4,
  'A ship must travel through the Broken Isles water network rather than merely spawn');
assert.equal(brokenShipAfter.water, true, 'The Broken Isles ship must finish its route on navigable deep water');
console.log('broken-isles-smoke: connected starting land, one water network and an actual ship route');

game.start(123456);
const causewayCampaign = game.startCampaign(16);
assert.equal(causewayCampaign.campaign?.index, 16, 'The seventeenth campaign mission should start through the real scenario loader');
assert.equal(causewayCampaign.layout, 12, 'The Causeway mission must select the dedicated map layout');
assert.ok(causewayCampaign.enemyGalleys >= 3, 'The Causeway rival must begin with three galleys contesting the strait');
assert.equal(causewayCampaign.mapAudit?.landReachable, true, 'Campaign player and rival starting land must connect across the shallow crossings');
assert.equal(causewayCampaign.mapAudit?.starts, 2, 'The campaign map audit must recognise its player and rival starting positions');
assert.ok(causewayCampaign.mapAudit?.waterCells > 0, 'The Causeway campaign must retain a navigable-water corridor');
assert.ok(causewayCampaign.buildings >= 4 && causewayCampaign.units > 0, 'The Causeway mission must create its starting economy and forces');
console.log('causeway-campaign-smoke: mission 17 loaded on layout 12 with connected starting land and a live water corridor');








game.startCampaign(16);
for (let tick = 0; tick < 90; tick += 1) game.tick(1 / 30);
const saveRoundTrip = game.saveLoadRoundTrip();
assert.equal(saveRoundTrip.loaded, true, 'A valid local save must restore successfully');
assert.equal(saveRoundTrip.version, 1, 'The save round-trip must preserve the current versioned format');
assert.ok(saveRoundTrip.bytes > 1000, 'The active campaign must write a non-empty world snapshot');
assert.equal(saveRoundTrip.after.time, saveRoundTrip.before.time, 'Simulation time must survive save/load');
assert.equal(saveRoundTrip.after.size, saveRoundTrip.before.size, 'Map dimensions must survive save/load');
assert.equal(saveRoundTrip.after.units, saveRoundTrip.before.units, 'All saved units must be restored');
assert.equal(saveRoundTrip.after.buildings, saveRoundTrip.before.buildings, 'All saved buildings must be restored');
assert.equal(saveRoundTrip.after.nodeCount, saveRoundTrip.before.nodeCount, 'All saved resource nodes must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.resources)), JSON.parse(JSON.stringify(saveRoundTrip.before.resources)), 'All kingdoms’ resources must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.technology)), JSON.parse(JSON.stringify(saveRoundTrip.before.technology)), 'Researched technologies must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.campaign)), JSON.parse(JSON.stringify(saveRoundTrip.before.campaign)), 'Campaign time, completed goals and fired events must be restored');
assert.equal(saveRoundTrip.after.campaign?.index, 16, 'The Causeway campaign must remain the active mission after loading');
console.log(`save-load-smoke: restored campaign ${saveRoundTrip.after.campaign.index} with ${saveRoundTrip.after.units} units, ${saveRoundTrip.after.buildings} buildings and ${saveRoundTrip.bytes} saved characters`);


game.start(123456);
const townBellAudit = game.auditTownBellReservations();
assert.equal(townBellAudit.sent, townBellAudit.assigned, 'Town Bell must report every actual villager assignment');
assert.equal(townBellAudit.assigned, townBellAudit.totalCapacity, 'With enough villagers, Town Bell should reserve every available shelter slot exactly once');
assert.equal(townBellAudit.unassigned, 100 - townBellAudit.totalCapacity, 'Villagers beyond total shelter capacity must remain unassigned');
for (const shelter of townBellAudit.occupancy) {
  assert.ok(shelter.assigned <= shelter.capacity, 'Town Bell must not overbook ' + shelter.kind);
}
console.log('town-bell-behaviour: '+townBellAudit.assigned+' villagers assigned across '+townBellAudit.occupancy.length+' shelters with no capacity overbooking');

for (const population of [100, 200, 400]) {
  const samples = [];
  let finalResult = null;
  for (let repeat = 0; repeat < 3; repeat++) {
    const result = game.benchmarkArmy(population, 30);
    const elapsedMs = result.elapsedMs;
    assert.equal(result.added, population, 'Benchmark must add the requested synthetic army size');
    assert.ok(result.units >= population, 'Benchmark army must remain represented in simulation state');
    assert.equal(result.ticks, 30, 'Benchmark must execute the full fixed number of simulation ticks');
    assert.ok(Number.isFinite(elapsedMs) && elapsedMs >= 0, 'Simulation-only benchmark timing must be finite');
    samples.push(elapsedMs);
    finalResult = result;
  }
  samples.sort((a, b) => a - b);
  console.log('large-army-runtime: requested='+population+' added='+finalResult.added+' total='+finalResult.units+' ticks='+finalResult.ticks+' repeats=3 simulationOnly=true medianMs='+samples[1].toFixed(2)+' rangeMs='+samples[0].toFixed(2)+'-'+samples[2].toFixed(2));
}

