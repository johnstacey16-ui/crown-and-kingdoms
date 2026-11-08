import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

// Both left/right controller actions in the setup menu must offer the same limits.
const choices = '[50,100,150,200,250,300,400,500]';
assert.equal(
  html.split(choices).length - 1,
  2,
  'population-limit selector must offer 50, 100, 150, 200, 250, 300, 400 and 500 in both directions'
);

// Runtime population, destroyed housing and queue completion are exercised by
// population-completion.test.mjs and training-population-reservation.test.mjs.
assert.ok(html.includes('Math.min(popLimit,10+5*'), 'configured population limit remains an upper cap');
assert.match(html, /if\(b\.q\.length>=5\)return false/, 'production queue limit remains intact');
console.log('population-limits: setup limits and queue size passed');

// Population settings offer 50, 100, 150, 200, 250, 300, 400 and 500.
// Both controller directions must wrap over the entire list, not just its first four values.
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+a\.length-1\)%a\.length\]/,
  'Left should cycle backwards through every supported population limit');
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+1\)%a\.length\]/,
  'Right should cycle forwards through every supported population limit');


function trainingWorld(mission){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario('+mission+');globalThis.run=code=>eval(code);',sandbox);
 return sandbox.run;
}

test('over-cap campaign training explains the actual paid housing deficit without spending',()=>{
 const run=trainingWorld(14);
 const result=JSON.parse(run(`(()=>{
  const home=tcOf(0);while(popOf(0)<=capOf(0))addU(0,'mil',home.x+6,home.y+6);
   const before={...S.res[0]},queue=home.q.length;
  const accepted=train(home,'vil');
  return JSON.stringify({accepted,before,after:S.res[0],queue,afterQueue:home.q.length,
   population:popOf(0),capacity:capOf(0),message:notes.at(-1).s});
 })()`));
 assert.ok(result.population>result.capacity,'the initial Tidewatch army and flotilla exceed starting housing');
 assert.equal(result.capacity,35,'the supplied Tidewatch garrison now has five completed Houses');
 assert.equal(result.accepted,false);
 const houses=Math.ceil((result.population+1-result.capacity)/5);
 assert.equal(result.message,`Population full (${result.population}/${result.capacity}): build ${houses} House${houses===1?'':'s'}`,'explain the actual paid housing needed for one more Villager');
 assert.deepEqual(result.after,result.before,'a blocked training order never charges the unit');
 assert.equal(result.afterQueue,result.queue,'a blocked order never reserves another slot');
});

test('training feedback counts queue reservations and never recommends Houses past the match limit',()=>{
 const run=trainingWorld(0);
 const queued=JSON.parse(run(`(()=>{
  const home=tcOf(0);for(let i=0;i<5;i++)train(home,'vil');
  const before={...S.res[0]},accepted=train(home,'vil');
  return JSON.stringify({accepted,population:popOf(0),message:notes.at(-1).s,before,after:S.res[0]});
 })()`));
 assert.equal(queued.population,10,'live workers and paid queues use the same housing ledger');
 assert.equal(queued.accepted,false);
 assert.equal(queued.message,'Population full (10/10): build 1 House');
 assert.deepEqual(queued.after,queued.before);
 const capped=JSON.parse(run(`(()=>{
  tcOf(0).q=[];for(let i=0;i<45;i++)addU(0,'mil',20+i%8,20+Math.floor(i/8));
  popLimit=50;const before={...S.res[0]},accepted=train(tcOf(0),'vil');
  return JSON.stringify({accepted,message:notes.at(-1).s,before,after:S.res[0]});
 })()`));
 assert.equal(capped.accepted,false);
 assert.equal(capped.message,'Population limit reached (50/50)');
 assert.deepEqual(capped.after,capped.before,'the hard limit does not charge or suggest wasted housing');
});
