import assert from 'node:assert/strict';

export async function checkCampaignNavies(browser,origin,output){
 const page=await browser.newPage({viewport:{width:960,height:850}});
 try{
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>typeof startScenario==='function'&&ASSET.n===57&&PAINT.terrain);
  const result=await page.evaluate(()=>{
   startScenario(12);fog();mode='pause';
   const ships=S.us.filter(u=>u.k==='gal'&&u.hp>0),player=ships.find(u=>u.t===0);
   const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,regions=campaignWaterRegions();
   const proof={player:ships.filter(u=>u.t===0).length,enemy:ships.filter(u=>u.t===1).length,
    componentTiles:regions.sizes[regions.largest],
    allMain:ships.every(u=>regions.labels[(u.y|0)*W+(u.x|0)]===regions.largest),
    allReachable:ships.every(u=>!!path(player,gp(u.x,u.y,.1))),
    enemyDock:S.bs.some(b=>b.t===1&&b.k==='dock'&&campaignDockAccess(b.x,b.y,b.s,regions,4)&&!!spawnPos(b))};
   ctr(player.x,player.y);draw(0);
   return {...proof,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
  });
  assert.equal(result.player,2);assert.equal(result.enemy,3);assert.ok(result.componentTiles>1000);
  assert.equal(result.allMain,true);assert.equal(result.allReachable,true);assert.equal(result.enemyDock,true);
  assert.equal(result.before,result.after,'connectivity inspection and presentation do not mutate simulation');
  await page.locator('#c').screenshot({path:output+'/golden-coast-connected-navy.png'});
  const tidewatch=await page.evaluate(()=>{
   startScenario(14);fog();mode='pause';
   const home=tcOf(0);ctr(home.x+home.s/2,home.y+home.s/2);
   const counts=team=>Object.fromEntries(['knight','xbow','spear','ram','bomb'].map(k=>
    [k,S.us.filter(u=>u.t===team&&u.k===k&&u.hp>0).length]));
   const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
   draw(0);
   return {player:counts(0),enemy:counts(1),before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
  });
  assert.deepEqual(tidewatch.player,{knight:5,xbow:10,spear:6,ram:2,bomb:0});
  assert.deepEqual(tidewatch.enemy,{knight:6,xbow:8,spear:0,ram:0,bomb:2});
  assert.equal(tidewatch.before,tidewatch.after,'rendering expanded armies preserves simulation state');
  await page.locator('#c').screenshot({path:output+'/tidewatch-complete-starting-armies.png'});
  return {...result,tidewatch};
 }finally{await page.close()}
}
