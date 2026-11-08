import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {spawnSync} from 'node:child_process';

function tidewatch(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+"\nstartScenario(14);globalThis.tidewatchRun=code=>eval(code);",sandbox,{timeout:15000});
 return code=>sandbox.tidewatchRun(code);
}
test('Tidewatch opens with a real navigable harbour and opposing naval units',()=>{
 const c=tidewatch();
 assert.equal(c("S.bs.filter(b=>b.t===1&&b.k==='dock'&&b.hp>0&&b.done).length"),1,'enemy harbour must exist as a real completed Dock');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='fire'&&u.hp>0).length"),2,'player receives the briefed two Fire Ships');
 assert.equal(c("S.us.filter(u=>u.t===1&&u.k==='gal'&&u.hp>0).length"),2,'enemy has physical War Galleys');
 assert.equal(c("S.us.filter(u=>['fire','gal'].includes(u.k)&&u.hp>0).every(u=>S.wt[(u.y|0)*W+(u.x|0)]===1)"),true,'ships must start on navigable water');
 const g=JSON.parse(c("JSON.stringify(CAMP[14].goals.map(g=>({id:g.id,optional:!!g.optional})))"));
 assert.deepEqual(g.map(x=>x.id),['workshop','bombards','harbour','castle','tc']);
 assert.equal(g.filter(x=>x.optional).length,1,'only the harbour is optional');
 assert.equal(g.find(x=>x.id==='harbour').optional,true);
 assert.equal(c('S.over'),null);
 const camp=JSON.parse(c("JSON.stringify({houses:S.bs.filter(b=>b.t===0&&b.k==='house'&&b.done&&b.hp>0).length,capacity:capOf(0),population:popOf(0),resources:S.res[0]})"));
 assert.equal(camp.houses,5,'an Imperial garrison needs a real housing encampment');
 assert.equal(c("S.bs.filter(b=>b.t===0&&b.k==='tower'&&b.hp>0&&b.done).length"),2,'two actual watchtowers defend the supplied garrison');
 assert.equal(camp.capacity,35);
 assert.ok(camp.population<=camp.capacity,'the starting force fits without rebuilding Houses');
 const barracksCost=c('B.siege.cost.w');
 assert.ok(camp.resources.w>=barracksCost,'starting resources still cover paid Siege Workshop construction');
});
test('Destroying Tidewatch Dock grants one supply reward without cheats or repeated payouts',()=>{
 const c=tidewatch();
 const w=c('S.res[0].w'),g=c('S.res[0].g');
 c("globalThis.harbour=S.bs.find(b=>b.t===1&&b.k==='dock');harbour.hp=0;cmp.k=14;cmpTick(5)");
 assert.equal(c('cmp.d.harbour'),1);
 assert.equal(c('S.res[0].w'),w,'optional completion alone does not immediately change resources');
 assert.equal(c('S.res[0].g'),g);
 c('cmpTick(1)');
 assert.equal(c('S.res[0].w'),w+180);
 assert.equal(c('S.res[0].g'),g+100);
 assert.equal(c('S.over'),null,'optional objective cannot bypass required siege');
 c('cmpTick(5)');
 assert.equal(c('S.res[0].w'),w+180,'event fires once');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(5)');
 assert.equal(c('S.res[0].w'),w+180,'save/load cannot duplicate optional rewards');
 assert.equal(c('S.res[0].g'),g+100);
});
test('Tidewatch cannon muster remains complete after casualties but requires two real fielded units',()=>{
 const c=tidewatch();
 c("put(0,'siege',tcOf(0).x+8,tcOf(0).y+8);globalThis.a=addU(0,'bomb',20.5,20.5);globalThis.b=addU(0,'bomb',21.5,20.5);cmp.k=14;cmpTick(5)");
 assert.equal(c('cmp.d.bombards'),1,'two living bombards complete the preparation stage');
 c('a.hp=0;b.hp=0;cmp.k=14;cmpTick(1)');
 assert.equal(c('cmp.d.bombards'),1,'fielded and later lost artillery still count for the completed muster');
 assert.equal(c('S.over'),null,'muster alone cannot win without destroying the fortress');
 const s=c('saveG()');assert.equal(s,true);assert.equal(c('loadG()'),true);
 assert.equal(c('cmp.d.bombards'),1,'a completed stage remains complete through save/load');
});
test('Destroying Tidewatch Castle calls a real one-time royal reserve to guard home',()=>{
 const c=tidewatch();
 const reserveIndex=c("CAMP[14].ev.findIndex(e=>typeof e.when==='function'&&e.when.toString().includes('cmp.d.castle'))");
 assert.ok(reserveIndex>=0,'a separate story event follows the Castle milestone');
 const initial=c("S.us.filter(u=>u.t===0&&['spear','xbow'].includes(u.k)).length");
 const resources=c('JSON.stringify(S.res[0])');
 c("cmp.k=14;cmpTick(8)");
 assert.equal(c('!!cmp.e['+reserveIndex+']'),false,'royal reserve cannot arrive while the enemy Castle stands');
 c("S.bs.find(b=>b.t===1&&b.k==='castle').hp=0;cmp.k=14;cmpTick(2)");
 assert.equal(c('cmp.d.castle'),1);
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e['+reserveIndex+']'),true,'Castle destruction triggers a new visible stage');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','xbow'].includes(u.k)).length"),initial+6);
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','xbow'].includes(u.k)&&u.o==='G'&&u.tg===tcOf(0)).length"),6,'the reserve guards the real home Town Centre');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'story reinforcements do not fabricate resources');
 assert.equal(c('S.over'),null,'royal reserves must not grant victory directly');
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','xbow'].includes(u.k)).length"),initial+6,'no repeated reinforcements in a live mission');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','xbow'].includes(u.k)).length"),initial+6,'the reserve event persists across saves');
});
test('Optional harbour does not block a legitimate siege victory',()=>{
 const c=tidewatch();
 c("S.bs.push({t:0,k:'siege',done:true,hp:500,s:3,x:19,y:18});addU(0,'bomb',20.5,20.5);addU(0,'bomb',21.5,20.5)");
 c("S.bs.find(b=>b.t===1&&b.k==='castle').hp=0;tcOf(1).hp=0;cmp.k=14;cmpTick(5)");
 assert.equal(c('cmp.d.harbour'),undefined,'optional Dock must remain standing');
 assert.equal(c('cmp.d.workshop'),1);
 assert.equal(c('cmp.d.bombards'),1);
 assert.equal(c('cmp.d.castle'),1);
 assert.equal(c('cmp.d.tc'),1);
 assert.equal(c('S.over'),'win','all required siege conditions still win without the optional objective');
});
test('Tidewatch naval reinforcements depend on the actual enemy Dock at the trigger time',()=>{
 const intact=tidewatch();
 const index=intact("CAMP[14].ev.findIndex(e=>e.at===345)");
 assert.ok(index>=0);
 const n=intact("S.us.filter(u=>u.t===1&&u.k==='gal'&&u.hp>0).length");
 intact('cmpTick(345)');
 assert.equal(intact('!!cmp.e['+index+']'),true,'intact harbour sends its scheduled sortie');
 assert.ok(intact("S.us.filter(u=>u.t===1&&u.k==='gal'&&u.hp>0).length")>n,'additional Galleys physically spawn');
 const ruined=tidewatch();
 ruined("S.bs.find(b=>b.t===1&&b.k==='dock').hp=0");
 ruined('cmpTick(345)');
 assert.equal(ruined('!!cmp.e['+index+']'),false,'destroying harbour cancels its sortie');
 assert.equal(ruined("S.us.filter(u=>u.t===1&&u.k==='gal'&&u.hp>0).length"),n,'no phantom ships after destruction');
 assert.equal(ruined('S.over'),null);
});

test('one-off Tidewatch full simulation with viable starting housing',()=>{
 const result=spawnSync(process.execPath,['tests/simulation-smoke.test.mjs'],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,CK_MISSION:'14',CK_SKIP_CAMPAIGN:'0'},timeout:200000,maxBuffer:8*1024*1024});
 assert.equal(result.status,0,'campaign runner crashed: '+(result.stderr||'').slice(-1800)+' '+(result.stdout||'').slice(-1600));
 const line=(result.stdout||'').split('\n').find(x=>x.includes('campaign-isolation-result: '));
 assert.ok(line,'campaign runner should return structured evidence');
 const value=JSON.parse(line.split('campaign-isolation-result: ')[1]);
 console.log('Tidewatch housing playthrough result '+JSON.stringify(value));
 assert.equal(value.mission,14);
 assert.ok(['win','lose','timeout'].includes(value.outcome));
});
