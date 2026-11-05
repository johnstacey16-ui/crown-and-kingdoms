import assert from 'node:assert/strict';
import {campaignConstruction} from '../helpers/campaign-construction.mjs';

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
   const trainingRejected=!train(home,'vil'),trainingHint=notes.at(-1).s;
   draw(0);
   return {player:counts(0),enemy:counts(1),trainingRejected,trainingHint,
    before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
  });
  assert.deepEqual(tidewatch.player,{knight:5,xbow:10,spear:6,ram:2,bomb:0});
  assert.deepEqual(tidewatch.enemy,{knight:6,xbow:8,spear:0,ram:0,bomb:2});
  assert.equal(tidewatch.trainingRejected,true);
  assert.equal(tidewatch.trainingHint,'Population full (28/10): build 4 Houses');
  assert.equal(tidewatch.before,tidewatch.after,'rendering expanded armies preserves simulation state');
  await page.locator('#c').screenshot({path:output+'/tidewatch-complete-starting-armies.png'});
  await page.evaluate('(() => {\n'+campaignConstruction+'\nwindow.createCampaignBuilder=createCampaignBuilder;})()');
  const relicReturn=await page.evaluate(()=>{
   startScenario(3);mode='pause';
   const monk=S.us.find(u=>u.t===0&&u.k==='mon'),relic=S.rel
    .filter(r=>!r.c&&!r.m&&path(monk,goalNear(r,.8)))
    .sort((a,b)=>Math.hypot(a.x-monk.x,a.y-monk.y)-Math.hypot(b.x-monk.x,b.y-monk.y))[0];
   if(!relic)throw Error('No reachable relic in the seeded mission');
   S.sel=[monk];orderSel(relic,relic.x,relic.y);
   for(let i=0;i<6000&&!monk.rel;i++)step(1/30);
   step(1/30);
   const waiting=monk.rel===relic&&monk.o==='i';
   const builder=createCampaignBuilder(tcOf(0));
   let home=null;
   for(let i=0;i<5400&&!home;i++){
    if(i%30===0)builder.place('monastery');
    step(1/30);
    home=S.bs.find(b=>b.t===0&&b.k==='monastery'&&b.done&&b.hp>0);
   }
   if(!home)throw Error('Paid prerequisite construction did not finish');
   S.sel=[monk];orderSel(home,home.x+home.s/2,home.y+home.s/2);
   const resumed=monk.o==='r'&&monk.tg===home;
   for(let i=0;i<6000&&!relic.m;i++)step(1/30);
   return {waiting,resumed,delivered:relic.m===home&&relic.c===null&&monk.rel===null,
    orders:builder.orders.map(o=>o.kind)};
  });
  assert.equal(relicReturn.waiting,true,'real pickup waits when no completed home exists');
  assert.equal(relicReturn.resumed,true,'contextual Monastery order resumes delivery in Chromium');
  assert.equal(relicReturn.delivered,true,'the same relic reaches the paid completed home');
  assert.deepEqual(relicReturn.orders,['bar','monastery']);
  return {...result,tidewatch,relicReturn};
 }finally{await page.close()}
}
