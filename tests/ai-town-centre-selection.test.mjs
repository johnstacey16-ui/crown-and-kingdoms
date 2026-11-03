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

const expansionLimit=vm.runInNewContext(source+'\n;aiTownCentreLimit',{});
assert.equal(expansionLimit(1,2000,50,0),1,'Feudal Age never unlocks another Town Centre');
assert.equal(expansionLimit(2,899,24,0),1,'Castle expansion has a minimum elapsed match time');
assert.equal(expansionLimit(2,900,23,0),1,'Castle expansion requires a functioning economy');
assert.equal(expansionLimit(2,900,24,0),2,'Castle Age may construct a second paid Centre');
assert.equal(expansionLimit(2,2000,60,0),2,'Castle Age never unlocks a third Centre');
assert.equal(expansionLimit(3,1499,40,0),2,'Imperial third Centre waits for long-match growth');
assert.equal(expansionLimit(3,1500,35,0),2,'Imperial third Centre requires enough workers');
assert.equal(expansionLimit(3,1500,36,0),3,'Imperial Age may unlock a third paid Centre');
assert.equal(expansionLimit(3,2500,50,6),1,'Sudden Death disallows extra Town Centres');

function townTraining({age=3,villagers=49,save=false,research=false,centres=3}={}){
 const buildings=Array.from({length:centres},(_,i)=>({t:1,k:'tc',id:i,hp:900,done:true,q:[],rs:null}));
 const trained=[];
 const ctx={
  S:{age:[0,age]},U:{vil:{cost:{f:50}}},diff:2,aip:0,PERS:[{v:1}],
  aiSavingAgeFood:()=>save,aiTownTechReady:()=>research,can:()=>true,
  train:(b,k)=>{b.q.push({k});trained.push(b.id);return true}
 };
 const api=vm.runInNewContext(source+'\n;aiTrainTownVillagers',ctx);
 const workers=Array.from({length:villagers},()=>({k:'vil',hp:25}));
 return {buildings,workers,trained,run:()=>api(1,workers,buildings,buildings[0])};
}
{
 const h=townTraining();
 assert.equal(h.run(),1,'only one new villager is queued at the total worker cap');
 assert.equal(h.trained.length,1);
 assert.equal(h.run(),0,'all centres share the same total queued-villager budget');
}
{
 const h=townTraining({villagers:33,research:true});
 assert.equal(h.run(),2,'secondary centres keep training when the primary reserves research');
 assert.deepEqual(h.trained,[1,2],'research-ready primary Centre does not train');
}
{
 const h=townTraining({villagers:33,save:true});
 assert.equal(h.run(),0,'no Centre may consume food reserved for the next age');
 assert.equal(h.trained.length,0);
}
{
 const h=townTraining({age:1,villagers:11,centres:1});
 assert.equal(h.run(),1,'single-centre early game retains normal villager production');
}
console.log('ai-town-centre-expansion: age, queue, research and paid-worker gates passed');
