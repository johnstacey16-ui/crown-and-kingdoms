import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation-production-queues.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function cancelQ(b){');
const end = simulation.length;
assert.ok(start >= 0 && end > start, 'Queue cancellation must remain isolated');
const cancel = simulation.slice(start, end);

assert.match(cancel, /^function cancelQ\(b\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!Array\.isArray\(b\.q\)\|\|!b\.q\.length\)return false;/,
  'Cancellation must reject dead, unfinished, invalid-owner and empty-queue buildings');
assert.match(cancel, /if\(!q\|\|!U\[q\.k\]\)\{b\.q\.pop\(\);return false\}/,
  'Malformed queue entries must not cause a refund');
assert.match(cancel,/b\.q\.pop\(\);[\s\S]*if\(q\.mercKipchak===true&&q\.k==='kipchak'\)/,
  'Cancelling a paid mercenary claim rolls back its count');
assert.match(cancel,/const paid=q\.paidCost,base=U\[q\.k\]\.cost\|\|\{\}/,
  'The refund uses the actual paid price, even after later upgrades');
assert.match(cancel,/pay\(b\.t,valid\?paid:typeof unitTrainingCost==='function'\?unitTrainingCost\(b\.t,q\.k\):base,1\)/,
  'Refund fallback remains bounded and uses the authoritative training-cost function');
assert.match(cancel,/note\('Cancelled - full refund'\);return true/,
  'The user is informed after refund completes');

console.log('production-cancellation-validation: stale and malformed cancellation rejected');
