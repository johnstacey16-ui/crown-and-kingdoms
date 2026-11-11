import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const protocol=read('js/network-sync.js'),commands=read('js/network-commands.js');
function world(civilization=41){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+protocol+'\n'+commands+'\nglobalThis.muleEval=code=>eval(code);',sandbox);
 const run=sandbox.muleEval;
 run("seedOv=191126;msz=0;kingdoms=2;startAge=3;startRes=3;startArmy=0;civ="+civilization+";start();S.civ=["+civilization+",0];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.mule=addB(0,'mule',20,20,true);globalThis.tc=addB(0,'tc',35,35,true)");
 return run;
}
test('Mountain Royals own a separate 1x1 mobile building with correct prices',()=>{
 const a=world(41),g=world(42),v=world(0);
 assert.equal(a("B.mule.s"),1);
 assert.equal(a("B.mule.hp"),300);
 assert.equal(a("B.mule.bt"),25);
 assert.equal(a("civilizationBuildingAllowed('mule',0)"),true);
 assert.equal(g("civilizationBuildingAllowed('mule',0)"),true);
 assert.equal(v("civilizationBuildingAllowed('mule',0)"),false);
 for(const run of [a,g]){
  assert.equal(run("civilizationBuildingAllowed('lumber',0)"),false);
  assert.equal(run("civilizationBuildingAllowed('mine',0)"),false);
  assert.equal(run("civilizationBuildingAllowed('mill',0)"),true);
 }
 assert.equal(a("civilizationBuildingCost('mule',0).w"),60);
 assert.equal(a("civilizationBuildingCost('mule',0).f"),15);
 assert.equal(g("civilizationBuildingCost('mule',0).w"),80);
 assert.equal(g("civilizationBuildingCost('mule',0).f"),20);
 assert.equal(a("U.cart.n"),'Trade Cart');
});
test('Mule Cart replaces wood and mining research and counts towards first Age requirements',()=>{
 const run=world(41);
 for(const key of ['axe','saw','gmine','smine'])assert.equal(run("rsOf(mule).includes('"+key+"')"),true);
 run("S.age[0]=0;S.bs=[mule]");
 assert.equal(run("ageRequirements(0).count"),1);
 run("globalThis.mill=addB(0,'mill',28,28,true)");
 assert.equal(run("ageRequirements(0).ready"),true);
});
test('Cart is a valid drop site for wood, gold, stone and hunted meat, not farms',()=>{
 const run=world(41);
 for(const k of ['w','g','s'])
  assert.equal(run("dropoffCompatible({t:0,ct:'"+k+"',sh:false},mule)"),true);
 assert.equal(run("dropoffCompatible({t:0,ct:'f',sh:false,tg:{k:'f',an:1}},mule)"),true);
 assert.equal(run("dropoffCompatible({t:0,ct:'f',sh:false,tg:{k:'f',fm:1}},mule)"),false);
 assert.equal(run("dropoffCompatible({t:1,ct:'w',sh:false},mule)"),false);
 run("mule.done=false");
 assert.equal(run("dropoffCompatible({t:0,ct:'w',sh:false},mule)"),false);
});
test('Only Armenians gain stronger researched wood and mineral collection',()=>{
 const a=world(41),g=world(42);
 for(const run of [a,g])run("S.tech[0].axe=1;S.tech[0].gmine=1;globalThis.worker={t:0,k:'vil',x:22,y:21}");
 assert.ok(a("gm(worker,{k:'w'})")>g("gm(worker,{k:'w'})"));
 assert.ok(a("gm(worker,{k:'g'})")>g("gm(worker,{k:'g'})"));
});
test('Checked movement crosses traversable tiles and moves occupancy without duplication',()=>{
 const run=world(41);
 assert.equal(run("orderMuleCart(mule,24,20)"),true);
 run("tickMuleCarts(8)");
 assert.equal(run("mule.x"),24);
 assert.equal(run("mule.y"),20);
 assert.equal(run("S.g[20*W+20]"),0);
 assert.equal(run("S.g[20*W+24]"),1);
 assert.equal(run("S.bs.filter(b=>b.k==='mule').length"),1);
 assert.equal(run("mule.netId.startsWith('b')"),true);
});
test('Blocked, off-map, unfinished, foreign and enemy move requests fail atomically',()=>{
 const run=world(41);
 run("globalThis.wall=addB(0,'house',22,20,true)");
 for(const expression of ["orderMuleCart(mule,22,20)","orderMuleCart(mule,-1,20)",
  "orderMuleCart(mule,23.4,20)","orderMuleCart(wall,24,20)"]){
  assert.equal(run(expression),false,expression);
  assert.equal(run('mule.x'),20);
 }
 run("mule.done=false");
 assert.equal(run("orderMuleCart(mule,24,20)"),false);
 run("mule.done=true;S.civ[0]=0");
 assert.equal(run("orderMuleCart(mule,24,20)"),false);
});
test('Blocked occupied next tile stops safely without skipping through a structure',()=>{
 const run=world(41);
 assert.equal(run("orderMuleCart(mule,24,20)"),true);
 run("globalThis.wall=addB(0,'house',21,20,true);tickMuleCarts(3)");
 assert.equal(run('mule.x'),20);
 assert.equal(run('S.g[20*W+20]'),1);
 assert.equal(run('S.g[20*W+21]'),1);
 assert.equal(run('mule.mulePath.length'),0);
});
test('Stop and manual commands prevent automatic wandering until resumed',()=>{
 const run=world(41);
 run("mule.muleAuto=false");
 assert.equal(run("orderMuleCart(mule,24,20)"),true);
 assert.equal(run("stopMuleCart(mule)"),true);
 run("tickMuleCarts(15)");
 assert.equal(run("mule.x"),20);
 assert.equal(run("mule.muleAuto"),false);
 assert.equal(run("resumeMuleCart(mule)"),true);
 assert.equal(run("mule.muleAuto"),true);
});
test('Automatic cart discovers a nearby uncovered resource when old source is depleted',()=>{
 const run=world(41);
 run("globalThis.node={netId:'n1',k:'w',x:27,y:20,amt:300};S.nodes.push(node);S.nd[20*W+27]=node;S.g[20*W+27]=1");
 run("tickMuleCarts(7)");
 assert.ok(run("mule.mulePath.length")>0);
 run("tickMuleCarts(9)");
 assert.ok(run("mule.x")>20);
});
test('Georgian opening grants one completed free Mule Cart, not a merchant unit',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);vm.runInContext(source+'\nglobalThis.inspect=code=>eval(code)',sandbox);
 const run=sandbox.inspect;
 run("seedOv=191126;msz=0;kingdoms=2;startAge=0;startRes=0;startArmy=0;civ=42;start()");
 assert.equal(run("S.bs.filter(b=>b.t===0&&b.k==='mule'&&b.done).length"),1);
 assert.equal(run("S.us.filter(u=>u.k==='cart').length"),0);
 assert.equal(run("S.bs.some(b=>b.k==='mule'&&S.g[b.y*W+b.x])"),true);
});
test('Authenticated command schema admits cart moves but rejects forged or hostile buildings',()=>{
 const run=world(41);
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'move',entities:[mule.netId],point:{x:24,y:20}},W)"),true);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'move',entities:[mule.netId],point:{x:24,y:20}},1,8)"),false);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'move',entities:[tc.netId],point:{x:24,y:20}},0,8)"),false);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'move',entities:[mule.netId],point:{x:24,y:20}},0,8)"),true);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'stop',entities:[mule.netId]},0,9)"),true);
 assert.equal(run("mule.muleAuto"),false);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'mule-auto',entities:[mule.netId]},0,10)"),true);
 assert.equal(run("mule.muleAuto"),true);
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'mule-auto',entities:[mule.netId],extra:1},W)"),false);
});
test('Host and Xbox building menus expose cart moves, research and faction locks',()=>{
 const run=world(41);
 assert.equal(run("CK_GAME_COMMANDS.buildOptions(S,0).flat().find(o=>o.value==='mule').locked"),'');
 assert.equal(run("CK_GAME_COMMANDS.buildOptions(S,1).flat().find(o=>o.value==='mule').locked.length>0"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,mule).some(o=>o.type==='move')"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,mule).some(o=>o.type==='mule-auto')"),true);
 run("S.sel=[mule];openMenu()");
 assert.equal(run("menu.items.some(o=>o.l==='Move Mule Cart')"),true);
});
test('Saved cart paths reject nonadjacent teleports, NaN timers and invalid coordinates',()=>{
 const valid=vm.runInNewContext(read('js/save.js')+'\nvalidSavedMuleCart',{});
 assert.equal(valid({k:'mule',s:1,x:20,y:20,mulePath:[[21,20],[22,20]],muleAuto:true,muleProgress:.6},96),true);
 for(const fields of [
  {mulePath:[[25,20]]},{mulePath:[[21.5,20]]},{mulePath:[[21,20],[21,20]]},
  {muleAuto:'yes'},{muleProgress:Infinity},{muleCheck:-2},{x:20.5}
 ])assert.equal(valid({k:'mule',s:1,x:20,y:20,...fields},96),false,JSON.stringify(fields));
});
test('Current-version save and load preserve a moving cart with stable ID and occupancy',()=>{
 const run=world(41);
 assert.equal(run("orderMuleCart(mule,24,20)"),true);
 run("tickMuleCarts(1.6)");
 const before=run("mule.netId");
 assert.equal(run("saveG(false,'mule-cart-check')"),true);
 assert.equal(run("loadG(false,'mule-cart-check')"),true);
 assert.equal(run("S.bs.filter(b=>b.k==='mule').length"),1);
 assert.equal(run("S.bs.find(b=>b.k==='mule').netId"),before);
 assert.ok(run("Array.isArray(S.bs.find(b=>b.k==='mule').mulePath)"));
 assert.equal(run("S.g[S.bs.find(b=>b.k==='mule').y*W+S.bs.find(b=>b.k==='mule').x]"),1);
});
