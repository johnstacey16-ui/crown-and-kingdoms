// Reproducible full simulation run. This does not exercise browser/controller UI.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from '../tests/helpers/headless-game.mjs';
const seed=Number(process.env.CK_SEED??123456);
const difficulty=Number(process.env.CK_DIFFICULTY??2);
const reloadAt=Number(process.env.CK_RELOAD_AT??0);
const maxSeconds=Number(process.env.CK_MAX_SECONDS??1800);
assert.ok(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff,'CK_SEED must be uint32');
assert.ok(Number.isInteger(difficulty)&&difficulty>=0&&difficulty<=5,'CK_DIFFICULTY must be 0–5');
assert.ok(Number.isFinite(maxSeconds)&&maxSeconds>0&&maxSeconds<=7200,'Time limit must be 1–7200 seconds');
assert.ok(Number.isFinite(reloadAt)&&reloadAt>=0&&reloadAt<maxSeconds,'Reload time must precede the time limit');
const {source,sandbox}=headlessGame();
const context=vm.createContext(sandbox);
vm.runInContext(source,context,{timeout:15000});
sandbox.options={seed,difficulty};
vm.runInContext(`
restoreCampaignPrefs();cmp=null;seedOv=options.seed;kingdoms=2;msz=0;mt=3;mapLayout=0;
gameMode=0;startAge=0;startArmy=0;startRes=0;startVillagers=1;popLimit=200;
diff=options.difficulty;aip=0;vm=0;civ=0;aiCiv=1;start();seedOv=null;aiCiv=-1;
globalThis.snapshot=()=>({seconds:S.t,result:S.over,mode,reason:S.why||null,
 age:[...S.age],teams:[0,1].map(t=>({team:t,resources:{...S.res[t]},
 units:S.us.filter(u=>u.t===t&&u.hp>0).length,
 villagers:S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0).length,
 buildings:S.bs.filter(b=>b.t===t&&b.hp>0).length,
 queuedUnits:S.bs.filter(b=>b.t===t&&b.hp>0).reduce((n,b)=>n+(b.q?.length||0),0),
 activeResearch:S.bs.filter(b=>b.t===t&&b.hp>0&&b.rs).length,
 movingUnits:S.us.filter(u=>u.t===t&&u.hp>0&&u.p?.length).length,
 population:popOf(t),capacity:capOf(t),wave:S.ai[t].wave||0,
 townCentreHP:S.bs.filter(b=>b.t===t&&b.k==='tc'&&b.hp>0).reduce((sum,b)=>sum+b.hp,0)})),
 paths:window.CK_PATH_DIAGNOSTICS.snapshot()});
globalThis.advance=seconds=>{for(let i=0;i<Math.round(seconds*30)&&!S.over;i++)step(1/30);return snapshot()};
globalThis.checkpoint=()=>{if(!saveG())throw Error('Save failed');return localStorage.getItem(skey(slot))};
globalThis.restore=()=>loadG();
`,context);
console.log(JSON.stringify({type:'configuration',seed,difficulty,opponent:'production AI, balanced personality',player:'passive; default starting gather orders only',map:'Open Plains (mt=3), smallest size',stepSeconds:1/30,reloadAt,node:process.version}));
let state=sandbox.snapshot(),reloaded=false;
console.log(JSON.stringify({type:'start',...state}));
while(!state.result&&state.seconds<maxSeconds){
 const seconds=Math.min(60,maxSeconds-state.seconds,reloadAt&&!reloaded?Math.max(1/30,reloadAt-state.seconds):Infinity);
 state=sandbox.advance(seconds);
 for(const team of state.teams)for(const value of Object.values(team.resources))assert.ok(Number.isFinite(value)&&value>=0,'Resources remain finite and non-negative');
 if(reloadAt&&!reloaded&&state.seconds>=reloadAt-1e-6&&!state.result){
  const before=JSON.parse(sandbox.checkpoint());assert.equal(sandbox.restore(),true,'Active match loads');
  const after=JSON.parse(sandbox.checkpoint());
  // Compare persisted gameplay state, not wall-clock save timestamps or derived caches.
  for(const field of ['t','rngState','res','age','tech','bs','us','cmp','rel','wt','nodes','px','dip','civ','vm'])assert.deepEqual(after[field],before[field], 'Round-trip changed '+field);
  reloaded=true;state=sandbox.snapshot();console.log(JSON.stringify({type:'reload',seconds:state.seconds,bytes:JSON.stringify(before).length,compared:['time','RNG','resources','ages','technologies','buildings/queues','units/orders','campaign','relics','terrain','resources nodes']}));
 }
 console.log(JSON.stringify({type:'minute',...state}));
}
assert.equal(state.result,'lose','Production AI must defeat the passive kingdom within the configured time limit');
assert.equal(state.mode,'end','Natural defeat enters the results screen');
assert.equal(state.teams[0].townCentreHP,0,'Defeat follows Town Centre destruction');
assert.ok(state.teams[1].wave>0&&state.age[1]>=1,'AI develops and launches an attack');
assert.ok(!reloadAt||reloaded,'Requested checkpoint was reached');
console.log(JSON.stringify({type:'complete',seed,difficulty,reloaded,...state}));
