import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function upB(b,dt)');
const end = simulation.indexOf('\nfunction ', start + 1);
assert.ok(start >= 0 && end > start, 'Building update function must remain isolated');
const update = simulation.slice(start, end);

assert.match(update, /^function upB\(b,dt\)\{if\(!b\|\|!b\.done\|\|b\.hp<=0\|\|!Number\.isFinite\(dt\)\|\|dt<=0\)return;/,
  'The building tick must refuse absent, unfinished, destroyed or invalid-timestep work');
const upB=vm.runInNewContext(update+'\n;upB;');
for(const building of [null,{done:false,hp:100,rs:{k:'loom',t:1},q:[{k:'vil',t:1}]},{done:true,hp:0,rs:{k:'loom',t:1},q:[{k:'vil',t:1}]}]){
 const before=JSON.stringify(building);
 assert.doesNotThrow(()=>upB(building,0.5),'invalid building may not advance work');
 assert.equal(JSON.stringify(building),before,'invalid building may not alter its research or production queue');
}
assert.match(update, /if\(b\.rs\)\{b\.rs\.t-=dt/,
  'Living completed buildings must continue advancing research');
assert.match(update, /if\(!b\.q\.length\)return;const q=b\.q\[0\]/,
  'Living completed buildings must continue processing their production queue');

console.log('destroyed-building-work: defeated buildings cannot finish research or production');
