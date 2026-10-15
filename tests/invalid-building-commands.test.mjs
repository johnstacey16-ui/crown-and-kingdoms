import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

function body(name, nextName) {
  const start = simulation.indexOf(`function ${name}(`);
  const end = simulation.indexOf(`\nfunction ${nextName}(`, start + 1);
  assert.ok(start >= 0 && end > start, `${name} must remain isolated in simulation.js`);
  return simulation.slice(start, end);
}

const train = body('train', 'cancelQ');
assert.match(train, /^function train\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\|\|!Array\.isArray\(B\[b\.k\]\.tr\)\|\|!B\[b\.k\]\.tr\.includes\(k\)\|\|!U\[k\]\|\|!Array\.isArray\(b\.q\)\)return false;/,
  'Training must reject dead, unfinished, invalid, or incompatible buildings before spending resources');
assert.match(train, /pay\(t,d\.cost\);b\.q\.push/,
  'Valid production must still charge resources and queue the unit');

const research = body('research', 'MILITARY_PRODUCTION_BUILDINGS');
assert.match(research, /^function research\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!S\|\|!Number\.isInteger\(b\.t\)\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\)return false;/,
  'Research must reject dead or unfinished buildings before charging resources');
assert.match(research, /pay\(t,d\.cost\);b\.rs=\{k,t:d\.t\}/,
  'Valid research must still charge resources and start');

console.log('invalid-building-commands: dead, unfinished and incompatible production/research rejected');
