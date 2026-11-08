import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {campaignScouting} from './helpers/campaign-scouting.mjs';

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
