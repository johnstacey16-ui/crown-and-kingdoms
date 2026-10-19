import { readFileSync } from 'node:fs';

// Browser surface mocks only; simulation and AI below are the production scripts.
export function headlessGame() {

const source = readFileSync(new URL('../../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/pathfinding.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/entities.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/economy.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/formations.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../js/minimap.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../engine.js', import.meta.url), 'utf8');


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

return {source,sandbox,storage,listeners};
}
