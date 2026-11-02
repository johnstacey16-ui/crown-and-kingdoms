import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Test the real production helper, not a substring of its current source
// formatting. This preserves the centre preference across AI refactors.
const source = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
function choose(buildings) {
 const context = vm.createContext({S:{bs:buildings,us:[]},U:{}});
 vm.runInContext(source+'\n;globalThis.chooseCentre=()=>aiTeamRoster(1).tc;',context);
 return context.chooseCentre();
}
const unfinished = { k: 'tc', t: 1, hp: 100, done: false };
const ready = { k: 'tc', t: 1, hp: 500, done: true };
const destroyed = { k: 'tc', t: 1, hp: 0, done: true };
assert.equal(choose([unfinished, ready]), ready, 'completed centre takes priority');
assert.equal(choose([ready, unfinished]), ready, 'completed centre remains selected');
assert.equal(choose([destroyed, unfinished]), unfinished, 'unfinished centre remains fallback');
assert.equal(choose([destroyed]), null, 'destroyed centre cannot be selected');
assert.equal(choose([{ ...ready, t: 0 }, ready]), ready, 'opponent centres are ignored');
console.log('ai-town-centre-selection: production helper passed');
