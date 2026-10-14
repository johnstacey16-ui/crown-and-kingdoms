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
globalThis.__CK_TEST__ = {
  start(seed, age = 0) { seedOv = seed; cmp = null; gameMode = 0; startAge = age; start(); },
  tick(dt) { step(dt); },
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
  beginGatherResearch() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    return tc ? research(tc, 'gath') : false;
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
      units: S.us.length,
      buildings: S.bs.length,
      playerGold: S.res[0].g,
      houseConstruction: (() => {
        const b = S.bs.find((b) => b.t === 0 && b.k === 'house');
        return b ? { done: b.done, progress: b.pr, hp: b.hp, maxHp: b.mh } : null;
      })(),
      scoreCache: S.scoreCache.slice(),
      resources: S.res.map((r) => ({ ...r })),
      gameOver: S.over,
      research: {
        gatherRate: S.tech[0].gath || 0,
        townCentreResearch: (S.bs.find((b) => b.t === 0 && b.k === 'tc') || {}).rs || null,
      },
      mapAudit: S.mapAudit && { ok: S.mapAudit.ok },
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




