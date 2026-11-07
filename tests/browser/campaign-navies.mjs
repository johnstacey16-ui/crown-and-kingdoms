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
  const groupRally=await page.evaluate(()=>{
   // Controlled cleared terrain; real A press/release and production movement.
   startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
   const a=addB(0,'tc',20,20,true),b=addB(0,'tc',35,20,true);S.sel=[a,b];S.res[0].f=1000;
   cancelGameplayGestures();ctr(40,40);cur={x:CW/2,y:CH/2};const xy=s2w(cur.x,cur.y),point={x:xy[0],y:xy[1]};
   E=[];RE=[];P=[];E[0]=P[0]=true;playCtl(1/30);
   E=[];P=[];RE[0]=true;playCtl(1/30);RE=[];
   const applied=[a,b].every(t=>t.rally?.x===point.x&&t.rally.y===point.y);
   train(a,'vil');train(b,'vil');upB(a,U.vil.t+1);upB(b,U.vil.t+1);
   for(let i=0;i<1800;i++)for(const u of S.us)upU(u,1/30);
   const arrived=S.us.length===2&&S.us.every(u=>u.o==='i'&&!u.autoWorker&&Math.hypot(u.x-point.x,u.y-point.y)<2.2);
   const canvas=document.createElement('canvas');canvas.id='group-rally-map';canvas.width=680;canvas.height=500;document.body.append(canvas);
   const description=document.createElement('p');document.body.append(description);const orders=[];
   const map=CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return {ok:true}}});
   map.refresh(S,0,W,H,true);map.choose({x:a.x+1,y:a.y+1});
   const tap=()=>{map.control({0:true},{0:true});map.control({},{});};tap();tap();
   const selection=map.selection(),before=JSON.stringify(S.bs.map(t=>t.rally));map.choose({x:50,y:42});
   const deferred=before===JSON.stringify(S.bs.map(t=>t.rally));mode='play';
   const executed=orders.length===1&&CK_GAME_COMMANDS.execute(orders[0],0,1);mode='pause';map.refresh(S,0,W,H,true);
   return {applied,arrived,selection,order:orders[0],deferred,executed,updated:S.bs.every(t=>t.rally?.x===50&&t.rally.y===42&&t.rally.t===null)};
  });
  for(const key of ['applied','arrived','deferred','executed','updated'])assert.equal(groupRally[key],true,'group rally '+key);
  assert.equal(groupRally.selection.length,2);assert.deepEqual(groupRally.order.entities,groupRally.selection);assert.equal(groupRally.order.type,'rally');
  await page.locator('#group-rally-map').screenshot({path:output+'/group-rally.png'});
  const fishingRally=await page.evaluate(()=>{
   // Cleared water fixture; actual A release, paid Dock queues and delivery.
   startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(1);S.ex.fill(1);S.vs.fill(1);
   const docks=[addB(0,'dock',20,20,true),addB(0,'dock',36,20,true)];S.res[0].w=1000;S.res[0].f=1000;
   const fish={netId:nextNetworkEntityId('n'),k:'f',x:30,y:30,s:1,amt:200,fi:1};S.nodes.push(fish);S.nd[fish.y*W+fish.x]=fish;
   S.sel=docks;cancelGameplayGestures();ctr(30.5,30.5);cur={x:CW/2,y:CH/2};
   E=[];RE=[];P=[];E[0]=P[0]=true;playCtl(1/30);E=[];P=[];RE[0]=true;playCtl(1/30);RE=[];
   const sharedResource=docks.every(b=>b.rally?.t===fish);
   for(const b of docks){if(!train(b,'fish'))throw Error('Fishing ship training failed');upB(b,U.fish.t+1)}
   const dispatched=S.us.length===2&&S.us.every(u=>u.o==='g'&&u.tg===fish),paid=1000-S.res[0].w;
   for(let i=0;i<2400;i++)for(const u of S.us)upU(u,1/30);
   const harvested=200-fish.amt,delivered=S.res[0].f-1000,saved=saveG(),loaded=saved&&loadG();mode='pause';
   const restored=S.bs.every(b=>b.rally.t===S.nodes[0])&&S.us.every(u=>u.tg===S.nodes[0]);
   S.sel=S.bs.slice();cmp=null;notes.length=0;ctr(30,26);mode='play';draw(0);
   const proof=document.createElement('canvas');proof.id='fishing-rally-proof';proof.width=CW;proof.height=CH;proof.getContext('2d').drawImage(document.getElementById('c'),0,0);document.body.append(proof);mode='pause';
   return {sharedResource,dispatched,paid,expectedCost:2*U.fish.cost.w,harvested,delivered,saved,loaded,restored};
  });
  for(const key of ['sharedResource','dispatched','saved','loaded','restored'])assert.equal(fishingRally[key],true,'fishing rally '+key);
  assert.equal(fishingRally.paid,fishingRally.expectedCost);assert.ok(fishingRally.harvested>0);assert.ok(fishingRally.delivered>0);
  await page.locator('#fishing-rally-proof').screenshot({path:output+'/fishing-resource-rally.png'});
  const merchantRally=await page.evaluate(()=>{
   const rows=[];
   for(const kind of ['cart','cog']){
    // Controlled two-depot economy, using real A release, queues and trade ticks.
    startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(kind==='cog'?1:0);S.ex.fill(1);S.vs.fill(1);S.age.fill(3);setDiplomacy(0,1,'neutral');
    const k=kind==='cart'?'market':'dock',homes=[addB(0,k,20,20,true),addB(0,k,20,34,true)],partner=addB(1,k,44,26,true);
    if(kind==='cog')for(const b of S.bs)for(let y=b.y;y<b.y+b.s;y++)for(let x=b.x;x<b.x+b.s;x++)S.wt[y*W+x]=0;
    S.res[0]={f:1000,w:1000,g:1000,s:1000};S.sel=homes;cancelGameplayGestures();ctr(45.5,27.5);cur={x:CW/2,y:CH/2};
    E=[];RE=[];P=[];E[0]=P[0]=true;playCtl(1/30);E=[];P=[];RE[0]=true;playCtl(1/30);RE=[];
    const assigned=homes.every(b=>b.rally?.t===partner);
    for(const b of homes){if(!train(b,kind))throw Error('Merchant training failed');upB(b,U[kind].t+1)}
    const sources=S.us.every((u,i)=>u.tradeFromKey===[0,k,homes[i].x,homes[i].y].join(':'));
    const paidGold=1000-S.res[0].g,paidWood=1000-S.res[0].w,bank=S.res[0].g;
    const advance=()=>{for(const u of S.us)upU(u,1/30)};
    for(let i=0;i<3600&&!S.us.some(u=>u.tradeReturning);i++)advance();
    const outgoingUnpaid=S.res[0].g===bank,loaded=saveG()&&loadG();mode='pause';
    const restored=S.bs.filter(b=>b.t===0).every(b=>b.rally.t===S.bs.find(b=>b.t===1));
    for(let i=0;i<6000;i++)advance();
    rows.push({kind,assigned,sources,spawned:S.us.length,paidGold,paidWood,expectedGold:2*(U[kind].cost.g||0),expectedWood:2*(U[kind].cost.w||0),outgoingUnpaid,loaded,restored,goldEarned:S.res[0].g-bank});
   }
   cmp=null;notes.length=0;S.sel=S.bs.filter(b=>b.t===0);setZoom(.8);ctr(32,27);mode='play';draw(0);
   const proof=document.createElement('canvas');proof.id='merchant-rally-proof';proof.width=CW;proof.height=CH;proof.getContext('2d').drawImage(document.getElementById('c'),0,0);document.body.append(proof);mode='pause';
   return rows;
  });
  for(const row of merchantRally){for(const key of ['assigned','sources','outgoingUnpaid','loaded','restored'])assert.equal(row[key],true,row.kind+' '+key);assert.equal(row.spawned,2);assert.equal(row.paidGold,row.expectedGold);assert.equal(row.paidWood,row.expectedWood);assert.ok(row.goldEarned>0)}
  await page.locator('#merchant-rally-proof').screenshot({path:output+'/merchant-trade-rally.png'});
  const networkEscorts=await page.evaluate(()=>{
   const rows=[];
   for(const naval of [false,true])for(const type of ['follow','guard']){
    // Controlled groups; actual RT, stick selection and A press/release.
    startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(naval?1:0);S.ex.fill(1);S.vs.fill(1);
    const actors=[addU(0,naval?'gal':'mil',23.5,24.5),addU(0,naval?'gal':'mil',25.5,24.5)],target=addU(0,naval?'fish':'vil',31.5,29.5);actors.forEach(u=>u.st=4);
    const canvas=document.createElement('canvas');canvas.id='escort-map-'+naval+'-'+type;document.body.append(canvas);const description=document.createElement('p');document.body.append(description);const orders=[];
    const map=CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return {ok:true}}});map.refresh(S,0,W,H,true);map.choose(actors[0]);map.choose(actors[1],true);
    const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,items=CK_GAME_COMMANDS.unitOptions(S,0,actors[0]),angle=items.findIndex(o=>o.type===type)*Math.PI*2/items.length;
    map.control({7:true},{7:true});map.control({},{7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true,0:true});map.control({},{});
    let cursor={x:actors[1].x,y:actors[1].y};
    for(let i=0;i<20&&Math.hypot(cursor.x-target.x,cursor.y-target.y)>.001;i++){
     const v=map.viewport(),sx=v.width*.6*.1,sy=v.height*.6*.1,ax=Math.max(-1,Math.min(1,(target.x-cursor.x)/sx)),ay=Math.max(-1,Math.min(1,(target.y-cursor.y)/sy));
     map.control({},{},[ax,ay],.1);cursor.x+=ax*sx;cursor.y+=ay*sy;
    }
    map.control({0:true},{0:true});map.control({},{});
    const deferred=orders.length===1&&CK_SIM_SYNC.worldCheckpoint(S,1).hash===before,correctTarget=orders[0]?.target===target.netId;
    mode='play';const applied=orders.length===1&&CK_GAME_COMMANDS.execute(orders[0],0,1);mode='pause';
    for(let i=0;i<1500;i++)for(const u of actors)upU(u,1/30);
    const spacing=type==='follow'?1.4:2.2,arrived=actors.every(u=>d2(u.x,u.y,target)<spacing);
    target.x+=3;target.y+=2;for(let i=0;i<1500;i++)for(const u of actors)upU(u,1/30);
    const tracked=actors.every(u=>u.tg===target&&d2(u.x,u.y,target)<spacing);
    let intercepted=null,resumed=null,rangedIntercepted=null,rangedHeld=null,rangedResumed=null;
    if(type==='guard'){
     const enemy=addU(1,naval?'gal':'mil',target.x+1,target.y);actors[0].st=0;foeGridDirty=true;upU(actors[0],1/30);
     intercepted=actors[0].o==='a'&&actors[0].tg===enemy&&actors[0].guardTarget===target;
     enemy.x+=12;enemy.y+=12;foeGridDirty=true;upU(actors[0],1/30);resumed=actors[0].o==='G'&&actors[0].tg===target&&actors[0].guardTarget===null;
     const shooter=addU(1,naval?'gal':'bomb',target.x+(naval?5.8:8.8),target.y);shooter.o='a';shooter.tg=target;
     actors[0].x=target.x+3;actors[0].y=target.y;actors[0].o='G';actors[0].tg=target;actors[0].guardTarget=null;actors[0].p=[];foeGridDirty=true;
     upU(actors[0],1/30);rangedIntercepted=actors[0].o==='a'&&actors[0].tg===shooter&&actors[0].guardTarget===target;
     upU(actors[0],1/30);rangedHeld=actors[0].o==='a'&&actors[0].tg===shooter;
     shooter.x+=12;foeGridDirty=true;upU(actors[0],1/30);rangedResumed=actors[0].o==='G'&&actors[0].tg===target&&actors[0].guardTarget===null;
    }
    map.refresh(S,0,W,H,true);map.control({7:true},{7:true});map.control({},{7:true},[Math.sin(angle),-Math.cos(angle)]);
    rows.push({type,naval,deferred,correctTarget,applied,arrived,tracked,intercepted,resumed,rangedIntercepted,rangedHeld,rangedResumed});
   }
   return rows;
  });
  for(const row of networkEscorts){for(const key of ['deferred','correctTarget','applied','arrived','tracked'])assert.equal(row[key],true,row.type+' '+key);if(row.type==='guard'){assert.equal(row.intercepted,true);assert.equal(row.resumed,true);for(const key of ['rangedIntercepted','rangedHeld','rangedResumed'])assert.equal(row[key],true,row.type+' '+key)}}
  await page.locator('#escort-map-true-guard').screenshot({path:output+'/network-guard-command.png'});
  const combatStances=await page.evaluate(()=>{
   const rows=[];
   for(const naval of [false,true]){
    startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(naval?1:0);S.ex.fill(1);S.vs.fill(1);
    const actors=[addU(0,naval?'gal':'mil',23.5,24.5),addU(0,naval?'gal':'mil',25.5,24.5)],target=addU(0,naval?'fish':'vil',24.5,25.5);
    const canvas=document.createElement('canvas');canvas.id='stances-map-'+naval;document.body.append(canvas);const description=document.createElement('p');document.body.append(description);const orders=[];
    const map=CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return {ok:true}}});map.refresh(S,0,W,H,true);map.choose(actors[0]);map.choose(actors[1],true);
    for(const [stance,value]of ['aggressive','defensive','stand-ground','passive','no-attack'].entries()){
     if(value==='no-attack'){
      mode='play';CK_GAME_COMMANDS.execute({type:'guard',entities:actors.map(u=>u.netId),target:target.netId},0,1);mode='pause';
      const enemy=addU(1,naval?'gal':'mil',target.x+1,target.y);actors[0].st=0;foeGridDirty=true;upU(actors[0],1/30);
      if(actors[0].o!=='a'||actors[0].guardTarget!==target)throw Error('Guard interception fixture did not engage');
      actors[0].wind=1;actors[0].windTarget=enemy;
     }
     map.refresh(S,0,W,H,true);
     const items=CK_GAME_COMMANDS.unitOptions(S,0,actors[0]),angle=items.findIndex(o=>o.type==='stance'&&o.value===value)*Math.PI*2/items.length,before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,count=orders.length;
     map.control({7:true},{7:true});map.control({},{7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true,0:true});map.control({},{});
     const deferred=orders.length===count+1&&orders.at(-1).value===value&&orders.at(-1).entities.length===2&&CK_SIM_SYNC.worldCheckpoint(S,1).hash===before;
     mode='play';const applied=CK_GAME_COMMANDS.execute(orders.at(-1),0,1);mode='pause';
     const guardPreserved=value!=='no-attack'||actors[0].o==='G'&&actors[0].tg===target&&actors[0].wind===0&&actors[0].windTarget===null;
     rows.push({naval,value,deferred,applied,correct:actors.every(u=>u.st===stance),guardPreserved});
     map.refresh(S,0,W,H,true);map.control({7:true},{7:true});map.control({},{7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({},{});
    }
    map.control({7:true},{7:true});const items=CK_GAME_COMMANDS.unitOptions(S,0,actors[0]),a=(items.length-1)*Math.PI*2/items.length;map.control({},{7:true},[Math.sin(a),-Math.cos(a)]);
   }
   return rows;
  });
  for(const row of combatStances)for(const key of ['deferred','applied','correct','guardPreserved'])assert.equal(row[key],true,row.value+' '+key);
  await page.locator('#stances-map-true').screenshot({path:output+'/network-combat-stances.png'});
  const paladin=await page.evaluate(()=>{
   startScenario(0);mode='pause';S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.civ[0]=0;S.age[0]=3;S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};
   const stable=addB(0,'stable',40,40,true),rider=addU(0,'knight',44.5,44.5);
   research(stable,'cavl');upB(stable,80);
   const canvas=document.createElement('canvas'),description=document.createElement('p'),orders=[];document.body.append(canvas,description);
   const map=CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return {ok:true}}});map.refresh(S,0,W,H,true);map.choose({x:41,y:41});
   const items=CK_GAME_COMMANDS.buildingOptions(S,0,stable),angle=items.findIndex(o=>o.value==='pala')*Math.PI*2/items.length,before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
   map.control({7:true},{7:true});map.control({},{7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true,0:true});map.control({},{});
   const deferred=orders.length===1&&orders[0].value==='pala'&&CK_SIM_SYNC.worldCheckpoint(S,1).hash===before;
   mode='play';const applied=orders.length===1&&CK_GAME_COMMANDS.execute(orders[0],0,1);upB(stable,169);const waiting=!S.tech[0].pala;upB(stable,1);
   S.sel=[rider];menu=null;place=null;zm=2;TW=64*zm;TH=32*zm;ctr(rider.x,rider.y);draw(0);
   const capture=document.createElement('canvas');capture.id='paladin-preview';capture.width=cv.width;capture.height=cv.height;capture.getContext('2d').drawImage(cv,0,0);document.body.append(capture);mode='pause';
   return {deferred,applied,waiting,name:unitName('knight',0),hp:rider.hp,maxHP:mhp(rider),reload:attackReload(rider),stats:stt(rider),food:S.res[0].f,gold:S.res[0].g,painted:!!ASSET.n};
  });
  for(const key of ['deferred','applied','waiting','painted'])assert.equal(paladin[key],true,'Paladin '+key);
  assert.match(paladin.stats,/Armor 2\/3/);assert.equal(paladin.name,'Paladin');assert.equal(paladin.hp,160);assert.equal(paladin.maxHP,160);assert.equal(paladin.reload,1.9);assert.equal(paladin.food,8400);assert.equal(paladin.gold,8950);
  await page.locator('#paladin-preview').screenshot({path:output+'/paladin.png'});
  const combatStats=await page.evaluate(()=>{
   mode='play';const rider=S.sel[0],before=stt(rider),smith=addB(0,'smith',34,40,true),paid=[];
   for(const k of ['forging','ironCasting','blastFurnace','armC','armC2','armC3']){paid.push(research(smith,k));upB(smith,TE[k].t)}
   const enemy=addU(1,'knight',46.5,44.5),hash=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
   const after=stt(rider),foreign=stt(enemy),readOnly=CK_SIM_SYNC.worldCheckpoint(S,1).hash===hash;
   draw(0);const capture=document.createElement('canvas');capture.id='combat-stats-preview';capture.width=cv.width;capture.height=cv.height;capture.getContext('2d').drawImage(cv,0,0);document.body.append(capture);mode='pause';
   return {before,after,foreign,readOnly,paid};
  });
  assert.equal(combatStats.before,'Atk 10+4  Armor 2/3');assert.equal(combatStats.after,'Atk 10+8  Armor 5/7');
  assert.equal(combatStats.foreign,'Atk 10  Armor 2/2');assert.equal(combatStats.readOnly,true);assert.ok(combatStats.paid.every(Boolean));
  await page.locator('#combat-stats-preview').screenshot({path:output+'/combat-stats.png'});
  return {...result,tidewatch,relicReturn,dockGuard,productionWait,objectivePolicy,minimumRange,constructionRecovery,groupRally,fishingRally,merchantRally,networkEscorts,combatStances,paladin,combatStats};
 }finally{await page.close()}
}
