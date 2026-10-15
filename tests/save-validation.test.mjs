import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const guard = save.indexOf("if(!j||j.v!==1||!Number.isFinite(j.t)||j.t<0||!Number.isInteger(j.sz)");
const restore = save.indexOf('setSize(j.sz)');
assert.ok(guard >= 0, 'loadG must validate a save payload before restoring it');
assert.ok(restore > guard, 'payload validation must run before map allocation and state replacement');

const validation = save.slice(guard, save.indexOf("{note('No valid save found');return false}", guard));
for (const required of [
  '!Array.isArray(j.us)',
  '!Array.isArray(j.bs)',
  '!Array.isArray(j.nodes)',
  '!Array.isArray(j.res)',
  '!Array.isArray(j.age)',
  '!Array.isArray(j.tech)',
  '!Array.isArray(j.pl)',
  '!j.us.every(u=>u&&typeof u===\'object\'&&!Array.isArray(u)&&typeof u.k===\'string\'&&!!U[u.k]&&Number.isInteger(u.t)&&u.t>=0&&u.t<j.res.length&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<j.sz&&u.y<j.sz)',
  '!j.bs.every(b=>b&&typeof b===\'object\'&&!Array.isArray(b)&&typeof b.k===\'string\'&&!!B[b.k]&&Number.isInteger(b.t)&&b.t>=0&&b.t<j.res.length&&Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isInteger(b.s)&&b.s>0&&b.x>=0&&b.y>=0&&b.x+b.s<=j.sz&&b.y+b.s<=j.sz)',
  '!j.nodes.every(n=>n&&typeof n===\'object\'&&!Array.isArray(n)&&[\'f\',\'w\',\'g\',\'s\'].includes(n.k)&&Number.isInteger(n.x)&&Number.isInteger(n.y)&&n.x>=0&&n.y>=0&&n.x<j.sz&&n.y<j.sz&&Number.isFinite(n.amt)&&n.amt>=0)',
  '!Array.isArray(j.rel)&&j.rel!==undefined',
  '!j.us.every(u=>refOK(u.tg,counts)&&refOK(u.ld,counts)',
  '!j.bs.every(b=>b.cg===undefined||Array.isArray(b.cg)',
  "typeof j.wt!=='string'",
  "typeof j.ex!=='string'",
  'j.wt.length!==j.sz*j.sz',
  'j.ex.length!==j.sz*j.sz',
  '!/^[012]+$/.test(j.wt)',
  '!/^[01]+$/.test(j.ex)',
  '!j.res.every(r=>[\'f\',\'w\',\'g\',\'s\'].every(k=>Number.isFinite(r[k])&&r[k]>=0))',
]) {
  assert.ok(validation.includes(required), `save validation must reject incomplete or malformed field: ${required}`);
}
assert.ok(validation.includes('!Number.isFinite(j.t)||j.t<0'), 'saved simulation time must be finite and non-negative');
assert.ok(validation.includes('!SZ.includes(j.sz)'), 'saved map dimensions must match one of the supported map sizes before allocation');
assert.ok(validation.includes('j.res.length<2') && validation.includes('j.res.length>4'), 'save team count must be bounded to supported kingdom counts');
assert.ok(validation.includes('j.age.length!==j.res.length') && validation.includes('j.tech.length!==j.res.length') && validation.includes('j.pl.length!==j.res.length'), 'team-indexed arrays must agree before restoration');
assert.ok(validation.includes("!j.res.every(r=>r&&typeof r==='object'&&!Array.isArray(r))"), 'each kingdom must have a resource object');
assert.ok(validation.includes('!j.age.every(Number.isFinite)'), 'each kingdom age must be numeric');
assert.ok(validation.includes("!j.tech.every(t=>t&&typeof t==='object'&&!Array.isArray(t))"), 'each kingdom must have a technology object');
assert.match(save, /try\{j=JSON\.parse\(localStorage\.getItem\(skey\(slot\)\)\)\}catch\(e\)\{\}/, 'invalid JSON must remain a recoverable invalid-save result');

// Exercise the real loader's early-rejection path without booting the renderer.
const validShape = () => ({
  v: 1, t: 0, sz: 96, us: [], bs: [], nodes: [],
  res: [{ f: 0, w: 0, g: 0, s: 0 }, { f: 0, w: 0, g: 0, s: 0 }],
  age: [0, 0], tech: [{}, {}], pl: [{}, {}],
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
  ['unit outside map', JSON.stringify({ ...validShape(), us: [{ k: 'vil', t: 0, x: 200, y: 1 }] })],
  ['unknown unit type', JSON.stringify({ ...validShape(), us: [{ k: 'not-a-unit', t: 0, x: 1, y: 1 }] })],
  ['node outside map', JSON.stringify({ ...validShape(), nodes: [{ k: 'f', x: 1, y: 99, amt: 10 }] })],
  ['unknown building type', JSON.stringify({ ...validShape(), bs: [{ k: 'not-a-building', t: 0, x: 1, y: 1, s: 1 }] })],
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

console.log('save-validation: malformed JSON, missing arrays, invalid map dimensions and incomplete terrain data are rejected before restore');
