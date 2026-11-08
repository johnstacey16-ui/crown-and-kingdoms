import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

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
