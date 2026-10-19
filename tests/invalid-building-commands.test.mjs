import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

function body(name, nextName) {
  const start = simulation.indexOf(`function ${name}(`);
  const end = simulation.indexOf(`\nfunction ${nextName}(`, start + 1);
  assert.ok(start >= 0 && end > start, `${name} must remain isolated in simulation.js`);
  return simulation.slice(start, end);
}

const train = body('train', 'cancelQ');
assert.match(train, /^function train\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\|\|!Array\.isArray\(B\[b\.k\]\.tr\)\|\|!B\[b\.k\]\.tr\.includes\(k\)\|\|!U\[k\]\|\|!Array\.isArray\(b\.q\)\|\|b\.rs\)return false;/,
  'Training must reject dead, unfinished, incompatible or concurrently researching buildings before spending resources');
assert.match(train, /pay\(t,d\.cost\);b\.q\.push/,
  'Valid production must still charge resources and queue the unit');

// Exercise the production function's preconditions without calling the economy.
const trainFn=vm.runInNewContext(train+'\ntrain;');
for(const building of [null,{hp:0,done:true,t:0,k:'tc',q:[]},
  {hp:20,done:false,t:0,k:'tc',q:[]},
  {hp:20,done:true,t:0,k:'tc',q:[],rs:{k:'loom',t:5}}]){
 assert.equal(trainFn(building,'vil'),false,'an invalid or researching building may not start production');
}

const research = body('research', 'trainRate');
assert.match(research, /^function research\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!S\|\|!Number\.isInteger\(b\.t\)\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\)return false;/,
  'Research must reject dead or unfinished buildings before charging resources');
assert.match(research, /pay\(t,d\.cost\);b\.rs=\{k,t:d\.t\}/,
  'Valid research must still charge resources and start');

console.log('invalid-building-commands: dead, unfinished and incompatible production/research rejected');
