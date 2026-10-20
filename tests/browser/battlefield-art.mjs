import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { createApplication } from '../../server/app.mjs';

const output='artifacts/battlefield-art';
await mkdir(output,{recursive:true});
const server=createApplication();server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const errors=[];
async function scene(page){
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>typeof CK_UNIT_MAP!=='undefined'&&typeof ASSET!=='undefined');
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
  addU(0,'knight',27.5,24.5);
  const foe=addU(1,'arc',31.5,26.5);foe.o='a';foe.cd=.2;
  const hidden=addU(1,'scout',62.5,62.5);
  for(let x=17;x<23;x++)for(let y=29;y<32;y++)addN('w',x,y,100,0);
  addN('g',26,29,100,0);addN('s',27,30,100,0);
  for(let y=34;y<41;y++)for(let x=24;x<43;x++)S.wt[y*W+x]=1;
  addU(0,'trn',29.5,35.5);addU(1,'gal',34.5,36.5);
  const host=document.createElement('main');
  host.style.cssText='position:fixed;inset:0;z-index:10000;background:#09141d;color:#eadfc2;font:16px system-ui;display:flex;align-items:center;flex-direction:column;overflow:auto';
  const title=document.createElement('h1');title.textContent='Crown & Kingdoms — original battlefield art';title.style.fontSize='22px';
  const canvas=document.createElement('canvas');canvas.id='battlefield-art';
  const description=document.createElement('p');description.style.maxWidth='680px';
  host.append(title,canvas,description);document.body.append(host);
  const context=canvas.getContext('2d'),original=context.drawImage.bind(context);
  window.artDraws=[];
  context.drawImage=(...args)=>{artDraws.push({src:args[0].src,x:args[1],y:args[2],w:args[3],h:args[4]});return original(...args)};
  window.artMap=CK_UNIT_MAP.create({canvas,description,submit:()=>({ok:false}),leave(){}});
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
 await page.waitForFunction(()=>ASSET.n===4);
 const animation=await page.evaluate(()=>{
  artDraws.length=0;artMap.refresh(S,0,W,H,true);
  const first=JSON.stringify(artDraws),hash=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const stable=hash===CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  S.t=.21;artDraws.length=0;const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  artMap.refresh(S,0,W,H,true);
  return {changed:first!==JSON.stringify(artDraws),sprites:artDraws.length,
    originalSources:[...new Set(artDraws.map(d=>new URL(d.src).pathname))],
    unchanged:before===CK_SIM_SYNC.worldCheckpoint(S,1).hash,stable};
 });
 assert.equal(initial.hash,initial.after);assert.equal(initial.enemyHidden,true);
 assert.equal(initial.foundation,.5);
 assert.ok(animation.sprites>=8);assert.equal(animation.changed,true);assert.equal(animation.unchanged,true);
 assert.ok(animation.originalSources.some(s=>s.endsWith('upright-units-atlas.svg')));
 assert.ok(animation.originalSources.some(s=>s.endsWith('detailed-forces-atlas.svg')));
 assert.ok(animation.originalSources.some(s=>s.endsWith('detailed-buildings-atlas.svg')));
 await page.locator('#battlefield-art').screenshot({path:output+'/team-zero.png'});
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
 const fallback=await browser.newPage({viewport:{width:960,height:850}});
 fallback.on('pageerror',error=>errors.push(error.message));
 await fallback.route('**/assets/*atlas.svg',route=>route.abort());
 const without=await scene(fallback);
 assert.equal(without.sprites,0);assert.equal(without.hash,without.after);assert.equal(without.enemyHidden,true);
 const colours=await fallback.evaluate(()=>{
  const c=document.getElementById('battlefield-art').getContext('2d'),data=c.getImageData(0,0,680,680).data,set=new Set();
  for(let i=0;i<data.length;i+=64)set.add(data[i]+','+data[i+1]+','+data[i+2]);
  return set.size;
 });
 assert.ok(colours>20,'procedural scene remains visible when every atlas request fails');
 await fallback.locator('#battlefield-art').screenshot({path:output+'/fallback.png'});
 assert.deepEqual(errors,[]);
 await writeFile(output+'/metrics.json',JSON.stringify({initial,animation,teamOne,timing,fallbackColours:colours},null,2));
 console.log('Real Chromium: local SVG atlases, animation, both teams, fog, checksum isolation and failed-image fallback passed');
 console.log(JSON.stringify(timing));
}finally{
 await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
