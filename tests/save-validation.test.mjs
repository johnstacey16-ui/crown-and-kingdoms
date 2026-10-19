import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const save=readFileSync(new URL('../js/save.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const start=save.indexOf('if(!j||j.v!==1||');
const restore=save.indexOf('setSize(j.sz)');
const finish=save.indexOf("{note('No valid save found');return false}",start);
assert.ok(start>=0&&finish>start&&restore>finish,
  'Save validation must reject malformed payloads before allocating a map or replacing game state');
const validation=save.slice(start,finish);

// Keep the important structural, timing, team and reference checks, without depending
// on their ordering or the obsolete single-line guard used by previous builds.
for(const required of [
  '!Number.isFinite(j.t)||j.t<0',
  '!Number.isInteger(j.sz)','!SZ.includes(j.sz)',
  '!Array.isArray(j.us)','!Array.isArray(j.bs)','!Array.isArray(j.nodes)',
  '!Array.isArray(j.res)','!Array.isArray(j.age)','!Array.isArray(j.tech)',
  'j.res.length<2','j.res.length>4',
  '!j.age.every','!j.tech.every',
  'j.wt.length!==j.sz*j.sz','j.ex.length!==j.sz*j.sz',
  '!j.res.every','!j.us.every(u=>validSavedUnitOrders(u,j.sz)',
  'validSavedProduction(b)','j.rngState!==undefined'
])assert.ok(validation.includes(required),'Save guard must validate '+required);
assert.match(save,/try\{j=JSON\.parse\(localStorage\.getItem\(auto\?'ck_autosave':skey\(slot\)\)\)\}catch\(e\)\{\}/,
  'malformed JSON must be reported as an invalid save rather than a loader crash');
assert.match(save,/const mirror=window\.CK_STORAGE\.mirrorSave\(key,payload\);if\(mirror&&typeof mirror\.catch==='function'\)mirror\.catch\(\(\)=>\{\}\)/,
  'an asynchronous backup rejection must not interrupt the primary save');
assert.match(save,/catch\(e\)\{\}\s*localStorage\.setItem\(key,payload\)/,
  'an optional backup failure must not prevent the primary save write');

// Exercise the real loader's early-rejection path without booting the renderer.
const validShape = () => ({
  v: 1, t: 0, sz: 96, us: [], bs: [], nodes: [], pl: {},
  res: [{ f: 0, w: 0, g: 0, s: 0 }, { f: 0, w: 0, g: 0, s: 0 }],
  age: [0, 0], tech: [{}, {}], cam: { x: 0, y: 0 },
  wt: '0'.repeat(96 * 96), ex: '0'.repeat(96 * 96),
});
function attemptLoad(raw) {
  const sentinel = { untouched: true };
  const messages = [];
  const sandbox = {
    localStorage: { getItem: () => raw },
    skey: () => 'slot-1',
    slot: 0,
    note: message => messages.push(message),
    SZ: [72, 96, 128, 176],
    B: { tc: {}, house: {} },
    U: { vil: {} },
    S: sentinel,
  };
  vm.runInNewContext(save, sandbox, { filename: 'js/save.js' });
  const result = sandbox.loadG();
  return { result, state: sandbox.S, messages };
}
for (const [label, raw] of [
  ['invalid JSON', '{not-json'],
  ['missing simulation time', JSON.stringify((({ t, ...rest }) => rest)(validShape()))],
  ['negative simulation time', JSON.stringify({ ...validShape(), t: -1 })],
  ['non-finite simulation time', JSON.stringify({ ...validShape(), t: 'not-a-number' })],
  ['unsupported size', JSON.stringify({ ...validShape(), sz: 77, wt: '0'.repeat(77 * 77), ex: '0'.repeat(77 * 77) })],
  ['invalid terrain code', JSON.stringify({ ...validShape(), wt: 'x' + '0'.repeat(96 * 96 - 1) })],
  ['invalid explored code', JSON.stringify({ ...validShape(), ex: 'x' + '0'.repeat(96 * 96 - 1) })],
  ['negative resource', JSON.stringify({ ...validShape(), res: [{ f: -1, w: 0, g: 0, s: 0 }, { f: 0, w: 0, g: 0, s: 0 }] })],
  ['missing resources', JSON.stringify({ ...validShape(), res: undefined })],
  ['missing camera state', JSON.stringify((({ cam, ...rest }) => rest)(validShape()))],
  ['non-finite camera position', JSON.stringify({ ...validShape(), cam: { x: 0, y: 'invalid' } })],
  ['array camera state', JSON.stringify({ ...validShape(), cam: [] })],
  ['unit outside map', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 200, y: 1 }] })],
  ['unknown unit type', JSON.stringify({ ...validShape(), us: [{ k: 'not-a-unit', t: 0, x: 1, y: 1 }] })],
  ['unit missing health', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 1, y: 1 }] })],
  ['negative unit health', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 1, y: 1, hp: -1 }] })],
  ['non-finite unit health', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 1, y: 1, hp: 'invalid' }] })],
  ['node outside map', JSON.stringify({ ...validShape(), nodes: [{ k: 'f', x: 1, y: 99, amt: 10 }] })],
  ['unknown building type', JSON.stringify({ ...validShape(), bs: [{ k: 'not-a-building', t: 0, x: 1, y: 1, s: 1 }] })],
  ['building missing health', JSON.stringify({ ...validShape(), bs: [{ k: 'house', t: 0, x: 1, y: 1, s: 2, mh: 200 }] })],
  ['negative building health', JSON.stringify({ ...validShape(), bs: [{ k: 'house', t: 0, x: 1, y: 1, s: 2, hp: -1, mh: 200 }] })],
  ['invalid building maximum health', JSON.stringify({ ...validShape(), bs: [{ k: 'house', t: 0, x: 1, y: 1, s: 2, hp: 50, mh: 0 }] })],
  ['unknown resource-node type', JSON.stringify({ ...validShape(), nodes: [{ k: 'not-a-resource', x: 1, y: 1, amt: 10 }] })],
  ['unit reference outside entity arrays', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 1, y: 1, tg: 'b9' }] })],
  ['non-array unit cargo references', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 1, y: 1, cg: 'not-an-array' }] })],
  ['invalid relic reference', JSON.stringify({ ...validShape(), rel: [{ x: 1, y: 1, c: 'b9', m: null }] })],
  ['non-array relic collection', JSON.stringify({ ...validShape(), rel: {} })],
]) {
  const attempt = attemptLoad(raw);
  assert.equal(attempt.result, false, `${label} must be rejected`);
  assert.equal(attempt.state.untouched, true, `${label} must not replace the current game state`);
  assert.ok(attempt.messages.includes('No valid save found'), `${label} must show a recoverable message`);
}

// A broken optional IndexedDB adapter must not prevent the primary localStorage write.
const writes = new Map();
const backupFailureSandbox = {
  window: { CK_STORAGE: { mirrorSave() { throw new Error('IndexedDB unavailable'); } } },
  localStorage: {
    setItem(key, value) { writes.set(key, value); },
    getItem(key) { return writes.get(key) ?? null; },
  },
  S: {
    nodes: [], bs: [], us: [], rel: [], wt: [], ex: [], res: [], age: [], tech: [], ai: [],
    t: 0, pal: 0, kh: [], vc: [], px: [], civ: [0, 1], dip: [], vp: [],
  },
  W: 72, vm: 0, scoreLimit: 1200, aip: 0, cmp: null, diff: 0, cam: {},
  slot: 0, skey: () => 'ck_save', hs: 0,
  note() {},
};
vm.runInNewContext(save, backupFailureSandbox, { filename: 'js/save.js' });
assert.equal(backupFailureSandbox.saveG(true), true,
  'a failing backup adapter must not fail the primary save');
assert.ok(writes.has('ck_autosave'),
  'the primary rolling autosave must be written even when the backup adapter throws');

// A rejected asynchronous mirror must have a rejection handler attached immediately.
let rejectionHandled = false;
const asyncMirrorSandbox = {
  window: { CK_STORAGE: { mirrorSave() {
    return { catch(handler) { rejectionHandled = typeof handler === 'function'; return this; } };
  } } },
  localStorage: {
    setItem(key, value) { writes.set(key, value); },
    getItem(key) { return writes.get(key) ?? null; },
  },
  S: {
    nodes: [], bs: [], us: [], rel: [], wt: [], ex: [], res: [], age: [], tech: [], ai: [],
    t: 0, pal: 0, kh: [], vc: [], px: [], civ: [0, 1], dip: [], vp: [],
  },
  W: 72, vm: 0, scoreLimit: 1200, aip: 0, cmp: null, diff: 0, cam: {},
  slot: 0, skey: () => 'ck_save', hs: 0,
  note() {},
};
vm.runInNewContext(save, asyncMirrorSandbox, { filename: 'js/save.js' });
assert.equal(asyncMirrorSandbox.saveG(true), true,
  'an asynchronous backup mirror must not block the primary autosave');
assert.equal(rejectionHandled, true,
  'the save path must attach a rejection handler to asynchronous backup mirroring');

console.log('save-validation: malformed saves rejected before restore; synchronous and asynchronous backup failures cannot block primary saves');


// Guard the actual engine autosave policy: one rolling local checkpoint, once per minute,
// and never while the shared multiplayer session is active.
assert.match(engine, /let lastAutoSaveAt=-60000;/,
  'the autosave clock must initialize so a new single-player session can checkpoint promptly');
assert.match(engine, /now-lastAutoSaveAt>=60000/,
  'active play must use a 60-second autosave interval');
assert.match(engine, /S&&!\(window\.CK_NET&&window\.CK_NET\.isRunning\(\)\)&&now-lastAutoSaveAt>=60000\)\{lastAutoSaveAt=now;saveG\(true\)\}/,
  'the frame loop must suppress rolling local autosaves while multiplayer is running');
assert.match(save, /const key=auto\?'ck_autosave':skey\(slot\)/,
  'automatic saves must reuse one fixed rolling slot rather than creating a growing save history');

// A failed primary write must report failure and leave the previous checkpoint intact.
const previousCheckpoint = JSON.stringify({ v: 1, marker: 'previous-checkpoint' });
let storedCheckpoint = previousCheckpoint;
const failedPrimaryWriteSandbox = {
  window: {},
  localStorage: {
    setItem() { throw new Error('quota exceeded'); },
    getItem(key) { return key === 'ck_autosave' ? storedCheckpoint : null; },
  },
  S: {
    nodes: [], bs: [], us: [], rel: [], wt: [], ex: [], res: [], age: [], tech: [], ai: [],
    t: 0, pal: 0, kh: [], vc: [], px: [], civ: [0, 1], dip: [], vp: [],
  },
  W: 72, vm: 0, scoreLimit: 1200, aip: 0, cmp: null, diff: 0, cam: {},
  slot: 0, skey: () => 'ck_save', hs: 0,
  note() {},
};
vm.runInNewContext(save, failedPrimaryWriteSandbox, { filename: 'js/save.js' });
assert.equal(failedPrimaryWriteSandbox.saveG(true), false,
  'a failed primary autosave write must return failure');
assert.equal(storedCheckpoint, previousCheckpoint,
  'a failed primary write must not overwrite the previous checkpoint');
