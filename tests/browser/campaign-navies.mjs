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
  const objectivePolicy=await page.evaluate(()=>{
   // Controlled objective lifecycle, not a paid campaign victory fixture.
   startScenario(0);mode='pause';const goal=CAMP[0].goals.find(g=>g.id==='v'),title=goal.t;
   try{
    while(cu('vil')<10)addU(0,'vil',tcOf(0).x+5,tcOf(0).y+5);
    for(let i=0;i<15;i++)cmpTick(1/30);const completed=cmp.d.v===1;
    goal.t='Maintain the village population';S.us.find(u=>u.t===0&&u.k==='vil').hp=0;
    const saved=saveG(),loaded=saved&&loadG();mode='pause';
    for(let i=0;i<15;i++)cmpTick(1/30);
    const text=[],original=tx;tx=(s,...args)=>{text.push(String(s));return original(s,...args)};
    try{cmpHud()}finally{tx=original}
    const restored=cmp.d.v===0,visible=text.some(t=>t.includes(goal.t));
    addU(0,'vil',tcOf(0).x+5,tcOf(0).y+5);for(let i=0;i<15;i++)cmpTick(1/30);
    return {completed,loaded,restored,visible,recompleted:cmp.d.v===1};
   }finally{goal.t=title}
  });
  for(const key of ['completed','loaded','restored','visible','recompleted'])assert.equal(objectivePolicy[key],true,'maintained objective '+key);
  const minimumRange=await page.evaluate(()=>{
   const results=[];
   for(const [kind,gap]of [['treb',1],['skirm',.5]]){
    // Controlled combat fixture: command and simulation, not campaign victory.
    startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
    const actor=addU(0,kind,20.5,20.5),target=addU(1,'mil',20.5+gap,20.5);S.sel=[actor];
    const applied=orderSel(target,target.x,target.y),before=d2(actor.x,actor.y,target);
    for(let i=0;i<300;i++)upU(actor,1/30);
    results.push({kind,applied,before,distance:d2(actor.x,actor.y,target),minimum:U[kind].minR,projectiles:S.pj.length,retained:actor.o==='a'&&actor.tg===target});
   }
   return results;
  });
  for(const r of minimumRange){assert.equal(r.applied,true);assert.equal(r.retained,true);assert.ok(r.distance>r.before+.3);assert.ok(r.distance>=r.minimum);assert.ok(r.projectiles>0)}
  const constructionRecovery=await page.evaluate(()=>{
   startScenario(0);mode='pause';const tc=tcOf(0),builder=createCampaignBuilder(tc);
   if(!builder.place('house'))throw Error('House placement failed');
   const foundation=S.bs.find(b=>b.t===0&&b.k==='house'&&!b.done),incumbent=S.us.find(u=>u.o==='b'&&u.tg===foundation),id=foundation.netId;
   incumbent.hp=0;const paid=JSON.stringify(S.res[0]),count=S.bs.length;
   builder.place('house');const reassigned=S.us.some(u=>u.hp>0&&u.o==='b'&&u.tg===foundation);
   const work=()=>{for(const u of S.us)if(u.hp>0&&u.k==='vil')upU(u,1/30)};
   for(let i=0;i<2400&&!foundation.done;i++)work();
   const completed=foundation.done&&foundation.netId===id,paidOnce=paid===JSON.stringify(S.res[0])&&count===S.bs.length;
   builder.place('house',2);const next=S.bs.find(b=>b.t===0&&b.k==='house'&&!b.done);townBell(0);builder.place('house',2);
   const reserved=!S.us.some(u=>u.hp>0&&u.o==='b'&&u.tg===next);
   for(let i=0;i<1200;i++)work();unload(tc);builder.place('house',2);
   for(let i=0;i<2400&&!next.done;i++)work();
   return {reassigned,completed,paidOnce,reserved,resumedAfterUnload:next.done,orders:builder.orders.map(o=>o.kind)};
  });
  for(const key of ['reassigned','completed','paidOnce','reserved','resumedAfterUnload'])assert.equal(constructionRecovery[key],true,'construction recovery '+key);
  assert.deepEqual(constructionRecovery.orders,['house','house']);
  return {...result,tidewatch,relicReturn,dockGuard,productionWait,objectivePolicy,minimumRange,constructionRecovery};
 }finally{await page.close()}
}
