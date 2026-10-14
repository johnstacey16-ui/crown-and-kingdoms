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
  start(seed) { seedOv = seed; cmp = null; gameMode = 0; start(); },
  tick(dt) { step(dt); },
  state() {
    return {
      time: S.t,
      ticks: S.vt,
      units: S.us.length,
      buildings: S.bs.length,
      scoreCache: S.scoreCache.slice(),
      resources: S.res.map((r) => ({ ...r })),
      gameOver: S.over,
      mapAudit: S.mapAudit && { ok: S.mapAudit.ok },
    };
  },
};
`;
const vmContext = vm.createContext(sandbox);
new vm.Script(source + '\\n' + harness, { filename: 'index.html:simulation-smoke' }).runInContext(vmContext, { timeout: 15000 });

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
