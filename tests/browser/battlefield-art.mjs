import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { createApplication } from '../../server/app.mjs';

const output='artifacts/battlefield-art';
await mkdir(output,{recursive:true});
const application=createApplication();
let staleManifest=false;
const server=createServer((req,res)=>{
 if(staleManifest&&req.url.startsWith('/assets/atlas-manifest.json')){
  staleManifest=false;
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'public, max-age=31536000'});
  res.end('{"atlases":[]}');return;
 }
 application.emit('request',req,res);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const errors=[];
async function scene(page,expectArt=true){
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>typeof CK_UNIT_MAP!=='undefined'&&typeof ASSET!=='undefined');
 if(expectArt)await page.waitForFunction(()=>ASSET.n===8&&PAINT.terrain);
 return page.evaluate(()=>{
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;startAge=2;startArmy=0;startRes=3;
  start();snd=mus=0;mode='title';S.humanTeams=[0,1];S.us=[];S.bs=[];S.nodes=[];S.rel=[];
  S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(0);S.t=.05;
  const tc=addB(0,'tc',20,20,true),mill=addB(0,'mill',26,21,true);
  const barracks=addB(0,'bar',23,27,false);barracks.pr=B.bar.bt*.5;
  const enemy=addB(1,'tc',34,25,true);enemy.hp=enemy.mh*.35;
  addB(0,'outpost',29,26,true);
  const worker=addU(0,'vil',23.5,24.5);worker.o='g';
  const soldier=addU(0,'mil',25.5,25.5);soldier.p=[[26.5,25.5]];
  addU(0,'knight',27.5,24.5);addU(0,'cart',24.5,26.5);addU(0,'conq',28.5,23.5);addB(0,'palisade',25,31,true);
  const foe=addU(1,'arc',31.5,26.5);foe.o='a';foe.cd=.2;
  const hidden=addU(1,'scout',62.5,62.5);
  for(let x=17;x<23;x++)for(let y=29;y<32;y++)addN('w',x,y,100,0);
  addN('g',26,29,100,0);addN('s',27,30,100,0);
  for(let y=34;y<41;y++)for(let x=24;x<43;x++)S.wt[y*W+x]=1;
  addU(0,'trn',29.5,35.5);addU(0,'cog',31.5,35.5);addU(1,'gal',34.5,36.5);
  const host=document.createElement('main');
  host.style.cssText='position:fixed;inset:0;z-index:10000;background:#09141d;color:#eadfc2;font:16px system-ui;display:flex;align-items:center;flex-direction:column;overflow:auto';
  const title=document.createElement('h1');title.textContent='Crown & Kingdoms — painted medieval battlefield';title.style.fontSize='22px';
  const canvas=document.createElement('canvas');canvas.id='battlefield-art';
  const description=document.createElement('p');description.style.maxWidth='680px';
  host.append(title,canvas,description);document.body.append(host);
  const context=canvas.getContext('2d'),original=context.drawImage.bind(context);
  window.artDraws=[];
  context.drawImage=(...args)=>{artDraws.push({painted:args[0].paintedAtlas,team:args[0].paintedTeam,src:args[0].src,x:args[1],y:args[2],w:args[3],h:args[4]});return original(...args)};
  window.artOrders=[];
  window.artMap=CK_UNIT_MAP.create({canvas,description,submit:order=>{artOrders.push(order);return{ok:false}},leave(){}});
  window.artFixture={hidden:hidden.netId,soldier:soldier.netId};
  const hash=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  artMap.refresh(S,0,W,H,true);artMap.choose({x:soldier.x,y:soldier.y});
  const view=CK_UNIT_MAP.project(S,0,W,H);
  return {hash,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,sprites:artDraws.length,
    enemyHidden:!view.battlefield.enemies.some(e=>e.id===hidden.netId),
    foundation:view.buildings.find(b=>b.id===barracks.netId).progress};
 });
}
try{
 const page=await browser.newPage({viewport:{width:960,height:850}});
 page.on('pageerror',error=>errors.push(error.message));
 const initial=await scene(page);
 const diagnostics=await page.evaluate(()=>{
  const missingUnits=[],missingBuildings=[];
  for(const k of Object.keys(U))for(let t=0;t<4;t++)for(let st=0;st<4;st++)if(!assetFrame(k,t,st,0,.1))missingUnits.push(k+'/'+t+'/'+st);
  for(const k of Object.keys(B))for(let t=0;t<4;t++)if(!assetFrame('bld_'+k,t,0,0,.1))missingBuildings.push(k+'/'+t);
  const a=assetFrame('mil',0,0,0,0),b=assetFrame('mil',1,0,0,0);
  const pixels=a.img.getContext('2d').getImageData(0,0,a.img.width,a.img.height).data;
  const red=b.img.getContext('2d').getImageData(0,0,b.img.width,b.img.height).data;
  let transparent=0,changed=0;
  for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])transparent++;if(pixels[i]!==red[i]||pixels[i+1]!==red[i+1]||pixels[i+2]!==red[i+2])changed++}
  return {missingUnits,missingBuildings,transparent,changed,terrain:!!PAINT.terrain,atlases:ASSET.n};
 });
 console.log('Painted raster diagnostics: '+JSON.stringify(diagnostics));
 assert.deepEqual(diagnostics.missingUnits,[]);assert.deepEqual(diagnostics.missingBuildings,[]);
 assert.equal(diagnostics.atlases,8);assert.equal(diagnostics.terrain,true);
 assert.ok(diagnostics.transparent>100000&&diagnostics.changed>1000,'real transparent art and team cloth recolouring');
 const motion=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,results=[];
  for(const kind of ['mil','knight','vil','arc','xbow','spear'])for(let team=0;team<4;team++)for(const state of [1,2,...(kind==='vil'?[3]:[])]){
   const a=assetFrame(kind,team,state,0,0,0,state===2?0:undefined),b=assetFrame(kind,team,state,0,.3,0,state===2?.5:undefined);
   results.push({kind,team,state,animated:a.animated,changed:a.f.x!==b.f.x||a.f.y!==b.f.y,scale:a.sc===b.sc,bodyHeight:a.referenceHeight===b.referenceHeight});
  }
  return {results,unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(motion.results.length,52);assert.ok(motion.results.every(r=>r.animated&&r.changed&&r.scale&&r.bodyHeight));assert.equal(motion.unchanged,true);
 const weaponEdge=await page.evaluate(()=>{
  const saved={us:S.us,bs:S.bs,sel:S.sel,zm,TW,TH,x:cam.x,y:cam.y};
  const actor={...S.us.find(u=>u.k==='mil'),k:'spear',netId:'render-probe',x:30,y:30,p:[],o:'a',cd:U.spear.cd,hp:U.spear.hp,car:0,tg:{x:29,y:30}};
  try{
   S.us=[];S.bs=[];S.sel=[];zm=3;TW=64*zm;TH=32*zm;cam.x=-(CW+60);cam.y=60*TH/2-CH/2;
   X.fillStyle='#172321';X.fillRect(0,0,CW,CH);drawWorld();const before=X.getImageData(CW-80,0,80,CH).data;
   S.us=[actor];X.fillStyle='#172321';X.fillRect(0,0,CW,CH);drawWorld();const after=X.getImageData(CW-80,0,80,CH).data;
   let changed=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;
   return {changed};
  }finally{S.us=saved.us;S.bs=saved.bs;S.sel=saved.sel;zm=saved.zm;TW=saved.TW;TH=saved.TH;cam.x=saved.x;cam.y=saved.y;}
 });
 assert.ok(weaponEdge.changed>5,'a spear thrust remains visible when its feet are outside the viewport at close zoom');
 const rendering=await page.evaluate(()=>{
  artDraws.length=0;artMap.refresh(S,0,W,H,true);
  const first=JSON.stringify(artDraws),hash=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const stable=hash===CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  S.t=.21;artDraws.length=0;const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  artMap.refresh(S,0,W,H,true);
  return {changed:first!==JSON.stringify(artDraws),sprites:artDraws.length,
    painted:artDraws.filter(d=>d.painted).length,
    teams:[...new Set(artDraws.filter(d=>d.painted).map(d=>d.team))],
    unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash,stable};
 });
 assert.equal(initial.hash,initial.after);assert.equal(initial.enemyHidden,true);
 assert.equal(initial.foundation,.5);
 assert.ok(rendering.sprites>=8);assert.equal(rendering.changed,true);assert.equal(rendering.unchanged,true);
 assert.ok(rendering.painted>=8);assert.ok(rendering.teams.length>=2,'both kingdom palettes are present');
 await page.locator('#battlefield-art').screenshot({path:output+'/team-zero.png'});
 const militaryMenu=await page.evaluate(()=>{
  const context=document.getElementById('battlefield-art').getContext('2d'),original=context.fillText.bind(context),labels=[];
  context.fillText=(text,...args)=>{labels.push(text);return original(text,...args)};
  artMap.control({7:true},{7:true});
  const unit=S.us.find(u=>u.netId===artFixture.soldier),items=CK_GAME_COMMANDS.unitOptions(S,0,unit);
  items.forEach((_,i)=>{const angle=i*Math.PI*2/items.length;artMap.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)])});
  context.fillText=original;
  return {patrol:labels.includes('Patrol'),attackMove:labels.includes('Attack Move')};
 });
 assert.equal(militaryMenu.patrol,true);assert.equal(militaryMenu.attackMove,true);
 await page.locator('#battlefield-art').screenshot({path:output+'/military-command-menu.png'});
 const militaryOrders=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  for(const type of ['patrol','attack-move']){
   artMap.control({7:true},{7:true});
   const soldier=S.us.find(u=>u.netId===artFixture.soldier),items=CK_GAME_COMMANDS.unitOptions(S,0,soldier);
   const angle=items.findIndex(o=>o.type===type)*Math.PI*2/items.length;
   artMap.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);
   artMap.control({0:true},{7:true,0:true});artMap.control({},{});
   artMap.choose({x:30.5,y:29.5});artMap.control({1:true},{1:true});artMap.control({},{});
  }
  return {types:artOrders.map(o=>o.type),points:artOrders.every(o=>o.point&&!o.target),unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.deepEqual(militaryOrders.types,['patrol','attack-move']);assert.equal(militaryOrders.points,true);assert.equal(militaryOrders.unchanged,true);
 const ballisticsMenu=await page.evaluate(()=>{
  artMap.control({1:true},{1:true});artMap.control({},{});
  const university=addB(0,'univ',24,31,true);artMap.refresh(S,0,W,H,true);
  artMap.choose({x:25.5,y:32.5});artMap.control({7:true},{7:true});
  const options=CK_GAME_COMMANDS.buildingOptions(S,0,university),index=options.findIndex(o=>o.value==='ballistics'),entry=options[index];
  const angle=index*Math.PI*2/options.length;
  artMap.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);
  return {present:index>=0,label:entry?.label,locked:entry?.locked,cost:entry?.cost};
 });
 assert.equal(ballisticsMenu.present,true);assert.equal(ballisticsMenu.label,'Ballistics');assert.equal(ballisticsMenu.locked,'');
 assert.deepEqual(ballisticsMenu.cost,{w:300,g:175});
 await page.locator('#battlefield-art').screenshot({path:output+'/ballistics-research-menu.png'});
 await page.evaluate(()=>{artMap.control({1:true},{1:true});artMap.control({},{});const soldier=S.us.find(u=>u.netId===artFixture.soldier);artMap.choose({x:soldier.x,y:soldier.y});});
 const monkResearch=await page.evaluate(()=>{
  const monastery=addB(0,'monastery',31,28,true);artMap.refresh(S,0,W,H,true);artMap.choose({x:32.5,y:29.5});artMap.control({7:true},{7:true});
  const options=CK_GAME_COMMANDS.buildingOptions(S,0,monastery),index=options.findIndex(o=>o.value==='atonement'),entry=options[index];
  const angle=index*Math.PI*2/options.length;artMap.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);
  return {present:index>=0,label:entry?.label,locked:entry?.locked,cost:entry?.cost};
 });
 assert.equal(monkResearch.label,'Atonement');assert.equal(monkResearch.locked,'');assert.deepEqual(monkResearch.cost,{g:325});
 await page.locator('#battlefield-art').screenshot({path:output+'/monastery-research-menu.png'});
 const monkMenu=await page.evaluate(()=>{
  artMap.control({1:true},{1:true});artMap.control({},{});
  window.artMonk=addU(0,'mon',27.5,27.5);window.artConvertTarget=addU(1,'mil',30.5,28.5);artMap.refresh(S,0,W,H,true);artMap.choose({x:artMonk.x,y:artMonk.y});
  artMap.control({7:true},{7:true});const options=CK_GAME_COMMANDS.unitOptions(S,0,artMonk),index=options.findIndex(o=>o.type==='convert'),angle=index*Math.PI*2/options.length;
  artMap.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);return {label:options[index]?.label,locked:options[index]?.locked};
 });
 assert.equal(monkMenu.label,'Convert');assert.equal(monkMenu.locked,'');
 await page.locator('#battlefield-art').screenshot({path:output+'/monk-convert-menu.png'});
 const conversionTargeting=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  artMap.control({0:true},{7:true,0:true});artMap.control({},{});artMap.choose({x:artConvertTarget.x,y:artConvertTarget.y});
  const order=artOrders.at(-1);artMap.control({1:true},{1:true});artMap.control({},{});
  const soldier=S.us.find(u=>u.netId===artFixture.soldier);artMap.choose({x:soldier.x,y:soldier.y});
  return {type:order?.type,target:order?.target===artConvertTarget.netId,unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(conversionTargeting.type,'convert');assert.equal(conversionTargeting.target,true);assert.equal(conversionTargeting.unchanged,true);
 const groups=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  artMap.control({4:true},{4:true},[0,-1]);artMap.control({2:true},{4:true,2:true},[0,-1]);artMap.control({},{});
  artMap.control({1:true});artMap.control({4:true},{4:true},[0,-1]);artMap.control({},{});
  const recalled=artMap.selection().includes(artFixture.soldier);
  artMap.control({4:true},{4:true},[0,-1]);
  return {recalled,count:artMap.controlGroups()[0].length,unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(groups.recalled,true);assert.equal(groups.count,1);assert.equal(groups.unchanged,true);
 await page.locator('#battlefield-art').screenshot({path:output+'/control-groups.png'});
 await page.evaluate(()=>artMap.control({1:true},{4:true,1:true}));
 const camera=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  for(let i=0;i<8;i++)artMap.control({}, {}, [0,0,0,-1],.1);
  const analogZoom=artMap.viewport().zoom;
  artMap.control({4:true},{4:true},[0,-1]);artMap.control({3:true},{4:true,3:true},[0,-1]);artMap.control({},{});
  const viewport=artMap.viewport();
  const view=CK_UNIT_MAP.project(S,0,W,H);
  return {viewport,analogZoom,unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash,
    hidden:!view.battlefield.enemies.some(e=>e.id===artFixture.hidden)};
 });
 assert.ok(camera.analogZoom>1);assert.equal(camera.viewport.zoom,camera.analogZoom);assert.equal(camera.unchanged,true);assert.equal(camera.hidden,true);
 await page.locator('#battlefield-art').screenshot({path:output+'/focused-world.png'});
 await page.evaluate(()=>artMap.control({5:true}));
 assert.equal(await page.evaluate(()=>artMap.viewport().overview),true);
 await page.locator('#battlefield-art').screenshot({path:output+'/expanded-minimap.png'});
 await page.evaluate(()=>artMap.control({1:true}));
 const contact=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const canvas=document.createElement('canvas');canvas.id='extended-art';
  const names=[...Object.keys(U).filter(k=>!['tca','tw','cs'].includes(k)),...Object.keys(B).map(k=>'bld_'+k)],rows=Math.ceil(names.length/8);
  canvas.width=1280;canvas.height=rows*144;canvas.style.cssText='display:block;width:1280px;max-width:none';
  const ctx=canvas.getContext('2d');ctx.fillStyle='#15232b';ctx.fillRect(0,0,canvas.width,canvas.height);
  let count=0;
  for(let i=0;i<names.length;i++){
   const x=i%8*160,y=Math.floor(i/8)*144;
   ctx.fillStyle='#f4e6ba';ctx.font='10px system-ui';ctx.fillText(names[i],x+4,y+14);
   for(let team=0;team<2;team++){
    const art=assetFrame(names[i],team,0,0,.1),f=art.f,scale=Math.min(64/f.w,48/f.h);
    ctx.drawImage(art.img,f.x,f.y,f.w,f.h,x+80-f.ax*scale,y+66+team*60-f.ay*scale,f.w*scale,f.h*scale);count++;
   }
  }
  document.querySelector('main').append(canvas);
  return {icons:names.length,sprites:count,unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(contact.icons,69);assert.equal(contact.sprites,138);assert.equal(contact.unchanged,true);
 await page.setViewportSize({width:1320,height:1450});
 await page.locator('#extended-art').screenshot({path:output+'/extended-art.png'});
 await page.setViewportSize({width:960,height:850});
 const teamOne=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;artMap.refresh(S,1,W,H,true);
  const view=CK_UNIT_MAP.project(S,1,W,H);
  return {correct:view.units.every(u=>u.team===1),unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(teamOne.correct,true);assert.equal(teamOne.unchanged,true);
 await page.locator('#battlefield-art').screenshot({path:output+'/team-one.png'});
 const timing=await page.evaluate(()=>{
  const begin=performance.now();
  for(let i=0;i<60;i++)artMap.refresh(S,0,W,H,true);
  return {frames:60,averageMs:(performance.now()-begin)/60};
 });
 // Reproduce an existing player with a stale HTTP manifest and an old SVG shell cache.
 staleManifest=true;
 const upgrade=await browser.newPage({viewport:{width:960,height:850}});
 upgrade.on('pageerror',error=>errors.push(error.message));
 await upgrade.goto(origin,{waitUntil:'networkidle'});
 assert.equal(await upgrade.evaluate(()=>ASSET.n),0,'fixture primes an obsolete HTTP-cached manifest');
 const migrated=await upgrade.evaluate(async()=>{
  const cache=await caches.open('ck-shell-v9');
  await cache.put(new URL('/assets/trade-atlas.svg',location.origin),new Response('obsolete artwork'));
  await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  return !(await caches.keys()).includes('ck-shell-v9');
 });
 assert.equal(migrated,true,'activation removes old cached SVG artwork');
 const upgradedScene=await scene(upgrade);
 assert.ok(upgradedScene.sprites>=8);assert.equal(upgradedScene.hash,upgradedScene.after);
 const cacheUpgrade={oldShellRemoved:migrated,sprites:upgradedScene.sprites};
 const partial=await browser.newPage({viewport:{width:960,height:850}});
 partial.on('pageerror',error=>errors.push(error.message));
 await partial.route('**/assets/painted-motion-*.webp',route=>route.abort());
 await scene(partial,false);await partial.waitForFunction(()=>ASSET.n===2&&PAINT.terrain);
 assert.equal(await partial.evaluate(()=>assetFrame('mil',0,1,0,.3).animated),false,'a failed motion sheet retains its painted base pose');
 await partial.close();
 const fallback=await browser.newPage({viewport:{width:960,height:850}});
 fallback.on('pageerror',error=>errors.push(error.message));
 await fallback.route('**/assets/painted-*.webp',route=>route.abort());
 const without=await scene(fallback,false);
 assert.equal(without.sprites,0);assert.equal(without.hash,without.after);assert.equal(without.enemyHidden,true);
 const colours=await fallback.evaluate(()=>{
  const c=document.getElementById('battlefield-art').getContext('2d'),data=c.getImageData(0,0,680,680).data,set=new Set();
  for(let i=0;i<data.length;i+=64)set.add(data[i]+','+data[i+1]+','+data[i+2]);
  return set.size;
 });
 assert.ok(colours>20,'procedural fallback remains visible when painted image requests fail');
 await fallback.locator('#battlefield-art').screenshot({path:output+'/fallback.png'});
 assert.deepEqual(errors,[]);
 await writeFile(output+'/metrics.json',JSON.stringify({initial,diagnostics,motion,weaponEdge,rendering,teamOne,contact,militaryMenu,militaryOrders,ballisticsMenu,monkResearch,monkMenu,conversionTargeting,groups,camera,cacheUpgrade,timing,fallbackColours:colours},null,2));
 console.log('Real Chromium: transparent painted WebP sprites, team heraldry, both teams, fog, checksum isolation, cache upgrades and external-asset failure passed');
 console.log(JSON.stringify(timing));
}finally{
 await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
