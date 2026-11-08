import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {campaignScouting} from './helpers/campaign-scouting.mjs';
import {campaignConstruction} from './helpers/campaign-construction.mjs';

test('Causeway shoreline reconnaissance distinguishes real buildable sites from unexplored terrain',()=>{
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
 startScenario(16);
 globalThis.causewayInspect=expr=>eval(expr);
 `,sandbox,{timeout:15000});
 const run=sandbox.causewayInspect;
 const metrics=JSON.parse(run(`(()=>{
  const regions=campaignWaterRegions(),workers=S.us.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld),result={mission:cmp.i,workers:workers.length,explored:S.ex.filter(Boolean).length,mainSea:regions.sizes[regions.largest],sites:0,wide:0,reachable:0,visible:0,routeDistance:null,scoutRoutes:0};
  for(let y=1;y<H-B.dock.s;y++)for(let x=1;x<W-B.dock.s;x++){
   const narrow=campaignDockAccess(x,y,B.dock.s,regions,1),wide=campaignDockAccess(x,y,B.dock.s,regions,4);
   if(!narrow)continue;
   if(wide)result.wide++;
   // Distinguish map geometry from whether player has explored the terrain.
   const cells=[];for(let j=0;j<B.dock.s;j++)for(let i=0;i<B.dock.s;i++)cells.push((y+j)*W+x+i);
   const explored=cells.every(i=>S.ex[i]);
   if(explored)result.visible++;
   const seen=cells.map(i=>S.ex[i]);cells.forEach(i=>S.ex[i]=1);
   const ok=okPlace(0,'dock',x,y);
   cells.forEach((i,j)=>S.ex[i]=seen[j]);
   if(!ok)continue;
   result.sites++;
   for(const worker of workers){
    const route=path(worker,goalNear({x,y,s:B.dock.s},1));
    if(route){result.reachable++;if(result.routeDistance===null)result.routeDistance=route.length;break}
   }
  }
  for(const worker of workers){
   for(let offset=-10;offset<=10;offset+=5){
    const x=Math.floor(worker.x+offset+12),y=Math.floor(worker.y+6);
    if(x>=1&&x<W-1&&y>=1&&y<H-1&&path(worker,gp(x+.5,y+.5,.6)))result.scoutRoutes++;
   }
  }
  return JSON.stringify(result);
 })()`));
 console.log('Causeway dock reconnaissance',JSON.stringify(metrics));
 assert.ok(metrics.mainSea>0,'Causeway must contain one navigable sea');
 assert.ok(metrics.sites>0,'A fully explored Causeway must contain a legally buildable Dock site');
 assert.ok(metrics.reachable>0,'At least one real villager must be able to reach a legally buildable Dock site');
});

test('Causeway reconnaissance moves a real Knight and discovers legal Dock sites through normal vision',()=>{
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+campaignScouting+`
  startScenario(16);
  globalThis.recon={waypoint:0,orders:0};
  globalThis.causewayRun=code=>eval(code);
 `,sandbox,{timeout:15000});
 const run=sandbox.causewayRun,initial=run('S.ex.filter(Boolean).length');
 const before=run('JSON.stringify(S.res[0])');
 assert.equal(run('campaignScoutCauseway(recon)'),true,'initial order must find a legal path toward the player bank');
 assert.equal(run('S.ex.filter(Boolean).length'),initial,'issuing a move must not reveal fog');
 assert.equal(run('JSON.stringify(S.res[0])'),before,'scouting does not grant any resources');
 const outcome=JSON.parse(run(`(()=>{
  for(let i=0;i<120*30&&!S.over;i++){if(i%30===0)campaignScoutCauseway(recon);step(1/30)}
  const regions=campaignWaterRegions();
  let visible=0,reachable=0;
  for(let y=1;y<H-B.dock.s;y++)for(let x=1;x<W-B.dock.s;x++){
   if(!campaignDockAccess(x,y,B.dock.s,regions,4)||!okPlace(0,'dock',x,y))continue;
   visible++;
   if(!reachable&&S.us.some(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld&&!!path(u,goalNear({x,y,s:B.dock.s},1))))reachable=1;
  }
  return JSON.stringify({orders:recon.orders,explored:S.ex.filter(Boolean).length,visible,reachable,time:S.t,over:S.over});
 })()`));
 console.log('Causeway legal reconnaissance result',JSON.stringify(outcome));
 assert.ok(outcome.orders>=1,'Knight receives normal movement orders');
 assert.ok(outcome.explored>initial+50,'visible terrain must expand from actual unit travel');
 assert.ok(outcome.visible>0,'at least one legal Dock site should become explored');
 assert.equal(outcome.reachable,1,'a living villager can reach the discovered Dock footprint');
});

test('discovered Causeway shoreline allows a paid Dock foundation and finished ship training site',()=>{
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\n'+campaignConstruction+'\n'+campaignScouting+`
  startScenario(16);
  globalThis.recon={waypoint:0,orders:0};
  globalThis.builder=createCampaignBuilder(tcOf(0));
  globalThis.causewayRun=code=>eval(code);
 `,sandbox,{timeout:15000});
 const c=sandbox.causewayRun;
 const initialWood=c('S.res[0].w'),initialTech=c('JSON.stringify(S.tech[0])');
 const outcome=JSON.parse(c(`(()=>{
  let founded=null,completed=null,paid=null;
  for(let i=0;i<270*30&&!S.over;i++){
   if(i%30===0){
    campaignScoutCauseway(recon);
    builder.place('dock',1);
    const dock=S.bs.find(b=>b.t===0&&b.k==='dock'&&b.hp>0);
    if(dock&&!founded){founded=S.t;paid=S.res[0].w}
    if(dock?.done){completed=S.t;break}
   }
   step(1/30);
  }
  const dock=S.bs.find(b=>b.t===0&&b.k==='dock'&&b.hp>0);
  const water=campaignWaterRegions();
  return JSON.stringify({founded,completed,paid,orders:builder.orders,scoutOrders:recon.orders,wood:S.res[0].w,over:S.over,activeDock:!!dock?.done,
   waterAccess:!!dock&&campaignDockAccess(dock.x,dock.y,dock.s,water,1),shipSpawn:!!dock?.done&&!!spawnPos(dock),galleys:!!dock?.done&&trOf(dock).includes('gal')});
 })()`));
 console.log('Causeway paid Dock construction result',JSON.stringify(outcome));
 assert.ok(outcome.scoutOrders>0,'the scouting mission uses a live Knight');
 assert.ok(outcome.founded!==null,'normal player-side construction starts a Dock foundation');
 assert.equal(outcome.orders.filter(x=>x.kind==='dock').length,1,'Dock must be ordered and paid only once');
 assert.equal(outcome.paid,initialWood-B.dock.cost.w,'no free foundation may be granted');
 assert.equal(outcome.activeDock,true,'a real Villager must finish the Dock');
 assert.equal(outcome.waterAccess,true,'completed Dock borders the main navigable sea');
 assert.equal(outcome.shipSpawn,true,'ship production must have an unobstructed water exit');
 assert.equal(outcome.galleys,true,'completed Dock exposes War Galley production');
 assert.equal(c('JSON.stringify(S.tech[0])'),initialTech,'construction/scouting must not grant research');
});
