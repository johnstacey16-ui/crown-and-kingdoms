import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const production = readFileSync(new URL('../js/simulation-production-queues.js', import.meta.url), 'utf8');
const researchRules = readFileSync(new URL('../js/simulation-research.js', import.meta.url), 'utf8');

function body(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = nextName ? source.indexOf(`\nfunction ${nextName}(`, start + 1) : source.length;
  assert.ok(start >= 0 && end > start, `${name} must remain isolated in its production owner`);
  return source.slice(start, end);
}

const train = body(production, 'train', 'cancelQ');
assert.match(train, /^function train\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!Number\.isInteger\(b\.t\)\|\|!S\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\|\|!Array\.isArray\(B\[b\.k\]\.tr\)\|\|!trOf\(b\)\.includes\(k\)\|\|!U\[k\]\|\|!Array\.isArray\(b\.q\)\|\|b\.rs\)return false;/,
  'Training must reject dead, unfinished, incompatible or concurrently researching buildings before spending resources');
assert.match(train, /pay\(t,d\.cost\);b\.q\.push/,
  'Valid production must still charge resources and queue the unit');

// Exercise the production function's preconditions without calling the economy.
const trainFn=vm.runInNewContext(train+'\ntrain;', {trOf:()=>['vil'],S:{tech:[{}]},B:{tc:{tr:['vil']}},U:{vil:{}}});
for(const building of [null,{hp:0,done:true,t:0,k:'tc',q:[]},
  {hp:20,done:false,t:0,k:'tc',q:[]},
  {hp:20,done:true,t:0,k:'tc',q:[],rs:{k:'loom',t:5}}]){
 assert.equal(trainFn(building,'vil'),false,'an invalid or researching building may not start production');
}

const research = body(researchRules, 'research');
assert.match(research, /^function research\(b,k\)\{if\(!b\|\|b\.hp<=0\|\|!b\.done\|\|!S\|\|!Number\.isInteger\(b\.t\)\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\)return false;/,
  'Research must reject dead or unfinished buildings before charging resources');
assert.match(research, /pay\(t,d\.cost\);b\.rs=\{k,t:d\.t\}/,
  'Valid research must still charge resources and start');

console.log('invalid-building-commands: dead, unfinished and incompatible production/research rejected');
