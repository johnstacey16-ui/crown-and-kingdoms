import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkTintFailurePolicy(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,create=document.createElement;
  const source=document.createElement('canvas');source.width=source.height=2;
  source.getContext('2d').fillStyle='#2277ee';source.getContext('2d').fillRect(0,0,2,2);
  const atlas={img:source,meta:{painted:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:1},codes=[];
  const entries=TEAM_FRAME_CACHE.entries.size;
  try{
   document.createElement=()=>{throw Error('Injected tint allocation failure')};
   for(const draw of[()=>paintedTeamFrame(atlas,1,frame,'mil'),()=>paintedTeamImage(atlas,1),()=>paintedTeamFrame(atlas,1,{...frame,x:.5},'mil')]){
    try{draw();codes.push('no-error')}catch(error){codes.push(error.code||error.message)}
   }
   return {before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,codes,entries,afterEntries:TEAM_FRAME_CACHE.entries.size,
    sourceWidth:source.width,poisoned:Object.values(atlas.teams||{}).includes(source)};
  }finally{document.createElement=create;source.width=source.height=1}
 });
 assert.equal(result.before,result.after);assert.deepEqual(result.codes,Array(3).fill('CK_TEAM_TINT_UNAVAILABLE'));
 assert.equal(result.entries,result.afterEntries);assert.equal(result.sourceWidth,2);assert.equal(result.poisoned,false);return result;
}
export async function checkSurfaceLifetime(page){
 const result=await page.evaluate(()=>{
  const key='surface-lifetime-probe',source=spr(key,16,12,()=>{});
  const sg=source.getContext('2d');sg.setTransform(1,0,0,1,0,0);sg.fillStyle='rgba(20,70,210,.7)';sg.fillRect(0,0,32,24);
  sg.fillStyle='#e8bb33';sg.fillRect(5,3,17,15);
  const reference=document.createElement('canvas'),output=document.createElement('canvas');
  reference.width=32;reference.height=24;output.width=64;output.height=24;
  const expected=reference.getContext('2d'),actual=output.getContext('2d');
  for(const ctx of[expected,actual]){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high'}
  expected.drawImage(source,0,0,32,24);
  const pixels=expected.getImageData(0,0,32,24).data;
  let pendingWidth;
  beginGraphicsSurfaceUse();
  try{
   actual.drawImage(source,0,0,32,24);
   discardProceduralSprite(key,source);pendingWidth=source.width;
   actual.drawImage(source,32,0,32,24); // An outstanding descriptor in the same batch.
  }finally{endGraphicsSurfaceUse()}
  // Do not synchronize the submitted output draws before source release.
  const drawn=actual.getImageData(0,0,64,24).data;let differences=0,coloured=0;
  for(let y=0;y<24;y++)for(let x=0;x<64;x++)for(let channel=0;channel<4;channel++){
   const index=(y*64+x)*4+channel;
   if(drawn[index]!==pixels[(y*32+x%32)*4+channel])differences++;
   if(channel===3&&drawn[index])coloured++;
  }
  const result={pendingWidth,releasedWidth:source.width,releasedHeight:source.height,differences,coloured,
   pendingSurfaces:GRAPHICS_SURFACE_LIFETIME.pending.size,depth:GRAPHICS_SURFACE_LIFETIME.depth,proceduralRemoved:!SPC.has(key)};
  reference.width=reference.height=output.width=output.height=1;
  return result;
 });
 assert.equal(result.pendingWidth,32);assert.equal(result.releasedWidth,1);assert.equal(result.releasedHeight,1);
 assert.equal(result.differences,0);assert.ok(result.coloured>0);assert.equal(result.pendingSurfaces,0);assert.equal(result.depth,0);
 assert.equal(result.proceduralRemoved,true);
 console.log('surface-release-diagnostic: '+JSON.stringify(result));return result;
}
export async function checkFrameTints(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,c=TEAM_FRAME_CACHE;clearTeamFrameCache();
  const start=c.creations;let frames=0,components=0,nativeDifferences=0,scaledDifferences=0,legacyPixels=0,peak=0,atlases=0;
  const nativeSamples=[];let mirrorComparisons=0,mirrorMaxDelta=0,identityCopyMaxDelta=0;
  const checkMirror=(art,factor)=>{
   const f=art.f,frame=troopFrameTexture(art,false,1);
   const flipped=document.createElement('canvas');flipped.width=frame.width;flipped.height=frame.height;
   const flip=flipped.getContext('2d');flip.imageSmoothingEnabled=true;flip.imageSmoothingQuality='high';
   flip.translate(frame.width,0);flip.scale(-1,1);flip.drawImage(frame,0,0,frame.width,frame.height,0,0,frame.width,frame.height);
   // Control for an extra 1:1 high-quality copy, independently of reflection.
   const identity=document.createElement('canvas');identity.width=frame.width;identity.height=frame.height;
   const identityContext=identity.getContext('2d');identityContext.imageSmoothingEnabled=true;identityContext.imageSmoothingQuality='high';
   identityContext.drawImage(frame,0,0,frame.width,frame.height,0,0,frame.width,frame.height);
   const originalPixels=frame.getContext('2d').getImageData(0,0,frame.width,frame.height).data;
   const copiedPixels=identityContext.getImageData(0,0,frame.width,frame.height).data;
   for(let i=0;i<originalPixels.length;i++)identityCopyMaxDelta=Math.max(identityCopyMaxDelta,Math.abs(originalPixels[i]-copiedPixels[i]));
   identity.width=identity.height=1;
   const expected=document.createElement('canvas'),actual=document.createElement('canvas');
   expected.width=actual.width=1024;expected.height=actual.height=1024;
   const old=expected.getContext('2d'),now=actual.getContext('2d');
   for(const ctx of[old,now]){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high'}
   const scale=Math.min(180/f.w,180/f.h)*factor,x=500.25,y=900.5;
   old.drawImage(flipped,x-(f.w-f.ax)*scale,y-f.ay*scale,f.w*scale,f.h*scale);
   const savedZoom=zm;
   try{zm=2.05;drawPaintedTroop(now,{...art,animated:true},x,y,scale,1,0,true,'mil')}
   finally{zm=savedZoom}
   const a=old.getImageData(0,0,1024,1024).data,b=now.getImageData(0,0,1024,1024).data;
   for(let i=0;i<a.length;i++)mirrorMaxDelta=Math.max(mirrorMaxDelta,Math.abs(a[i]-b[i]));
   mirrorComparisons++;flipped.width=flipped.height=expected.width=expected.height=actual.width=actual.height=1;
  };
  const scaled=(image,f,mirror,factor)=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const g=canvas.getContext('2d');
   const scale=Math.min(128/f.w,128/f.h)*factor;g.translate(160,310);g.scale(mirror?-scale:scale,scale);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
   g.drawImage(image,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);return g.getImageData(0,0,320,320).data;
  };
  for(const [atlasId,a] of Object.entries(ASSET.atl))if(a.ok&&a.meta.painted&&!a.meta.neutral){
   atlases++;const unique=new Map();for(const animation of Object.values(a.meta.anims))for(const list of animation.dirs||[animation.frames])for(const f of list)unique.set([f.x,f.y,f.w,f.h].join('/'),f);
   const list=[...unique.values()];
   for(let team=0;team<4;team++){
    const legacy=paintedTeamImage(a,team),ctx=legacy.getContext('2d');legacyPixels+=legacy.width*legacy.height;
    for(let index=0;index<list.length;index++){
     const f=list[index],actual=paintedTeamFrame(a,team,f),old=ctx.getImageData(f.x,f.y,f.w,f.h).data,now=actual.img.getContext('2d').getImageData(actual.f.x,actual.f.y,f.w,f.h).data;
     if(a.meta.motion&&index===0)for(const factor of[.5,1,2.05])checkMirror(actual,factor);
     if(a.meta.motion&&(actual.f.x!==0||actual.f.y!==0||actual.f.ax!==f.ax||actual.f.ay!==f.ay||actual.img.width!==f.w||actual.img.height!==f.h))throw Error('Tint crop changed geometry');
     let sample=null;for(let i=0;i<old.length;i++)if(old[i]!==now[i]){nativeDifferences++;if(!sample){sample={atlas:atlasId,team,frame:{x:f.x,y:f.y,w:f.w,h:f.h},pixel:Math.floor(i/4),channel:i%4,expected:[...old.slice(i-i%4,i-i%4+4)],actual:[...now.slice(i-i%4,i-i%4+4)]}}}if(sample&&nativeSamples.length<10)nativeSamples.push(sample);components+=old.length;frames++;
     if(index===0||index===list.length-1)for(const factor of[1,2])for(const mirror of[false,true]){
      // Compare scaled pixels after isolating the same native source crop.
      // Sampling directly from a full atlas pulls neighboring frame colours
      // into high-quality interpolation and is not the canonical crop render.
      const oldCrop=troopFrameTexture({img:legacy,f});
      const expected=scaled(oldCrop||legacy,oldCrop?{...f,x:0,y:0}:f,mirror,factor),actualPixels=scaled(actual.img,actual.f,mirror,factor);
      for(let i=0;i<expected.length;i++)if(expected[i]!==actualPixels[i])scaledDifferences++;
     }
     peak=Math.max(peak,c.pixels);if(c.pixels>c.limit)throw Error('Tint cache exceeded retained-pixel budget');
    }
    delete a.teams[team];
   }
  }
  // An ordinary repeat of a small active roster must allocate no new canvases.
  const warm=()=>{for(const kind of['mil','vil','knight','arc','bld_house_age_3','bld_tc_age_3'])for(let team=0;team<4;team++)assetFrame(kind,team,0,0,.1)};
  warm();const ready=c.creations;warm();const warmAllocations=c.creations-ready;
  return {atlases,frames,components,nativeDifferences,scaledDifferences,mirrorComparisons,mirrorMaxDelta,identityCopyMaxDelta,legacyTotalCanvasPixels:legacyPixels,retainedPixelLimit:c.limit,peakRetainedPixels:peak,retainedPixels:c.pixels,newCanvases:c.creations-start,evictions:c.evictions,warmAllocations,legacyMotionCopiesRetained:Object.values(ASSET.atl).filter(a=>a.meta.motion).reduce((n,a)=>n+Object.keys(a.teams||{}).length,0),nativeSamples,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 console.log('frame-tint-mismatch-diagnostic: '+JSON.stringify({nativeDifferences:result.nativeDifferences,samples:result.nativeSamples}));
 console.log('frame-mirror-diagnostic: '+JSON.stringify({comparisons:result.mirrorComparisons,mirrorMaxDelta:result.mirrorMaxDelta,identityCopyMaxDelta:result.identityCopyMaxDelta}));
 assert.equal(result.before,result.after);assert.ok(result.atlases>=51&&result.frames>3000);assert.equal(result.nativeDifferences,0);assert.equal(result.scaledDifferences,0);
 assert.ok(result.peakRetainedPixels<=result.retainedPixelLimit);assert.equal(result.warmAllocations,0);assert.equal(result.legacyMotionCopiesRetained,0);
 assert.ok(result.mirrorComparisons>100);assert.ok(result.mirrorMaxDelta<=1,'transformed shared source matches the former mirrored copy within one channel level');
 await writeFile(output+'/frame-tints.json',JSON.stringify(result,null,2));return result;
}

export async function checkRosterTintWarmup(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const world={teamN:4,us:['mil','knight'].flatMap(k=>[0,1,2,3].map(t=>({k,t,hp:100})))};
  queueRosterTintWarmup(world);const jobs=TINT_WARMUP.jobs.slice();let callbacks=0,maxCreations=0;
  while(TINT_WARMUP.status==='pending'&&callbacks<1000){
   const step=advanceRosterTintWarmup();maxCreations=Math.max(maxCreations,step.created);callbacks++;
  }
  const ready=TEAM_FRAME_CACHE.creations;
  for(const job of jobs)paintedTeamFrame(job.atlas,job.team,job.frame,job.kind);
  return {before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,jobs:jobs.length,callbacks,maxCreations,
   status:TINT_WARMUP.status,skipped:TINT_WARMUP.skipped,failed:TINT_WARMUP.failed,
   sourceReads:TINT_WARMUP.sourceReads,sourceReuses:TINT_WARMUP.sourceReuses,sourceBytes:graphicsSurfaceEstimate().tintWarmSourceBytes,
   readiness:rosterTintWarmupReadiness(world),
   newVerificationTints:TEAM_FRAME_CACHE.creations-ready,plannedPixels:TINT_WARMUP.plannedPixels,limit:TEAM_FRAME_GROUPS.troop.limit};
 });
 assert.equal(result.before,result.after);assert.ok(result.jobs>0);assert.equal(result.status,'drained');
 assert.ok(result.maxCreations<=4);assert.equal(result.failed,0);assert.equal(result.newVerificationTints,0);
 assert.equal(result.sourceBytes,0);
 assert.equal(result.readiness.ready,true);assert.equal(result.readiness.resident,result.jobs);
 assert.ok(result.plannedPixels<=result.limit);return result;
}
export async function checkNextTintPrediction(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,savedMode=mode,savedLimit=TEAM_FRAME_GROUPS.troop.limit,expected=new Map(),runs=[];
  let different=0,comparedBytes=0;
  try{
   mode='play';cancelRosterTintWarmup();
   for(const predict of[false,true]){
    cancelTintPredictions();clearTeamFrameCache();
    const start=TEAM_FRAME_CACHE.creations,claims=TEAM_FRAME_CACHE.predictionClaims;let drawCreations=0,prepared=0,maxPrepared=0;
    for(let callback=0;callback<16;callback++){
     GRAPHICS_TRACE.sequence++;resetGraphicsTraceFrame();
     const step=advanceTintPredictions();prepared+=step.created;maxPrepared=Math.max(maxPrepared,step.created);
     const drawn=TEAM_FRAME_CACHE.creations;
     for(let team=0;team<4;team++){
      const art=assetFrame('mil',team,1,0,0,0,(callback%8)/8,predict),f=art.f;
      const bytes=art.img.getContext('2d').getImageData(f.x,f.y,f.w,f.h).data,key=team+'/'+(callback%8);
      if(!predict)expected.set(key,bytes);
      else{
       const reference=expected.get(key);if(reference.length!==bytes.length)throw Error('Prediction changed source dimensions');
       comparedBytes+=bytes.length;for(let i=0;i<bytes.length;i++)if(bytes[i]!==reference[i])different++;
      }
     }
     drawCreations+=TEAM_FRAME_CACHE.creations-drawn;
    }
    runs.push({predict,totalCreations:TEAM_FRAME_CACHE.creations-start,drawCreations,prepared,maxPrepared,
     claims:TEAM_FRAME_CACHE.predictionClaims-claims,unused:TEAM_FRAME_GROUPS.troop.predicted.size});
   }
   cancelTintPredictions();clearTeamFrameCache();
   const atlas=ASSET_ANIM_INDEX.get('mil/walk/0').find(a=>a.ok),animation=atlas.meta.anims['mil/walk/0'];
   const frame=(animation.dirs?.[0]||animation.frames)[0];TEAM_FRAME_GROUPS.troop.limit=3*frame.w*frame.h;
   const first=paintedTeamFrame(atlas,0,frame,'mil');paintedTeamFrame(atlas,1,frame,'mil');
   const reference=first.img.getContext('2d').getImageData(0,0,frame.w,frame.h).data;
   const hint=paintedTeamFrame(atlas,2,frame,'mil'),key=teamFrameCacheKey(atlas,2,frame,'troop',teamColor(2));
   if(!markTeamFramePrediction(key,hint.img))throw Error('Could not mark pressure-test prediction');
   const discarded=TEAM_FRAME_CACHE.predictionDiscards;paintedTeamFrame(atlas,1,frame,'mil');paintedTeamFrame(atlas,3,frame,'mil');
   const reused=paintedTeamFrame(atlas,0,frame,'mil'),actual=reused.img.getContext('2d').getImageData(0,0,frame.w,frame.h).data;
   comparedBytes+=actual.length;for(let i=0;i<actual.length;i++)if(actual[i]!==reference[i])different++;
   const priority={residentReused:reused.img===first.img,discards:TEAM_FRAME_CACHE.predictionDiscards-discarded,unused:TEAM_FRAME_GROUPS.troop.predicted.size};
   return {before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,runs,priority,comparedBytes,different};
  }finally{TEAM_FRAME_GROUPS.troop.limit=savedLimit;cancelTintPredictions();mode=savedMode;queueRosterTintWarmup(S)}
 });
 assert.equal(result.before,result.after);assert.ok(result.comparedBytes>0);assert.equal(result.different,0);
 assert.equal(result.runs[0].totalCreations,result.runs[1].totalCreations);
 assert.ok(result.runs[1].drawCreations<result.runs[0].drawCreations);assert.ok(result.runs[1].maxPrepared<=4);
 assert.ok(result.runs[1].claims>0);assert.equal(result.runs[1].unused,0);
 assert.equal(result.priority.residentReused,true);assert.equal(result.priority.discards,1);assert.equal(result.priority.unused,0);
 return result;
}
export async function checkScopedTintOverflow(page){
 const result=await page.evaluate(()=>{
  const saved={mode,perfTestMatch,enabled:UNIT_TINT_WORKSPACE.enabled},before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  let cases=0,comparedBytes=0,different=0,pixelReuses=0,peakPixelBytes=0;
  const draw=(kind,state,phase,zoom,dpr,mirror,limited)=>{
   clearTeamFrameCache();resetGraphicsTraceFrame();
   if(limited)GRAPHICS_TRACE.frame.tints=4;
   DPR=dpr;zm=zoom;
   const cv=document.createElement('canvas');cv.width=Math.round(720*dpr);cv.height=Math.round(260*dpr);
   const g=cv.getContext('2d');g.fillStyle='#111d2b';g.fillRect(0,0,cv.width,cv.height);g.setTransform(dpr,0,0,dpr,0,0);
   g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';beginGraphicsSurfaceUse();
   try{for(let repeat=0;repeat<2;repeat++)for(let team=0;team<4;team++){
    const entered=limited&&beginUnitTintScope();try{
     const art=assetFrame(kind,team,state,0,phase,0,phase,false,limited);
     if(limited&&!art.transient)throw Error('Expected draw-scoped overflow');
     drawPaintedTroop(g,art,100+team*180,240,art.sc*zoom,state,.37,mirror,kind,phase);
    }finally{if(entered)endUnitTintScope()}
   }}finally{endGraphicsSurfaceUse()}
   if(limited&&GRAPHICS_TRACE.frame.crops)throw Error('A leased image entered the persistent crop cache');
   if(UNIT_TINT_WORKSPACE.pixelBytes)throw Error('Temporary pixels survived batch completion');
   if(limited){pixelReuses+=GRAPHICS_TRACE.frame.transientPixelHits;peakPixelBytes=Math.max(peakPixelBytes,GRAPHICS_TRACE.frame.transientPixelPeakBytes)}
   return g.getImageData(0,0,cv.width,cv.height).data;
  };
  const projection={DPR,zm};
  try{
   mode='pause';perfTestMatch=1;if(!setUnitTintExperiment(true))throw Error('Could not enable tint experiment');
   for(const kind of['mil','knight'])for(const state of[1,2])for(const zoom of[.8,2.05])for(const dpr of[.6,1])for(const mirror of[false,true]){
    const reference=draw(kind,state,.7,zoom,dpr,mirror,false),actual=draw(kind,state,.7,zoom,dpr,mirror,true);
    comparedBytes+=actual.length;for(let i=0;i<actual.length;i++)if(actual[i]!==reference[i])different++;cases++;
   }
   return {before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,cases,comparedBytes,different,pixelReuses,peakPixelBytes,depth:UNIT_TINT_WORKSPACE.depth,
    released:UNIT_TINT_WORKSPACE.slots.every(s=>(!s.tint||s.tint.width===1)&&(!s.crop||s.crop.width===1))};
  }finally{
   DPR=projection.DPR;zm=projection.zm;mode='pause';perfTestMatch=1;setUnitTintExperiment(saved.enabled);
   mode=saved.mode;perfTestMatch=saved.perfTestMatch;queueRosterTintWarmup(S);
  }
 });
 assert.equal(result.before,result.after);assert.ok(result.cases>0);assert.equal(result.different,0);
 assert.ok(result.pixelReuses>=result.cases*4);assert.ok(result.peakPixelBytes<=4*1024*1024);
 assert.equal(result.depth,0);assert.equal(result.released,true);return result;
}
export async function checkSpriteWarmup(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,ready=hasReadyAssetPose,original=spr,oldQueue=WQ.slice(),tints=TEAM_FRAME_CACHE.creations;
  const results=[];let calls=0;spr=(...args)=>{calls++;return original(...args)};
  try{
   queueWarm();cancelRosterTintWarmup();const covered=WQ.filter(q=>ready(q[0],q[1],q[2])).length;
   for(const skip of [false,true]){
    hasReadyAssetPose=skip?ready:()=>false;clearProceduralSpriteCache();queueWarm();cancelRosterTintWarmup();const jobs=WQ.length;calls=0;
    const start=performance.now();let batches=0;
    while(WQ.length&&batches++<10000)warm();if(WQ.length)throw Error('Warm-up did not terminate');
    results.push({skipReady:skip,jobs,paintCalls:calls,cpuMs:performance.now()-start,retainedPixels:SPC_PIXELS,batches});
   }
   return {covered,results,tintsCreated:TEAM_FRAME_CACHE.creations-tints,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
  }finally{spr=original;hasReadyAssetPose=ready;WQ=oldQueue;clearProceduralSpriteCache()}
 });
 assert.equal(result.before,result.after);assert.equal(result.tintsCreated,0);assert.ok(result.covered>0);
 assert.equal(result.results[0].paintCalls,result.results[0].jobs);
 assert.equal(result.results[1].paintCalls,result.results[1].jobs-result.covered);
 for(const r of result.results)assert.ok(r.retainedPixels<=2*1024*1024);
 return result;
}
