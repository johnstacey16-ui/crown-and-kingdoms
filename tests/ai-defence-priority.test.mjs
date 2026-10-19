import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const choose = vm.runInNewContext(ai + '\n;aiBaseDefenceThreat;');

test('base defence prioritises reachable-range siege threats over slightly nearer ordinary raiders', () => {
 const base = { x: 10, y: 10, s: 2 };
 const soldier = { k: 'mil', x: 11, y: 13 };
 const ram = { k: 'ram', x: 16, y: 11 };
 assert.equal(choose([soldier, ram], base), ram);
 assert.equal(choose([soldier], base), soldier);
 assert.equal(choose([{ k: 'ram', x: 30, y: 11 }], base), null);
 assert.equal(choose([], base), null);
});

test('siege weighting handles invalid coordinates and retains original tie ordering', () => {
 const base = { x: 0, y: 0, s: 2 };
 const first = { k: 'mil', x: 4, y: 1 };
 const second = { k: 'mil', x: 4, y: 1 };
 assert.equal(choose([first, second], base), first);
 assert.equal(choose([{ k: 'ram', x: NaN, y: 1 }, first], base), first);
});

test('AI defends allies using one shared filtered roster rather than repeated full scans', () => {
 assert.match(ai, /const nearbyRaiders=S\.us\.filter\(/);
 assert.match(ai, /aiBaseDefenceThreat\(nearbyRaiders,base\)/);
});
