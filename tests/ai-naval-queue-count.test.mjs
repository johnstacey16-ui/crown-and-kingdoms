import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai = readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const sim = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
assert.match(sim, /b\.q\.push\(\{k,t:/, 'training queues store objects with a unit key and a duration');
assert.match(sim, /k==='skirm'&&S\.tech\[t\]\?\.elsk\?22:d\.t/, 'Elite Skirmisher queue uses upgraded 22-second training; others use source duration');
assert.ok(ai.includes("const queuedUnits=k=>aiQueuedUnits(bl,k)"), 'AI uses centralized unit queue-counting policy');
const aiQueuedUnits=vm.runInNewContext(ai+'\n;aiQueuedUnits;');
for (const kind of ['gal', 'fish', 'scout', 'cart', 'cog']) {
  assert.ok(ai.includes("queuedUnits('"+kind+"')"), `AI accounts for queued ${kind} units`);
}
assert.ok(!ai.includes("q=>q==='gal'"), 'AI must not compare queued objects directly to strings');

assert.equal(aiQueuedUnits([
  { k: 'dock', hp: 100, q: [{ k: 'gal', t: 10 }, { k: 'fish', t: 4 }] },
  { k: 'dock', hp: 100, q: [{ k: 'gal', t: 5 }, { k: 'gal', t: 8 }] },
  { k: 'dock', hp: 0, q: [{ k: 'gal', t: 2 }] },
], 'gal'), 3, 'only living production buildings count their queued galleys');
console.log('ai-naval-queue-count: passed');
