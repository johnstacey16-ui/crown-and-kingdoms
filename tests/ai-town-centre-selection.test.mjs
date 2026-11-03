import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

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

{
 const {source:gameSource,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(gameSource,sandbox,{timeout:15000});
 const scenario=[
  "seedOv=123456;msz=0;mt=3;kingdoms=2;cmp=null;gameMode=0;vm=0;startAge=3;startRes=3;startArmy=0;startVillagers=1;popLimit=200;diff=2;aip=0;start();",
  "const home=S.bs.find(b=>b&&b.t===1&&b.k==='tc'&&b.hp>0);if(!home)throw Error('No enemy home Town Centre');",
  "const secondary=put(1,'tc',home.x-12,home.y-12);if(!secondary)throw Error('No legal second Town Centre site');",
  "for(let i=0;i<8;i++)put(1,'house',home.x+9+(i%3)*5,home.y+9+Math.floor(i/3)*5);",
  "let workers=S.us.filter(u=>u&&u.t===1&&u.k==='vil'&&u.hp>0).length;",
  "for(let radius=3;radius<=25&&workers<36;radius++)for(let dy=-radius;dy<=radius&&workers<36;dy++)for(let dx=-radius;dx<=radius&&workers<36;dx++){",
  " if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const x=home.x+dx,y=home.y+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;",
  " const p=y*W+x;if(S.g[p]||S.wt[p]||S.nd[p]||S.us.some(u=>u&&u.hp>0&&!u.ld&&Math.floor(u.x)===x&&Math.floor(u.y)===y))continue;",
  " addU(1,'vil',x+.5,y+.5);workers++;}",
  "if(workers<36)throw Error('Unable to establish 36 legal Imperial workers');",
  "S.t=1600;S.age[1]=3;S.res[1]={f:10000,w:10000,g:10000,s:10000};",
  "const before=S.bs.filter(b=>b&&b.t===1&&b.k==='tc'&&b.hp>0).length;",
  "for(let i=0;i<4;i++){S.ai[1].cd=0;aiTeam(1,.2);S.t+=3;}",
  "const all=S.bs.filter(b=>b&&b.t===1&&b.k==='tc'&&b.hp>0);",
  "return {before,after:all.length,thirdStarted:all.some(b=>b!==home&&b!==secondary&&!b.done),secondaryQueue:secondary.q.filter(q=>q&&q.k==='vil').length,workers,capacity:capOf(1)};"
 ].join('\n');
 const state=vm.runInContext('(function(){'+scenario+'})()',sandbox,{timeout:15000});
 assert.equal(state.before,2,'test starts with exactly two legitimate centres');
 assert.equal(state.workers,36,'third-Centre expansion has its normal worker prerequisites');
 assert.equal(state.after,3,'real Imperial AI constructs a third, reachable Town Centre foundation');
 assert.equal(state.thirdStarted,true,'new expansion remains under construction and needs real worker time');
 assert.ok(state.secondaryQueue>0,
  'completed secondary Centre trains paid villagers during the Imperial economy');
}
console.log('ai-town-centre-integration: real Imperial decision builds a third Centre and queues secondary workers');
