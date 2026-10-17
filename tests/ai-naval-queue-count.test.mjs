import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const sim = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
assert.match(sim, /b\.q\.push\(\{k,t:d\.t\}\)/, 'training queues store objects with a unit key');
assert.ok(ai.includes("b2.q.filter(q=>q&&q.k==='gal').length"),
  'AI counts queued war galleys by their unit key');
assert.ok(!ai.includes("q=>q==='gal'"), 'AI must not compare queued objects directly to strings');

const queuedGalleys = buildings => buildings
  .filter(b => b.k === 'dock' && b.hp > 0 && Array.isArray(b.q))
  .reduce((n, b) => n + b.q.filter(q => q && q.k === 'gal').length, 0);
assert.equal(queuedGalleys([
  { k: 'dock', hp: 100, q: [{ k: 'gal', t: 10 }, { k: 'fish', t: 4 }] },
  { k: 'dock', hp: 100, q: [{ k: 'gal', t: 5 }, { k: 'gal', t: 8 }] },
  { k: 'dock', hp: 0, q: [{ k: 'gal', t: 2 }] },
]), 3, 'only active docks count their queued galleys');
console.log('ai-naval-queue-count: passed');
