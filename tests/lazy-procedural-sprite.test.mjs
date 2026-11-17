import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {headlessGame,graphicsSurfaceLifetimeSource,unitTintWorkspaceSource} from './helpers/headless-game.mjs';

function tintWarmFixture(frameCount=8,side=2){
 const colors=['#2277ee','#ee3322','#9944cc','#eebb33'];let clock=()=>0,allocations=0,failCanvas=false;
 const c={performance:{now:()=>clock()},teamColor:t=>colors[t],mode:'play',perfTestMatch:1,S:{teamN:4,us:[],civ:[]},CIV:[],U:{},
  USZ:()=>[4,4],spr(){},paintUnit(){},document:{createElement(){
   if(failCanvas)throw Error('canvas unavailable');allocations++;
   const canvas={width:0,height:0,addEventListener(){}};
   const ctx={isContextLost:()=>false,clearRect(){},drawImage(){},getImageData(x,y,w,h){
    const data=new Uint8ClampedArray(w*h*4);for(let i=0;i<data.length;i+=4)data.set([20,40,180,255],i);return {data};
   },putImageData(p){canvas.pixels=p.data.slice()}};
   canvas.getContext=()=>ctx;return canvas;
  }}};
 vm.createContext(c);
 const read=p=>readFileSync(new URL('../js/'+p+'.js',import.meta.url),'utf8');
 vm.runInContext(graphicsSurfaceLifetimeSource()+unitTintWorkspaceSource()+read('assets')+read('render-effects')+'\nObject.assign(globalThis,{q:TINT_WARMUP,p:TINT_PREDICTION,workspace:UNIT_TINT_WORKSPACE,cache:TEAM_FRAME_CACHE,pools:TEAM_FRAME_GROUPS,trace:GRAPHICS_TRACE,run:s=>eval(s)});',c);
 const frames=Array.from({length:frameCount},(_,i)=>({x:i*side,y:0,w:side,h:side,ax:side/2,ay:side-1}));
 const anims={};for(const team of[0,1,2,3])for(const state of['idle','walk','attack','work'])anims['mil/'+state+'/'+team]={dur:.1,frames:state==='idle'?[frames[0]]:frames};
 const image={width:frameCount*side,height:side},meta={painted:true,motion:true,anims};
 c.regAtlas('warm',image,meta);
 return {c,colors,image,meta,frames,get allocations(){return allocations},setClock(fn){clock=fn},fail(){failCanvas=true}};
}
function fallbackSpriteFixture(){
 const canvases=[],c={document:{createElement(){
  const canvas={width:0,height:0,lost:false,events:{},addEventListener(n,fn){this.events[n]=fn}};
  const context={scale(){},translate(){},isContextLost:()=>canvas.lost};canvas.context=context;canvas.getContext=()=>context;
  canvases.push(canvas);return canvas;
 }}};
 const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');vm.createContext(c);
 vm.runInContext(graphicsSurfaceLifetimeSource()+source.slice(source.indexOf('const SPC='),source.indexOf('function blit('))+'\nglobalThis.run=s=>eval(s);globalThis.sprites=SPC',c);
 return {c,canvases};
}
test('procedural eviction and clear keep leased pixels valid and retain oversized return values',()=>{
 const {c,canvases}=fallbackSpriteFixture();c.beginGraphicsSurfaceUse();c.beginGraphicsSurfaceUse();
 for(const key of['a','b','c','d'])c.spr(key,400,400,()=>{});
 assert.equal(c.sprites.size,3);assert.equal(canvases[0].width,800);
 c.clearProceduralSpriteCache();assert.equal(c.run('SPC_PIXELS'),0);assert.ok(canvases.every(cv=>cv.width===800));
 c.endGraphicsSurfaceUse();assert.equal(canvases[0].width,800);c.endGraphicsSurfaceUse();assert.ok(canvases.every(cv=>cv.width===1));
 const large=c.spr('oversize',1500,1500,()=>{});assert.equal(large.width,3000);assert.equal(c.sprites.size,0);
});
test('procedural hit health and identity-safe loss rebuild missing pixels before reuse',()=>{
 const {c}=fallbackSpriteFixture(),first=c.spr('same',20,30,()=>{});first.lost=true;
 const next=c.spr('same',20,30,()=>{});assert.notEqual(next,first);assert.equal(first.width,1);
 first.events.contextlost();assert.equal(c.sprites.get('same'),next);assert.equal(c.run('SPC_PIXELS'),40*60);
 c.beginGraphicsSurfaceUse();next.events.contextlost();assert.equal(c.sprites.size,0);assert.equal(c.run('SPC_PIXELS'),0);assert.equal(next.width,40);
 c.endGraphicsSurfaceUse();assert.equal(next.width,1);
});
test('failed procedural allocation or painting never retains its backing or a blank cached sprite',()=>{
 for(const phase of['null','before','paint','after']){
  const {c,canvases}=fallbackSpriteFixture(),create=c.document.createElement;
  c.document.createElement=()=>{const cv=create();if(phase==='null')cv.getContext=()=>null;if(phase==='before')cv.lost=true;return cv};
  c.beginGraphicsSurfaceUse();assert.throws(()=>c.spr('bad',20,30,()=>{
   if(phase==='paint')throw Error('paint rejected');if(phase==='after')canvases[0].lost=true;
  }),phase==='paint'?/paint rejected/:/Procedural sprite/);
  assert.equal(c.sprites.size,0);assert.equal(c.run('SPC_PIXELS'),0);assert.equal(canvases[0].width,40);
  c.endGraphicsSurfaceUse();assert.equal(canvases[0].width,1);
 }
});
test('actual recovery defers every derived cache backing while preserving source atlases and world state',()=>{
 const run=fixture();run(`clearGraphicsSurfaces();globalThis.held=Array.from({length:10},()=>{const c=document.createElement('canvas');c.width=64;c.height=32;return c});
  globalThis.originalAtlas=document.createElement('canvas');originalAtlas.width=64;originalAtlas.height=32;
  TEAM_FRAME_CACHE.entries.set('held',held[0]);TEAM_FRAME_CACHE.scratch=held[1];
  ASSET.atl.lifetime={img:originalAtlas,ok:true,meta:{anims:{}},teams:{1:held[2]}};
  TROOP_TEXTURE_LRU.set('held',held[3]);const frames=new Map([['held',held[4]]]);NODE_TEXTURE_RECENCY.set('held',{frames,key:'held',canvas:held[4]});
  BUILDING_DAMAGE_CACHE.entries.set('held',held[5]);BUILDING_LOD_CACHE.entries.set('held',held[6]);
  SPC.set('held',held[7]);SPC_PIXELS=2048;FOG_MASK_CACHE.canvas=held[8];TERRAIN_VIEW.canvas=held[9];
  beginGraphicsSurfaceUse();beginGraphicsSurfaceUse();`);
 const before=run('JSON.stringify(S)');run('clearGraphicsSurfaces()');
 assert.equal(run('held.every(c=>c.width===64&&c.height===32)'),true);
 assert.equal(run('graphicsSurfaceEstimate().retiredCanvases'),10);assert.equal(run('SPC.size+TROOP_TEXTURE_LRU.size+BUILDING_LOD_CACHE.entries.size+BUILDING_DAMAGE_CACHE.entries.size'),0);
 run('endGraphicsSurfaceUse()');assert.equal(run('held[0].width'),64);run('endGraphicsSurfaceUse()');
 assert.equal(run('held.every(c=>c.width===1&&c.height===1)'),true);assert.equal(run('graphicsSurfaceEstimate().retiredCanvases'),0);
 assert.equal(run('originalAtlas.width'),64);assert.equal(run('JSON.stringify(S)'),before);
});
test('scoped overflow caps retained tint creation while preserving every demanded palette and frame',()=>{
 const outcomes=[];
 for(const variant of['legacy','overflow','reuse']){
  const limited=variant!=='legacy',f=tintWarmFixture(),c=f.c,samples=[];
  c.workspace.enabled=limited;if(variant==='overflow')c.workspace.pixelLimit=0;
  let transient=0,totalTintWork=0,maxCached=0,reuses=0,readbackPixels=0;
  let kernelCalls=0;const kernel=c.tintPaintedPixels;c.tintPaintedPixels=(...args)=>{kernelCalls++;return kernel(...args)};
  for(let callback=0;callback<16;callback++){
   c.resetGraphicsTraceFrame();c.beginGraphicsSurfaceUse();
   for(let actor=0;actor<90;actor++){
    c.beginUnitTintScope();try{
     const phase=(((actor/4|0)%3+callback)%8)/8,team=actor%4;
     const art=c.assetFrame('mil',team,1,0,0,0,phase,false,limited);
     samples.push([team,art.sourceFrame.x,[...art.img.pixels]]);
    }finally{c.endUnitTintScope()}
   }
   c.endGraphicsSurfaceUse();maxCached=Math.max(maxCached,c.trace.frame.tints);
   assert.equal(c.workspace.pixelBytes,0);assert.equal(c.workspace.pixels.size,0);
   if(limited)assert.ok(c.trace.frame.tints<=4);
   reuses+=c.trace.frame.transientPixelHits;readbackPixels+=c.trace.frame.readbackPixels;
   transient+=c.trace.frame.transientTints;totalTintWork+=c.trace.frame.tints+c.trace.frame.transientTints-c.trace.frame.transientPixelHits;
  }
  assert.equal(c.workspace.depth,0);assert.equal(c.cache.creations,32);
  assert.equal(totalTintWork,kernelCalls,'operation counts match actual pure-kernel calls');
  if(limited){assert.equal(c.workspace.slots[0].tint.width,1);assert.equal(c.workspace.slots[0].tint.height,1)}
  outcomes.push({variant,samples,transient,totalTintWork,maxCached,reuses,readbackPixels});
 }
 assert.deepEqual(outcomes[1].samples,outcomes[0].samples);assert.equal(outcomes[0].maxCached,12);assert.equal(outcomes[1].maxCached,4);
 assert.equal(outcomes[0].totalTintWork,32);assert.ok(outcomes[1].totalTintWork>outcomes[0].totalTintWork,'uncached overflow has an explicit recolouring cost');
 assert.deepEqual(outcomes[2].samples,outcomes[0].samples);assert.equal(outcomes[2].maxCached,4);
 assert.equal(outcomes[2].transient,outcomes[1].transient,'pixel reuse does not reduce putImageData uploads');
 assert.ok(outcomes[2].totalTintWork<outcomes[1].totalTintWork);assert.ok(outcomes[2].readbackPixels<outcomes[1].readbackPixels);
 console.log('MOCK OVERFLOW COUNTS (not FPS)',JSON.stringify(outcomes.map(({samples,...counts})=>counts)));
});
test('batch pixel reuse isolates palette, frame and image identity and ends with the batch',()=>{
 const f=tintWarmFixture(),c=f.c;c.workspace.enabled=true;c.trace.frame.tints=4;
 const draw=(team=0,phase=0)=>{c.beginUnitTintScope();try{return c.assetFrame('mil',team,1,0,0,0,phase,false,true)}finally{c.endUnitTintScope()}};
 c.beginGraphicsSurfaceUse();
 const original=[...draw().img.pixels],read=c.trace.frame.readbackPixels;
 draw();assert.equal(c.trace.frame.readbackPixels,read);assert.equal(c.trace.frame.transientPixelHits,1);
 draw(1);draw(0,1/8);assert.equal(c.trace.frame.transientPixelHits,1);
 f.colors[0]='#ee3322';assert.notDeepEqual([...draw().img.pixels],original);assert.equal(c.trace.frame.transientPixelHits,1);
 c.regAtlas('warm',{width:16,height:2},f.meta);draw();assert.equal(c.trace.frame.transientPixelHits,1);
 assert.equal(c.workspace.pixels.size,5);assert.equal(c.workspace.pixelBytes,5*16);
 c.clearTeamFrameCache();assert.equal(c.workspace.pixelBytes,0);draw();
 c.endGraphicsSurfaceUse();assert.equal(c.workspace.pixelBytes,0);assert.equal(c.workspace.pixels.size,0);
 c.beginGraphicsSurfaceUse();draw();assert.equal(c.trace.frame.transientPixelHits,1);c.endGraphicsSurfaceUse();
});
test('batch pixel retention respects byte and entry quotas and never holds mutable preparation pixels',()=>{
 const f=tintWarmFixture(),c=f.c;c.workspace.enabled=true;c.trace.frame.tints=4;
 c.workspace.pixelLimit=32;c.workspace.pixelEntries=2;c.beginGraphicsSurfaceUse();c.beginUnitTintScope();
 try{
  for(let team=0;team<4;team++)c.assetFrame('mil',team,1,0,0,0,0,false,true);
  assert.equal(c.workspace.pixelBytes,32);assert.equal(c.workspace.pixels.size,2);assert.equal(c.trace.frame.transientPixelPeakBytes,32);
  const read=c.trace.frame.readbackPixels;c.assetFrame('mil',2,1,0,0,0,0,false,true);assert.equal(c.trace.frame.readbackPixels,read);
  c.assetFrame('mil',0,1,0,0,0,0,false,true);assert.equal(c.trace.frame.readbackPixels,read+4);
  c.clearUnitTintPixels();c.workspace.pixelLimit=15;
  c.assetFrame('mil',1,1,0,0,0,0,false,true);assert.equal(c.workspace.pixelBytes,0);
  c.workspace.pixelLimit=32;
  const source=c.readTeamFrameSource({img:f.image},f.frames[0]);source.original=source.pixels.data.slice();
  const result=c.paintedTeamFrame({img:f.image,meta:f.meta},1,f.frames[0],'mil',()=>source,true),pixels=[...result.img.pixels];
  assert.equal(c.workspace.pixelBytes,0,'shared working pixels must not enter the immutable index');
  source.pixels.data.fill(0);assert.deepEqual([...result.img.pixels],pixels,'putImageData owns the draw snapshot');
 }finally{c.endUnitTintScope();c.endGraphicsSurfaceUse()}
 assert.equal(c.workspace.pixelBytes,0);
});
test('temporary pixel bytes join the native estimate once and clear on recovery',()=>{
 const run=fixture(),state=run('JSON.stringify(S)'),before=run('graphicsSurfaceEstimate().nativeEstimateBytes');
 run(`rememberUnitTintPixels('first',{data:new Uint8ClampedArray(64)});rememberUnitTintPixels('second',{data:new Uint8ClampedArray(32)})`);
 assert.equal(run('graphicsSurfaceEstimate().unitTintPixelBytes'),96);
 assert.equal(run('graphicsSurfaceEstimate().nativeEstimateBytes'),before+96);
 run(`rememberUnitTintPixels('first',{data:new Uint8ClampedArray(16)})`);assert.equal(run('graphicsSurfaceEstimate().unitTintPixelBytes'),48);
 run('clearGraphicsSurfaces()');assert.equal(run('graphicsSurfaceEstimate().unitTintPixelBytes'),0);
 assert.equal(run('JSON.stringify(S)'),state);
});
test('nested overflow scopes preserve the outer image and release through exceptional exits',()=>{
 const f=tintWarmFixture(),c=f.c;c.workspace.enabled=true;c.trace.frame.tints=4;
 c.beginUnitTintScope();try{
  const first=c.assetFrame('mil',0,1,0,0,0,0,false,true),pixels=[...first.img.pixels];
  c.beginUnitTintScope();try{const second=c.assetFrame('mil',1,1,0,0,0,0,false,true);assert.notEqual(first.img,second.img)}finally{c.endUnitTintScope()}
  assert.deepEqual([...first.img.pixels],pixels);assert.equal(first.img.width,2);
 }finally{c.endUnitTintScope()}
 assert.equal(c.workspace.depth,0);assert.ok(c.workspace.slots.every(slot=>slot.tint.width===1));
 c.clearUnitTintWorkspaces();f.fail();c.beginUnitTintScope();try{
  assert.throws(()=>c.assetFrame('mil',0,1,0,0,0,0,false,true),/Temporary coloured unit artwork/);
 }finally{c.endUnitTintScope()}
 assert.equal(c.workspace.depth,0);
});
test('workspace clearing waits for a live lease and does not retain its backing pixels',()=>{
 const f=tintWarmFixture(),c=f.c;c.workspace.enabled=true;c.trace.frame.tints=4;
 c.beginGraphicsSurfaceUse();c.beginUnitTintScope();const frame=c.assetFrame('mil',0,1,0,0,0,0,false,true);
 c.clearUnitTintWorkspaces();assert.equal(frame.img.width,2);assert.equal(c.workspace.clearPending,true);
 c.endUnitTintScope();assert.equal(c.workspace.slots.length,0);assert.equal(frame.img.width,2,'outer render lifetime is still active');
 c.endGraphicsSurfaceUse();assert.equal(frame.img.width,1);assert.equal(c.workspace.depth,0);assert.equal(c.workspace.clearPending,false);
});
test('a failed real troop painter closes its transient lease before propagating the error',()=>{
 const run=fixture();run(`perfTestMatch=1;mode='pause';setUnitTintExperiment(true);mode='play';
  regAtlas('overflow',{width:2,height:2},{painted:true,anims:{'mil/idle/0':{frames:[{x:0,y:0,w:2,h:2,ax:1,ay:1}]}}});
  GRAPHICS_TRACE.frame.tints=4;drawPaintedTroop=()=>{throw Error('painter stopped')};`);
 const state=run('JSON.stringify(S)');assert.throws(()=>run('drawUnit(unit,new Set())'),/painter stopped/);
 assert.equal(run('UNIT_TINT_WORKSPACE.depth'),0);assert.equal(run('UNIT_TINT_WORKSPACE.slots[0].tint.width'),1);
 assert.equal(run('JSON.stringify(S)'),state);
});
test('mandatory online tint failure retains the existing frame error guard without drawing wrong-team fallback',()=>{
 const run=fixture();run(`regAtlas('colour-error',{width:2,height:2},{painted:true,anims:{'mil/idle/0':{frames:[{x:0,y:0,w:2,h:2,ax:1,ay:1}]}}});
  readTeamFrameSource=()=>null;window.CK_NET={isRunning:()=>true};frame2=()=>drawUnit(unit,new Set());`);
 const before=run('JSON.stringify(S)'),sprites=run('spriteRequests');run('frame(16)');
 assert.equal(run('mode'),'error');assert.match(run('CK_ERR.message'),/Team-colour artwork/);
 assert.equal(run('spriteRequests'),sprites);assert.equal(run('JSON.stringify(S)'),before);assert.equal(run('GRAPHICS_SURFACE_LIFETIME.depth'),0);
});
test('mandatory offline tint failure preserves the world in a paused manual retry gate',()=>{
 const run=fixture();run(`regAtlas('colour-error',{width:2,height:2},{painted:true,anims:{'mil/idle/0':{frames:[{x:0,y:0,w:2,h:2,ax:1,ay:1}]}}});
  mode='play';readTeamFrameSource=()=>null;frame2=()=>drawUnit(unit,new Set());`);
 const before=run('JSON.stringify(S)'),sprites=run('spriteRequests');run('frame(16)');
 assert.equal(run('mode'),'pause');assert.equal(run('CK_ERR'),null);assert.equal(run('GRAPHICS_RECOVERY.tintFailures'),1);
 assert.equal(run('GRAPHICS_RECOVERY.readiness.reason'),'tint');assert.equal(run('checkGraphicsRestoreReadiness()'),true);
 assert.equal(run('spriteRequests'),sprites);assert.equal(run('JSON.stringify(S)'),before);assert.equal(run('GRAPHICS_SURFACE_LIFETIME.depth'),0);
});
test('failed roster tints count late creations against the four-creation allowance and block readiness',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[0,1,2,3].map(t=>({k:'mil',t,hp:100}))},create=c.document.createElement;
 c.queueRosterTintWarmup(world);c.document.createElement=()=>{const cv=create();cv.addEventListener=()=>{throw Error('listener failed')};return cv};
 const before=JSON.stringify(c.S),step=c.advanceRosterTintWarmup();assert.equal(step.created,4);assert.equal(step.attempts,4);
 assert.equal(c.q.failed,4);assert.equal(c.q.status,'pending');assert.equal(c.cache.entries.size,0);assert.equal(c.trace.frame.warmCreations,4);
 assert.equal(c.rosterTintWarmupReadiness(world).ready,false);assert.equal(JSON.stringify(c.S),before);
});
test('failed speculative tints are skipped without poisoning demand or accepting an untinted result',()=>{
 const f=tintWarmFixture(),c=f.c,create=c.document.createElement;
 c.assetFrame('mil',0,1,0,0,0,0,true);assert.equal(c.p.jobs.size,1);
 c.document.createElement=()=>{const cv=create();cv.addEventListener=()=>{throw Error('listener failed')};return cv};
 const before=JSON.stringify(c.S),step=c.advanceTintPredictions();assert.equal(step.created,1);assert.equal(step.attempts,1);
 assert.equal(c.p.skipped,1);assert.equal(c.p.jobs.size,0);assert.equal(c.pools.troop.predicted.size,0);assert.equal(c.cache.entries.size,1);
 assert.throws(()=>c.assetFrame('mil',0,1,0,0,0,1/8),{code:'CK_TEAM_TINT_UNAVAILABLE'});assert.equal(JSON.stringify(c.S),before);
});
test('background tint preparation does not swallow unrelated programming errors',()=>{
 const roster=tintWarmFixture();roster.c.queueRosterTintWarmup({teamN:1,us:[{k:'mil',t:0,hp:100}]});
 roster.c.paintedTeamFrame=()=>{throw Error('unexpected roster failure')};assert.throws(()=>roster.c.advanceRosterTintWarmup(),/unexpected roster failure/);
 const predicted=tintWarmFixture();predicted.c.assetFrame('mil',0,1,0,0,0,0,true);
 predicted.c.paintedTeamFrame=()=>{throw Error('unexpected prediction failure')};assert.throws(()=>predicted.c.advanceTintPredictions(),/unexpected prediction failure/);
});
test('next-frame hints move cold tint work before drawing without changing colours, poses or total creations',()=>{
 const results=[];
 for(const predict of[false,true]){
  const f=tintWarmFixture(),c=f.c,saved=JSON.stringify(c.S),samples=[];
  let drawCreations=0,prepared=0,readbackPixels=0;
  for(let callback=0;callback<24;callback++){
   c.trace.sequence=callback;c.resetGraphicsTraceFrame();c.warm();
   assert.ok(c.trace.frame.warmCreations<=4);prepared+=c.trace.frame.predictCreations;
   const before=c.cache.creations;
   for(let team=0;team<4;team++){
    const frame=c.assetFrame('mil',team,1,0,0,0,(callback%8)/8,predict);
    samples.push([team,frame.sourceFrame.x,[...frame.img.pixels]]);
   }
   drawCreations+=c.cache.creations-before;readbackPixels+=c.trace.frame.readbackPixels;
   assert.equal(c.q.source,null,'prediction source pixels do not leak into the roster owner');
  }
  assert.equal(JSON.stringify(c.S),saved);assert.equal(c.cache.creations,32);assert.equal(c.cache.evictions,0);
  results.push({drawCreations,prepared,readbackPixels,samples});
 }
 assert.equal(results[0].drawCreations,32);assert.equal(results[1].drawCreations,4);assert.equal(results[1].prepared,28);
 assert.equal(results[0].readbackPixels,128);assert.equal(results[1].readbackPixels,44);
 assert.deepEqual(results[1].samples,results[0].samples);
});
test('prediction uses spare quota only and never evicts resident native tints',()=>{
 const f=tintWarmFixture(),c=f.c;c.pools.troop.limit=4;
 c.assetFrame('mil',0,1,0,0,0,0,true);const before=f.allocations,keys=[...c.cache.entries.keys()];
 assert.equal(c.p.jobs.size,1);assert.equal(c.advanceTintPredictions().created,0);
 assert.equal(c.p.skipped,1);assert.equal(f.allocations,before);assert.deepEqual([...c.cache.entries.keys()],keys);assert.equal(c.cache.evictions,0);
 const needed=c.assetFrame('mil',0,1,0,0,0,1/8);
 assert.deepEqual([...needed.img.pixels.slice(0,4)],[23,80,159,255]);assert.equal(needed.img.width,2);
});
test('prediction preparation marks unused pixels and a real request claims them without recolouring',()=>{
 const f=tintWarmFixture(),c=f.c;c.assetFrame('mil',0,1,0,0,0,0,true);
 const job=c.p.jobs.values().next().value;assert.equal(c.advanceTintPredictions().created,1);
 const hinted=c.cache.entries.get(job.cacheKey);assert.equal(c.pools.troop.predicted.get(job.cacheKey),hinted);
 assert.equal(c.pools.troop.predictedPixels,4);assert.equal(c.cache.predictionClaims,0);
 const before=c.cache.creations,needed=c.assetFrame('mil',0,1,0,0,0,1/8);
 assert.equal(needed.img,hinted);assert.equal(c.cache.creations,before);assert.equal(c.cache.predictionClaims,1);
 assert.equal(c.pools.troop.predicted.size,0);assert.equal(c.pools.troop.predictedPixels,0);
 assert.deepEqual([...needed.img.pixels.slice(0,4)],[23,80,159,255]);
});
test('roster and prediction share four creations and the existing soft preparation window',()=>{
 const f=tintWarmFixture(),c=f.c;c.S.us=[{k:'mil',t:0,hp:1}];c.queueRosterTintWarmup(c.S);
 for(let i=0;i<7;i++)c.advanceRosterTintWarmup(3,1);
 for(const [team,phase]of[[1,2/8],[2,2/8],[3,2/8],[1,4/8]])c.assetFrame('mil',team,1,0,0,0,phase,true);
 c.resetGraphicsTraceFrame();c.warm();assert.equal(c.q.status,'drained');assert.equal(c.trace.frame.warmCreations,4);
 assert.equal(c.trace.frame.predictCreations,3);assert.equal(c.p.jobs.size,1);assert.equal(c.p.capHits,1);
 let clock=0;f.setClock(()=>clock++);c.resetGraphicsTraceFrame();c.warm();assert.equal(c.trace.frame.predictCreations,0,'prediction waits after the shared soft window expires');
});
test('prediction deduplicates hints, expires stale sources and bounds metadata and cache-hit work',()=>{
 const f=tintWarmFixture(),c=f.c;
 for(let i=0;i<20;i++)c.assetFrame('mil',0,1,0,0,0,0,true);
 assert.equal(c.p.jobs.size,1);c.trace.sequence=3;assert.equal(c.advanceTintPredictions().created,0);assert.equal(c.p.expired,1);
 c.assetFrame('mil',0,1,0,0,0,0,true);f.colors[0]='#ffffff';assert.equal(c.advanceTintPredictions().created,0);assert.equal(c.p.expired,2);
 const many=tintWarmFixture(256,1),m=many.c;
 for(let i=0;i<256;i++)m.assetFrame('mil',0,1,0,0,0,i/256,true);
 assert.equal(m.p.jobs.size,128);assert.ok(m.p.skipped>0);
 for(const args of[[0,4],[3,0],[NaN,4],[3,Infinity]])assert.equal(m.advanceTintPredictions(...args).attempts,0);
 const allocations=many.allocations,step=m.advanceTintPredictions();assert.equal(step.attempts,64);assert.equal(step.created,0);
 assert.equal(many.allocations,allocations);assert.equal(m.p.jobs.size,64);
});
test('prediction ignores previews, paused/online/restore modes and another world',()=>{
 const f=tintWarmFixture(),c=f.c;
 c.assetFrame('mil',0,1,0,0,0,0);assert.equal(c.p.jobs.size,0,'ordinary atlas queries are not prediction observations');
 for(const mode of['pause','title']){c.mode=mode;c.assetFrame('mil',0,1,0,0,0,0,true);assert.equal(c.p.jobs.size,0)}
 c.mode='play';c.window={CK_NET:{isRunning:()=>true}};c.assetFrame('mil',0,1,0,0,0,0,true);assert.equal(c.p.jobs.size,0);
 c.window={};c.graphicsRestorePending=()=>true;c.assetFrame('mil',0,1,0,0,0,0,true);assert.equal(c.p.jobs.size,0);
 c.graphicsRestorePending=()=>false;c.assetFrame('mil',0,1,0,0,0,0,true);assert.equal(c.p.jobs.size,1);
 c.S={teamN:4,us:[]};assert.equal(c.advanceTintPredictions().created,0);assert.equal(c.p.jobs.size,0);assert.equal(c.p.world,null);
});
test('production troop drawing observes hints without re-evaluating presentation poses during preparation',()=>{
 const run=fixture();
 run(`const frames=Array.from({length:8},(_,i)=>({x:i*2,y:0,w:2,h:2,ax:1,ay:1}));
  regAtlas('observed',{width:16,height:2},{painted:true,motion:true,anims:{
   'mil/walk/0':{frames,dur:.1},'mil/idle/0':{frames:[frames[0]]}
  }});cancelRosterTintWarmup();unit.p=[[21,20]];`);
 const world=run('JSON.stringify([unit,building])');
 run('assetFrame("mil",0,1,0,0)');assert.equal(run('TINT_PREDICTION.jobs.size'),0);
 run('drawUnit(unit,new Set())');assert.equal(run('TINT_PREDICTION.jobs.size'),1);
 const pose=run('JSON.stringify(PAINT.motion.get(unit))');run('warm()');
 assert.equal(run('JSON.stringify(PAINT.motion.get(unit))'),pose);assert.equal(run('JSON.stringify([unit,building])'),world);
});
test('prediction follows the selected direction and wraps only within that animation list',()=>{
 const f=tintWarmFixture(),c=f.c;
 f.meta.anims['mil/walk/0']={dirs:[f.frames.slice(0,4),f.frames.slice(4,8)],dur:.1};c.regAtlas('warm',f.image,f.meta);
 const current=c.assetFrame('mil',0,1,0,0,Math.PI,3/4,true);assert.equal(current.sourceFrame.x,14);
 assert.equal(c.p.jobs.size,1);assert.equal(c.p.jobs.values().next().value.frame.x,8);
 assert.equal(c.advanceTintPredictions().created,1);const created=c.cache.creations;
 assert.equal(c.assetFrame('mil',0,1,0,0,Math.PI,0).sourceFrame.x,8);assert.equal(c.cache.creations,created);
});
test('native warm-up plans only live roster pairs, deduplicates frames and caps new tints per callback',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[
  {k:'mil',t:0,hp:10},{k:'mil',t:0,hp:10},{k:'mil',t:2,hp:10},
  {k:'mil',t:1,hp:0},{k:'mil',t:3,hp:10,ld:1},{k:'mil',t:8,hp:10}
 ]},before=JSON.stringify(world);
 c.queueRosterTintWarmup(world);assert.equal(f.allocations,0,'planning performs no pixel work');
 assert.equal(c.q.total,16);assert.deepEqual([...new Set(c.q.jobs.map(j=>j.team))].sort(),[0,2]);
 let callbacks=0;
 while(c.q.status==='pending'){
  c.resetGraphicsTraceFrame();const result=c.advanceRosterTintWarmup(3,1000);
  assert.ok(result.created<=4);assert.equal(c.trace.frame.warmCreations,result.created);callbacks++;
 }
 assert.equal(callbacks,4);assert.equal(c.q.creations,16);assert.equal(c.q.failed,0);assert.equal(c.q.capHits,3);
 const creations=c.cache.creations;
 for(const team of[0,2])for(let i=0;i<8;i++)assert.notEqual(c.assetFrame('mil',team,1,0,0,0,i/8).img,f.image);
 assert.equal(c.cache.creations,creations,'planned motion frames are cache hits after draining');
 c.queueRosterTintWarmup(world);assert.equal(c.advanceRosterTintWarmup().created,0);assert.equal(c.q.status,'drained');
 assert.equal(JSON.stringify(world),before,'preparation never mutates the world');
});
test('preparation shares one raw read across teams and callbacks without mixing palettes',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[0,1,2,3].map(t=>({k:'mil',t,hp:1}))};
 c.queueRosterTintWarmup(world);
 const expected=[];
 for(const color of f.colors){const bytes=new Uint8ClampedArray([20,40,180,255]);c.tintPaintedPixels(bytes,color);expected.push([...bytes])}
 let callbacks=0;
 while(c.q.status==='pending'){
  assert.equal(c.advanceRosterTintWarmup(3,1).created,1);callbacks++;
  if(callbacks===1){assert.equal(c.q.sourceReads,1);assert.equal(c.q.source.original.byteLength,16);assert.equal(c.q.source.pixels.data.byteLength,16)}
 }
 assert.equal(callbacks,32);assert.equal(c.q.sourceReads,8);assert.equal(c.q.sourceReuses,24);
 assert.equal(c.trace.frame.readbackPixels,32);assert.equal(c.q.source,null);
 for(const team of[0,1,2,3])for(const frame of f.frames){
  const result=c.paintedTeamFrame(c.run('ASSET.atl.warm'),team,frame,'mil');
  assert.deepEqual([...result.img.pixels.slice(0,4)],expected[team]);
 }
 c.queueRosterTintWarmup(world);c.advanceRosterTintWarmup();
 assert.equal(c.q.sourceReads,0);assert.equal(c.q.sourceReuses,0,'healthy cache hits never ask for source pixels');
});
test('pending source buffers are released on cancellation, replan and graphics reset',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[0,1].map(t=>({k:'mil',t,hp:1}))};
 const hold=()=>{c.clearTeamFrameCache();c.queueRosterTintWarmup(world);c.advanceRosterTintWarmup(3,1);assert.ok(c.q.source)};
 hold();c.cancelRosterTintWarmup();assert.equal(c.q.source,null);assert.equal(c.q.sourceKey,null);
 hold();c.queueRosterTintWarmup(world);assert.equal(c.q.source,null);assert.equal(c.q.sourceReads,0);
 hold();c.clearTeamFrameCache();assert.equal(c.q.source,null);
});
test('shared source validation falls back to a fresh read for another image or rectangle',()=>{
 const f=tintWarmFixture(),c=f.c,atlas=c.run('ASSET.atl.warm');
 for(const mismatch of[{img:{}},{x:123}]){
  const source=c.readTeamFrameSource(atlas,f.frames[0]);source.original=source.pixels.data.slice();Object.assign(source,mismatch);
  c.clearTeamFrameCache();const before=c.trace.frame.readbackPixels;
  const result=c.paintedTeamFrame(atlas,0,f.frames[0],'mil',()=>source);
  assert.equal(c.trace.frame.readbackPixels-before,4);assert.deepEqual([...result.img.pixels.slice(0,4)],[23,80,159,255]);
 }
});
test('native readiness checks retained healthy frames without allocations or LRU changes',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[0,1].map(t=>({k:'mil',t,hp:1}))};
 c.queueRosterTintWarmup(world);assert.equal(c.rosterTintWarmupReadiness(world).state,'pending');
 while(c.q.status==='pending')c.advanceRosterTintWarmup();
 const allocations=f.allocations,keys=[...c.cache.entries.keys()],creations=c.cache.creations;
 assert.equal(c.q.required.length,16);assert.equal(c.q.jobs.length,0);
 const ready=c.rosterTintWarmupReadiness(world);assert.equal(ready.ready,true);assert.equal(ready.resident,16);
 assert.equal(c.rosterTintWarmupReadiness({...world}).reason,'changed');
 const canvas=c.cache.entries.values().next().value;canvas.getContext().isContextLost=()=>true;
 assert.equal(c.rosterTintWarmupReadiness(world).reason,'missing');
 canvas.getContext().isContextLost=()=>false;canvas.width=1;
 assert.equal(c.rosterTintWarmupReadiness(world).ready,false);canvas.width=2;
 assert.equal(c.rosterTintWarmupReadiness(world).ready,true);
 assert.deepEqual([...c.cache.entries.keys()],keys);assert.equal(c.cache.creations,creations);assert.equal(f.allocations,allocations);
 c.clearTeamFrameCache();assert.equal(c.rosterTintWarmupReadiness(world).reason,'missing');
 c.cancelRosterTintWarmup();assert.equal(c.q.required.length,0);assert.equal(c.q.world,null);
});
test('drained capacity-truncated or failed preparation never reports ready',()=>{
 const world={teamN:4,us:[{k:'mil',t:0,hp:1}]};
 const capped=tintWarmFixture(),c=capped.c;c.pools.troop.limit=4;c.queueRosterTintWarmup(world);
 while(c.q.status==='pending')c.advanceRosterTintWarmup();
 assert.equal(c.q.status,'drained');assert.ok(c.q.skipped>0);assert.equal(c.rosterTintWarmupReadiness(world).reason,'incomplete');
 const failed=tintWarmFixture();failed.c.queueRosterTintWarmup(world);failed.fail();failed.c.advanceRosterTintWarmup();
 assert.equal(failed.c.q.status,'drained');assert.equal(failed.c.rosterTintWarmupReadiness(world).reason,'failed');
});
test('readiness rejects stale palette, atlas metadata and source geometry after preparation',()=>{
 for(const change of['palette','metadata','geometry']){
  const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[{k:'mil',t:0,hp:1}]};
  c.queueRosterTintWarmup(world);while(c.q.status==='pending')c.advanceRosterTintWarmup();
  if(change==='palette')f.colors[0]='#ffffff';
  if(change==='metadata')f.meta.anims['mil/walk/0']={...f.meta.anims['mil/walk/0']};
  if(change==='geometry')f.frames[0].x++;
  assert.equal(c.rosterTintWarmupReadiness(world).reason,'changed',change);
 }
});
test('warm-up is capacity-aware and uncached poses still draw in their exact native team palette',()=>{
 const f=tintWarmFixture(),c=f.c;c.cache.limit=c.pools.troop.limit=16;
 c.queueRosterTintWarmup({teamN:4,us:[{k:'mil',t:0,hp:1}]});
 assert.equal(c.q.plannedPixels,16);assert.equal(c.q.total,4);assert.ok(c.q.skipped>0);
 c.advanceRosterTintWarmup();assert.equal(c.q.status,'drained');
 const result=c.assetFrame('mil',0,1,0,0,0,7/8);
 assert.notEqual(result.img,f.image);assert.equal(result.img.width,2);assert.equal(result.img.height,2);
 assert.deepEqual([...result.img.pixels.slice(0,4)],[23,80,159,255]);
 assert.ok(c.cache.pixels<=16,'normal rendering respects admission limits without a wrong-colour placeholder');
});
test('warm-up time and cache-hit work are bounded and invalid budgets do no work',()=>{
 const f=tintWarmFixture(100,1),c=f.c,world={teamN:4,us:[{k:'mil',t:0,hp:1}]};
 c.queueRosterTintWarmup(world);
 for(const args of[[0,4],[3,0],[NaN,4],[3,Infinity]])assert.equal(c.advanceRosterTintWarmup(...args).attempts,0);
 let clock=0;f.setClock(()=>clock++);const result=c.advanceRosterTintWarmup();assert.ok(result.created<=1);assert.ok(c.q.index<c.q.total);
 f.setClock(()=>0);while(c.q.status==='pending')c.advanceRosterTintWarmup();
 c.queueRosterTintWarmup(world);const hits=c.advanceRosterTintWarmup();
 assert.equal(hits.created,0);assert.equal(hits.attempts,64);assert.equal(c.q.status,'pending');
 assert.equal(c.advanceRosterTintWarmup().attempts,36);assert.equal(c.q.status,'drained');
});
test('warm-up drops stale palette/atlas jobs, reports allocation failures and bounds metadata scanning',()=>{
 const f=tintWarmFixture(),c=f.c,world={teamN:4,us:[{k:'mil',t:0,hp:1}]};
 c.queueRosterTintWarmup(world);f.colors[0]='#ff33aa';c.advanceRosterTintWarmup();
 assert.equal(c.q.stale,8);assert.equal(c.cache.creations,0);
 c.queueRosterTintWarmup(world);delete c.S;c.regAtlas('warm',{width:16,height:2},f.meta);
 c.advanceRosterTintWarmup();assert.equal(c.q.stale,8);assert.equal(c.cache.creations,0);
 c.queueRosterTintWarmup(world);f.fail();c.advanceRosterTintWarmup();assert.equal(c.q.failed,8);assert.equal(c.q.status,'drained');
 const large=tintWarmFixture(10000,1);large.c.queueRosterTintWarmup(world);
 assert.equal(large.c.q.scanned,8192);assert.equal(large.c.q.total,512);assert.ok(large.c.q.skipped>0);
});
test('atlas readiness replaces the current plan and menu rendering cancels unused preparation',()=>{
 const f=tintWarmFixture(),c=f.c;c.S.us=[{k:'mil',t:0,hp:1}];
 const replacement={width:16,height:2};c.regAtlas('warm',replacement,f.meta);
 assert.equal(c.q.status,'pending');assert.ok(c.q.jobs.every(j=>j.atlas.img===replacement));assert.equal(f.allocations,0);
 c.mode='title';c.warm();assert.equal(c.q.status,'cancelled');assert.equal(c.q.jobs.length,0);assert.equal(c.cache.creations,0);
});
test('native and procedural preparation share the existing soft time window',()=>{
 const f=tintWarmFixture(),c=f.c;c.queueRosterTintWarmup({teamN:4,us:[{k:'mil',t:0,hp:1}]});
 let clock=0,fallback=0;f.setClock(()=>clock++);c.spr=()=>{fallback++};c.run('WQ=[["missing",0,0,0]]');c.warm();
 assert.ok(c.q.creations<=1);assert.equal(fallback,0,'procedural work waits when native preparation used the time window');
});

const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
const forces=pack.atlases.find(a=>a.id==='painted-forces');
const architecture=pack.atlases.find(a=>a.id==='painted-architecture');
assert.ok(forces?.meta.anims['mil/idle/0']&&architecture?.meta.anims['bld_house/work/0']);

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+'\n'+
  'globalThis.evaluate=code=>eval(code);globalThis.spriteRequests=0;const realSprite=spr;spr=function(...args){spriteRequests++;return realSprite(...args)};',sandbox);
 const run=sandbox.evaluate;
 run("start();globalThis.unit=addU(0,'mil',20,20);globalThis.building={k:'house',t:0,x:19,y:19,s:B.house.s,done:true,pr:B.house.bt,hp:120,mh:120,q:[]};spriteRequests=0");
 return run;
}
function register(run,atlas,id){
 run("regAtlas("+JSON.stringify(id)+",{width:1,height:1},"+JSON.stringify(atlas.meta)+")");
}

test('painted unit and building draw without creating unused procedural sprites',()=>{
 const run=fixture();
 register(run,forces,'forces');
 register(run,architecture,'architecture');
 const oldHash=run('JSON.stringify([unit,building])'),before=run('SPC.size');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),0,'atlas-backed units and buildings must not even request a fallback');
 assert.equal(run('SPC.size'),before,'no unused canvas allocations in sprite cache');
 assert.ok(run('ASSET.hits')>=2,'actual production atlas renderer was exercised');
 assert.equal(run('JSON.stringify([unit,building])'),oldHash,'rendering must not change gameplay');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),0,'subsequent animation frames stay on the art path');
});

test('when painted atlases disappear, both renderers recreate their procedural fallbacks',()=>{
 const run=fixture();
 register(run,forces,'forces');
 register(run,architecture,'architecture');
 run('drawUnit(unit,new Set());drawBld(building);ASSET.atl={};ASSET.n=0;spriteRequests=0');
 const before=run('SPC.size');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),2,'both missing art entries must reach procedural sprites');
 assert.ok(run('SPC.size')>=before+2,'missing art constructs the needed cached canvases');
});

test('partial atlas loading preserves fallback for only the missing building',()=>{
 const run=fixture();
 register(run,forces,'forces');
 run('drawUnit(unit,new Set());drawBld(building)');
 assert.equal(run('spriteRequests'),1,'painted troop uses atlas; unavailable house uses fallback');
 assert.ok(run('ASSET.hits')>=1&&run('ASSET.miss')>=1);
});

test('procedural fallback textures obey an 8 MiB LRU and refresh on demand',()=>{
 const run=fixture();
 run('clearProceduralSpriteCache();globalThis.spriteA=spr("a",400,400,()=>{});spr("b",400,400,()=>{});spr("c",400,400,()=>{})');
 assert.equal(run('SPC.size'),3);
 assert.equal(run('SPC_PIXELS'),3*400*400*4);
 run('spr("b",400,400,()=>{});spr("d",400,400,()=>{})');
 assert.equal(run('SPC.has("a")'),false,'the oldest unused sprite is evicted');
 assert.equal(run('SPC.has("b")'),true,'recently-used sprite is retained');
 assert.ok(run('SPC_PIXELS')<=run('SPC_PIXEL_LIMIT'));
 assert.equal(run('SPC.size'),3);
 run('spr("a",400,400,()=>{})');
 assert.equal(run('SPC.has("a")'),true,'evicted fallback artwork is reconstructed');
 assert.equal(run('SPC.get("a")===spriteA'),false);
 const before=run('SPC.size');
 assert.equal(run('spr("oversize",1500,1500,()=>{}).width'),3000);
 assert.equal(run('SPC.size'),before,'oversized art renders without entering the cache');
 assert.ok(run('SPC_PIXELS')<=run('SPC_PIXEL_LIMIT'));
 run('clearProceduralSpriteCache()');
 assert.equal(run('SPC.size'),0);
 assert.equal(run('SPC_PIXELS'),0,'atlas reload clears accounting too');
});

test('loading a material texture invalidates both fallback sprites and their pixel accounting',()=>{
 const run=fixture();
 run('clearProceduralSpriteCache();spr("old-material",400,400,()=>{});globalThis.loadedMaterial=null;globalThis.Image=class {set src(path){globalThis.loadedMaterial=this}};loadCKTexture("stone","test://stone")');
 assert.equal(run('SPC.size'),1);
 assert.equal(run('SPC_PIXELS'),640000);
 run('loadedMaterial.onload()');
 assert.equal(run('CK_TEX.stone===loadedMaterial'),true,'loaded material is available for replacement art');
 assert.equal(run('SPC.size'),0,'stale material fallback textures are removed');
 assert.equal(run('SPC_PIXELS'),0,'evicted pixels do not remain counted after the image loads');
 run('spr("fresh-material",400,400,()=>{})');
 assert.equal(run('SPC.size'),1,'fresh textured fallback can enter the cache');
 assert.equal(run('SPC_PIXELS'),640000,'new fallback accounts for only its own pixels');
});
