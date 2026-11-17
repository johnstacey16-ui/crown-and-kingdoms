import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {graphicsSurfaceLifetimeSource} from './helpers/headless-game.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=JSON.parse(read('assets/atlas-manifest.json'));
const scripts=graphicsSurfaceLifetimeSource()+read('js/assets.js')+'\n'+read('js/render-troops.js')+'\n'+read('js/engine-picture.js');
function fixture(){
 let readback=0,allocations=0,clock=0;
 const storage=new Map(),world={width:1200,height:599,events:{},
  addEventListener(name,fn){this.events[name]=fn}};
 const s={console,performance:{now:()=>++clock},teamColor:t=>['#2277ee','#ee3322','#9944cc','#eebb33'][t],
  document:{hidden:false,body:{appendChild(){}},createElement(tag){
   if(tag!=='canvas')return {style:{},setAttribute(){},remove(){}};
   allocations++;
   const canvas={width:0,height:0,addEventListener(){},getContext(){return {
    isContextLost:()=>false,clearRect(){},drawImage(){},putImageData(){},translate(){},scale(){},
    getImageData(x,y,w,h){readback+=w*h;return {data:[]}} // Operation counts only, no fake pixel timings.
   }}};
   return canvas;
  }},localStorage:{setItem:(key,value)=>storage.set(key,value)},
  cv:world,hudCanvas:null,mode:'pause',S:{us:[],bs:[]},perfDrawMs:0,perfUnitMs:0,perfUnitCount:0,
  perfStepMs:0,perfStepCount:0,zm:2.05,DPR:.6,perfRenderScale:1,window:{},
  stats:()=>({readback,allocations})};
 vm.createContext(s);
 vm.runInContext(scripts+'\nObject.assign(globalThis,{trace:GRAPHICS_TRACE,cache:TEAM_FRAME_CACHE,groups:TEAM_FRAME_GROUPS,crops:TROOP_TEXTURE_LRU,recovery:GRAPHICS_RECOVERY,lifetime:GRAPHICS_SURFACE_LIFETIME});',s);
 return {s,storage,world};
}
function run(kinds,zoom,dpr){
 const {s}=fixture();s.zm=zoom;s.DPR=dpr;
 const atlases=manifest.atlases.filter(a=>a.meta.motion).slice(0,kinds);
 for(const a of atlases)s.regAtlas(a.id,{width:a.meta.width,height:a.meta.height},a.meta);
 const roster=atlases.map(a=>Object.keys(a.meta.anims)[0].split('/')[0]);
 const frames=[];let peakPixels=0;
 const g={imageSmoothingEnabled:true,imageSmoothingQuality:'high',drawImage(){},save(){},restore(){},translate(){},scale(){},rotate(){}};
 for(let frame=0;frame<240;frame++){
  s.resetGraphicsTraceFrame();
  s.beginGraphicsSurfaceUse();
  const before=s.stats().readback,tints=s.cache.creations,evictions=s.cache.evictions;
  for(let i=0;i<90;i++){
   const team=i%4,kind=roster[Math.floor(i/4)%kinds],state=(Math.floor(i/(4*kinds))+frame%3)%3;
   const time=frame/20+(i%5)*.031,art=s.assetFrame(kind,team,state,0,time,0,(frame%8)/8);
   assert.ok(art?.painted&&(state===0||art.animated),'fixture must use real idle/walk/attack frames');
   s.drawPaintedTroop(g,art,0,0,art.sc*zoom,state,time,Math.floor(i/4)%2===0,kind,(frame%8)/8);
  }
  const retiredCount=s.lifetime.pending.size,retiredPixels=s.lifetime.pixels;
  s.endGraphicsSurfaceUse();
  assert.equal(s.lifetime.pending.size,0);assert.equal(s.lifetime.pixels,0,'retired bytes never accumulate across render batches');
  assert.equal(s.trace.frame.surfaceReleases,retiredCount);
  assert.equal(s.trace.frame.releasePixels,retiredPixels-retiredCount);
  const f={...s.trace.frame};
  assert.equal(f.tints,s.cache.creations-tints);
  assert.equal(f.tintEvictions,s.cache.evictions-evictions);
  assert.equal(f.readbackPixels,s.stats().readback-before);
  assert.ok(s.cache.pixels<=s.cache.limit);
  assert.equal(s.cache.pixels,s.groups.troop.pixels+s.groups.building.pixels);
  assert.ok(s.groups.troop.pixels<=s.groups.troop.limit);assert.ok(s.groups.building.pixels<=s.groups.building.limit);
  assert.ok(s.crops.size<=160);
  peakPixels=Math.max(peakPixels,s.cache.pixels);
  const retained=[...s.crops.values()].reduce((sum,c)=>sum+c.width*c.height,0);
  assert.ok(retained<=6*1024*1024);
  if(frame>=120)frames.push(f);
 }
 const totals=frames.reduce((a,f)=>{
  for(const key of ['tints','crops','readbackPixels','tintEvictions','cropEvictions'])a[key]=(a[key]||0)+f[key];return a;
 },{});
 return {kinds,zoom,dpr,frames:frames.length,...totals,peakPixels,tintEntries:s.cache.entries.size,cropEntries:s.crops.size};
}
for(const [zoom,dpr]of [[2.05,.6],[1,1]])for(const kinds of [3,6,9,14]){
 test(`counting canvas: four teams, ${kinds} kinds, zoom ${zoom}, DPR ${dpr}`,()=>{
  const result=run(kinds,zoom,dpr),repeat=run(kinds,zoom,dpr);
  console.log('MOCK COUNTS (not timings) '+JSON.stringify(result));
  assert.deepEqual(result,repeat,'counts must be reproducible');
  const index=[3,6,9,14].indexOf(kinds);
  assert.equal(result.tints,[0,5400,6750,6750][index],'pin baseline tint creations across the 120 measured frames');
  assert.equal(result.tintEvictions,result.tints);
  assert.equal(result.readbackPixels,[0,270500160,353608030,360533280][index]);
  assert.equal(result.crops,(zoom>1?[0,0,0,0]:[2700,5400,7920,8820])[index]);
  assert.equal(result.cropEvictions,result.crops);
  assert.ok(result.tintEntries>0);
  if(zoom>1)assert.equal(result.cropEntries,0,'native mirrored poses never create a second surface');
  else assert.ok(result.cropEntries>0,'existing distant-zoom source cache remains accounted');
  if(kinds===14)assert.ok(result.tints>0&&result.tintEvictions>0,'diverse baseline saturates tint budget');
 });
}
test('diagnostic ring is chronological, bounded and persists each world/HUD loss without state changes',()=>{
 const {s,storage,world}=fixture();
 for(let i=0;i<130;i++){s.resetGraphicsTraceFrame();s.trace.frame.tints=i;s.captureGraphicsTraceFrame(i*50,50)}
 assert.equal(s.trace.frames.length,120);
 s.installCanvasRecovery(world);world.events.contextlost();
 let report=JSON.parse(storage.get('ck_graphics_loss_latest'));
 assert.equal(report.frames[0].sequence,11);assert.equal(report.frames.at(-1).sequence,130);
 assert.equal(report.current.tints,129);assert.equal(report.world,true);assert.equal(report.loss,1);
 assert.equal(s.mode,'pause');assert.equal(s.S.us.length,0);
 const hud={addEventListener(name,fn){this[name]=fn}};
 s.installCanvasRecovery(hud);hud.contextlost();
 report=JSON.parse(storage.get('ck_graphics_loss_latest'));
 assert.equal(report.world,false);assert.equal(report.loss,2);
 assert.ok(storage.has('ck_graphics_loss_0')&&storage.has('ck_graphics_loss_1'));
 s.localStorage.setItem=()=>{throw Error('quota')};
 assert.doesNotThrow(()=>s.persistGraphicsLoss(world));
});
test('first draw proxy records each image once; memory estimate deduplicates surfaces and includes atlas/scratch',()=>{
 const {s,world}=fixture(),atlas={width:1536,height:1024},f={x:0,y:0,w:200,h:220,ax:100,ay:219};
 s.regAtlas('motion',atlas,{painted:true,motion:true,anims:{}});
 s.paintedTeamFrame(s.ASSET?.atl?.motion||{img:atlas,meta:{painted:true}},0,f);
 s.paintedTeamFrame({img:atlas,meta:{painted:true}},1,f);
 assert.equal(s.trace.atlasDraws.length,1);assert.equal(s.trace.frame.firstDrawMs,1);
 assert.equal(s.trace.frame.tints,2);assert.equal(s.trace.frame.readbackPixels,88000);
 const memory=s.graphicsSurfaceEstimate();
 assert.equal(memory.liveCanvases,4); // world, scratch, two tints
 assert.equal(memory.canvasBytes,(world.width*world.height+3*44000)*4);
 assert.equal(memory.atlasBytes,1536*1024*4);
 assert.equal(memory.nativeEstimateBytes,memory.canvasBytes+memory.atlasBytes);
 const [predictionKey,predictionCanvas]=s.cache.entries.entries().next().value;
 assert.equal(s.markTeamFramePrediction(predictionKey,predictionCanvas),true);
 const speculative=s.graphicsSurfaceEstimate();assert.equal(speculative.tintPredResident,1);assert.equal(speculative.tintPredPixels,44000);
 assert.equal(speculative.nativeEstimateBytes,memory.nativeEstimateBytes,'provenance is a subset, not extra native bytes');
 s.TINT_WARMUP={jobs:[],index:0,status:'pending',source:{pixels:{data:new Uint8ClampedArray(16)},original:new Uint8ClampedArray(16)},sourceReads:1,sourceReuses:2};
 const held=s.graphicsSurfaceEstimate();assert.equal(held.tintWarmSourceBytes,32);
 assert.equal(held.tintWarmSourceReads,1);assert.equal(held.tintWarmSourceReuses,2);
 assert.equal(held.nativeEstimateBytes,memory.nativeEstimateBytes+32);
 s.TINT_WARMUP.source=null;assert.equal(s.graphicsSurfaceEstimate().tintWarmSourceBytes,0);
 s.resetGraphicsTraceFrame();assert.equal(s.trace.frame.tints,0);assert.equal(s.cache.creations,2);
});
test('nested render batches retain, deduplicate, account and then release retired pixels',()=>{
 const {s}=fixture(),surface=s.document.createElement('canvas');surface.width=10;surface.height=20;
 s.beginGraphicsSurfaceUse();s.beginGraphicsSurfaceUse();
 s.retireGraphicsSurface(surface);s.retireGraphicsSurface(surface);
 assert.equal(s.lifetime.pending.size,1);assert.equal(s.lifetime.pixels,200);
 const memory=s.graphicsSurfaceEstimate();assert.equal(memory.retiredCanvases,1);assert.equal(memory.retiredBytes,800);
 s.endGraphicsSurfaceUse();assert.equal(surface.width,10,'inner batch cannot invalidate an outer descriptor');
 s.endGraphicsSurfaceUse();assert.equal(surface.width,1);assert.equal(surface.height,1);
 assert.equal(s.lifetime.pending.size,0);assert.equal(s.lifetime.pixels,0);assert.equal(s.trace.frame.surfaceReleases,1);
 assert.equal(s.trace.frame.releasePixels,199);
 const failures=s.lifetime.failures;
 s.retireGraphicsSurface({width:30,height:40});assert.equal(s.lifetime.failures,failures,'source images are not resized');
});
test('failed backing-store release is observable and never poisons later render batches',()=>{
 const {s}=fixture(),broken={getContext(){},get width(){return 10},set width(_){throw Error('unavailable')},height:20};
 s.beginGraphicsSurfaceUse();s.retireGraphicsSurface(broken);assert.doesNotThrow(()=>s.endGraphicsSurfaceUse());
 assert.equal(s.lifetime.depth,0);assert.equal(s.lifetime.pending.size,0);assert.equal(s.lifetime.failures,1);
 assert.equal(s.graphicsSurfaceEstimate().releaseFailures,1);
 const healthy=s.document.createElement('canvas');healthy.width=12;healthy.height=13;
 s.retireGraphicsSurface(healthy);assert.equal(healthy.width,1);assert.equal(healthy.height,1);
});
