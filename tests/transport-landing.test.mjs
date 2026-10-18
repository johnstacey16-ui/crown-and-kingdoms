import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function transportLandingRoute(');
const end = simulation.indexOf('\nfunction tickTrader(', start);
assert.ok(start >= 0 && end > start);
const state = readFileSync(new URL('../js/state.js', import.meta.url), 'utf8');
const directions = state.slice(state.indexOf('const D8='), state.indexOf(';', state.indexOf('const D8=')) + 1);

// Isolate beach selection from A*: the stub checks the actual goal predicate
// and returns a chosen water endpoint. All unlisted tiles are blocked.
function fixture(beaches, water, endpoint = water[0]) {
 const W = 24, H = 24;
 const S = { us: [], g: new Uint8Array(W * H).fill(1), nd: new Array(W * H).fill(null), wt: new Uint8Array(W * H) };
 for (const [x, y] of beaches) S.g[y * W + x] = 0;
 for (const [x, y] of water) { S.g[y * W + x] = 0; S.wt[y * W + x] = 1; }
 const calls = [];
 const context = { W, H, S, path: (u, goal) => {
  calls.push(goal);
  return endpoint && goal(...endpoint) ? [[u.x, u.y], endpoint.map(n => n + .5)] : null;
 } };
 const landing = vm.runInNewContext(directions + '\n' + simulation.slice(start, end) + ';transportLandingRoute', context);
 return { S, calls, context, run: (x = 10.5, y = 10.5) => landing({ k: 'trn', x: 2.5, y: 2.5 }, x, y) };
}
const beachOf = result => result && Array.from(result.beach);

test('landing radius includes distance five and rejects points just outside it', () => {
 // A 3-4-5 offset exercises both squared-distance terms.
 for (const [offset, accepted] of [[1e-6, true], [0, true], [-1e-6, false]]) {
  const f = fixture([[13, 14]], [[14, 14]]);
  assert.deepEqual(beachOf(f.run(10.5 + offset, 10.5)), accepted ? [13, 14] : null);
  assert.equal(f.calls.length, accepted ? 1 : 0);
 }
});

test('only living unloaded units occupy beach tiles, using fractional tile coordinates', () => {
 for (const [unit, blocked] of [
  [{ hp: 10, x: 15.999, y: 10.999 }, true], // outer local-search column
  [{ hp: 0, x: 15.5, y: 10.5 }, false],
  [{ hp: 10, ld: {}, x: 15.5, y: 10.5 }, false],
  [{ hp: 10, x: NaN, y: 10.5 }, false],
  [{ hp: 10, x: Infinity, y: 10.5 }, false],
  [{ hp: 10, x: 16, y: 10.5 }, false], // just outside local bounds
  [null, false],
 ]) {
  const f = fixture([[15, 10]], [[16, 10]]);
  f.S.us.push(unit);
  assert.deepEqual(beachOf(f.run()), blocked ? null : [15, 10]);
 }
});

test('shared staging selects the nearest valid beach and skips blocked neighbours', () => {
 const f = fixture([[10, 9], [9, 10]], [[10, 10]]);
 assert.deepEqual(beachOf(f.run(9.5, 10.5)), [9, 10]); // farther beach is scanned first
 f.S.us.push({ hp: 10, x: 9.5, y: 10.5 });
 assert.deepEqual(beachOf(f.run(9.5, 10.5)), [10, 9]);
 f.S.nd[9 * 24 + 10] = {};
 assert.equal(f.run(9.5, 10.5), null);

 // Diagonal water alone must not allow crossing a dry/blocked corner.
 const diagonal = fixture([[10, 10]], [[11, 11]]);
 assert.equal(diagonal.run(), null);
 const sides = fixture([[10, 10]], [[11, 11], [11, 10], [10, 11]], [11, 11]);
 assert.deepEqual(beachOf(sides.run()), [10, 10]);
 for (const field of ['g', 'nd']) {
  sides.S[field][10 * 24 + 11] = 1;
  assert.equal(sides.run(), null);
  sides.S[field][10 * 24 + 11] = 0;
 }
});

test('no-candidate and failed-route fallbacks remain null without extra path searches', () => {
 const empty = fixture([], []);
 assert.equal(empty.run(), null);
 assert.equal(empty.calls.length, 0);
 for (const route of [null, [], [[2.5, 2.5], [20.5, 20.5]]]) {
  const f = fixture([[10, 10]], [[11, 10]]);
  f.context.path = (u, goal) => { f.calls.push(goal); return route; };
  assert.equal(f.run(), null, 'missing, empty or unrelated route endpoint is rejected');
  assert.equal(f.calls.length, 1);
 }
});
