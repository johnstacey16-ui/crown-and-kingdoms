import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = source.indexOf('for(const b of S.bs)if(b.t===t){bl.push(b);');
const end = source.indexOf('if(!tc)return;', start);
assert.ok(start >= 0 && end > start, 'town-centre selection logic exists');
function choose(buildings) {
  const context = { S: { bs: buildings }, t: 1, bl: [], tc: null };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  return context.tc;
}
const unfinished = { k: 'tc', t: 1, hp: 100, done: false };
const ready = { k: 'tc', t: 1, hp: 500, done: true };
const destroyed = { k: 'tc', t: 1, hp: 0, done: true };
assert.equal(choose([unfinished, ready]), ready, 'completed centre takes priority');
assert.equal(choose([ready, unfinished]), ready, 'completed centre remains selected');
assert.equal(choose([destroyed, unfinished]), unfinished, 'unfinished centre remains fallback');
assert.equal(choose([destroyed]), null, 'destroyed centre cannot be selected');
assert.equal(choose([{ ...ready, t: 0 }, ready]), ready, 'opponent centres are ignored');
console.log('ai-town-centre-selection: passed');
