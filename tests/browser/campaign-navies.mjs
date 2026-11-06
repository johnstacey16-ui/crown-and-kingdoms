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
  const dockGuard=await page.evaluate(()=>{
   startScenario(16);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.wt.fill(0);S.g.fill(0);S.gt.fill(0);S.ex.fill(1);S.vs.fill(1);
   for(let y=38;y<44;y++)for(let x=1;x<W-1;x++)S.wt[y*W+x]=1;
   let dock=addB(0,'dock',40,36,true),ship=addU(0,'gal',50.5,40.5);S.sel=[ship];foeGridDirty=true;
   ctr(41,37);cur={x:CW/2,y:CH/2};openMenu();
   const item=menu.items.find(o=>o.l==='Guard friendly target');if(!item)throw Error('No Guard command for ships');item.fn();
   E=[];P=[];E[0]=true;playCtl(1/30);E=[];
   const applied=ship.o==='G'&&ship.tg===dock&&pat===0;
   for(let i=0;i<900;i++)upU(ship,1/30);
   const arrived=ship.o==='G'&&ship.tg===dock&&d2(ship.x,ship.y,dock)<=2;
   let enemy=addU(1,'gal',ship.x+1,ship.y);foeGridDirty=true;upU(ship,1/30);
   const intercepted=ship.o==='a'&&ship.tg===enemy&&ship.guardTarget===dock;
   const shipId=ship.netId,enemyId=enemy.netId;
   const saved=saveG(),loaded=saved&&loadG();mode='pause';
   ship=S.us.find(u=>u.netId===shipId);enemy=S.us.find(u=>u.netId===enemyId);dock=S.bs.find(b=>b.t===0&&b.k==='dock');
   const restored=loaded&&ship.guardTarget===dock&&ship.tg===enemy;
   enemy.x+=20;upU(ship,1/30);
   const escaped=enemy.hp>0&&ship.o==='G'&&ship.tg===dock&&ship.guardTarget===null;
   foeGridDirty=true;for(let i=0;i<600;i++)upU(ship,1/30);
   const resumed=d2(ship.x,ship.y,dock)<=2;
   enemy.x=ship.x+1;foeGridDirty=true;upU(ship,1/30);
   const reintercepted=ship.o==='a'&&ship.guardTarget===dock;
   enemy.hp=0;upU(ship,1/30);
   const returned=ship.o==='G'&&ship.tg===dock;
   return {applied,arrived,intercepted,restored,escaped,resumed,reintercepted,returned,distance:d2(ship.x,ship.y,dock)};
  });
  for(const key of ['applied','arrived','intercepted','restored','escaped','resumed','reintercepted','returned'])assert.equal(dockGuard[key],true,'native Dock Guard '+key);
  const productionWait=await page.evaluate(()=>{
   // Controlled exit obstruction, not a campaign victory/construction fixture.
   S.us=[];const dock=S.bs.find(b=>b.k==='dock'&&b.t===0);for(let i=0;i<6;i++)addB(0,'house',10+i*3,10,true);
   if(!train(dock,'gal'))throw Error('Could not pay for the queued Galley');
   const paid=JSON.stringify(S.res[0]),blocked=[];const cells=new Set();
   for(let i=-1;i<=dock.s;i++)for(const [x,y]of [[dock.x+i,dock.y-1],[dock.x+i,dock.y+dock.s],[dock.x-1,dock.y+i],[dock.x+dock.s,dock.y+i]]){
    const key=y*W+x;if(!cells.has(key)&&S.wt[key]){cells.add(key);blocked.push(addU(0,'gal',x+.5,y+.5))}
   }
   upB(dock,U.gal.t+1);S.sel=[dock];
   const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,old=productionQueueWait;
   const capture=()=>{const original=tx,text=[];tx=(s,...args)=>{text.push(String(s));return original(s,...args)};try{hud()}finally{tx=original}return text};
   let previous;
   try{productionQueueWait=()=>null;previous=capture()}finally{productionQueueWait=old}
   const current=capture(),unchanged=before===CK_SIM_SYNC.worldCheckpoint(S,1).hash;
   const waiting=dock.q.length===1&&dock.q[0].t===0;
   blocked[0].y+=3;upB(dock,1/30);
   return {waiting,previousCaption:previous.find(t=>t.includes('Training ')),caption:current.find(t=>t.includes('Training ')),hint:current.find(t=>t.includes('Clear space')),unchanged,released:dock.q.length===0,paidOnce:paid===JSON.stringify(S.res[0])};
  });
  assert.equal(productionWait.waiting,true);assert.match(productionWait.previousCaption,/0s/);
  assert.match(productionWait.caption,/Exit blocked/);assert.ok(productionWait.hint);
  for(const key of ['unchanged','released','paidOnce'])assert.equal(productionWait[key],true,key);
  return {...result,tidewatch,relicReturn,dockGuard,productionWait};
 }finally{await page.close()}
}
