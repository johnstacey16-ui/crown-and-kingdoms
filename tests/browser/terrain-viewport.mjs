import assert from 'node:assert/strict';

export async function checkTerrainRetirement(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const sources=[terrainTileTexture(0,0,0,[1,-1,-1,-1]),chunkOf(0,0,1)?.cv,TERRAIN_VIEW.canvas].filter(Boolean);
  const probes=sources.map(source=>{
   const w=source.width,h=source.height,reference=document.createElement('canvas'),output=document.createElement('canvas');
   reference.width=w;reference.height=h;output.width=w*2;output.height=h;
   const g=reference.getContext('2d');g.drawImage(source,0,0);
   const bytes=g.getImageData(0,0,w,h).data;reference.width=reference.height=1;
   return {source,w,h,output,bytes};
  });
  beginGraphicsSurfaceUse();
  let preserved=false;
  try{
   clearTerrainBlend();clearTerrainChunks();discardTerrainViewport();
   preserved=probes.every(p=>p.source.width===p.w&&p.source.height===p.h);
   for(const p of probes){const g=p.output.getContext('2d');g.drawImage(p.source,0,0);g.drawImage(p.source,p.w,0)}
  }finally{endGraphicsSurfaceUse()}
  let different=0,comparedBytes=0;
  for(const p of probes){
   const actual=p.output.getContext('2d').getImageData(0,0,p.w*2,p.h).data;
   for(let y=0;y<p.h;y++)for(let x=0;x<p.w*2;x++)for(let channel=0;channel<4;channel++){
    if(actual[(y*p.w*2+x)*4+channel]!==p.bytes[(y*p.w+x%p.w)*4+channel])different++;comparedBytes++;
   }
   p.output.width=p.output.height=1;
  }
  return {before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,cases:probes.length,preserved,different,comparedBytes,
   released:probes.every(p=>p.source.width===1&&p.source.height===1)};
 });
 assert.equal(result.before,result.after);assert.ok(result.cases>=2);assert.equal(result.preserved,true);
 assert.equal(result.different,0);assert.ok(result.comparedBytes>0);assert.equal(result.released,true);return result;
}

// Compare actual painted terrain with the original chunk path in Chromium.
export async function checkTerrainViewport(page){
 const results=await page.evaluate(()=>{
  const saved={X,CW,CH,DPR,zm,cam:{...cam},drawTerrainViewport,explored:S.ex.slice()};
  const cached=drawTerrainViewport,out=[];
  try{
   S.ex.fill(1);CW=960;CH=540;cam.x=-CW/2+.35;cam.y=24*32-CH/2+.65;
   for(const scale of [1,.75,.5])for(const zoom of [.8,1.4,2]){
    DPR=1.2*scale;zm=zoom;TERRAIN_VIEW.key=null;
    const canvas=document.createElement('canvas');canvas.width=Math.round(CW*DPR);canvas.height=Math.round(CH*DPR);
    X=canvas.getContext('2d');X.setTransform(DPR,0,0,DPR,0,0);
    X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.fillStyle='#000';X.fillRect(0,0,CW,CH);
    drawTerrainViewport=chunks=>{for(const c of chunks)X.drawImage(c.cv,c.ox*zm-cam.x,c.oy*zm-cam.y,c.w*zm,c.h*zm)};
    drawChunks(0,W-1,0,H-1);
    const original=X.getImageData(0,0,canvas.width,canvas.height).data;
    X.fillStyle='#000';X.fillRect(0,0,CW,CH);drawTerrainViewport=cached;drawChunks(0,W-1,0,H-1);X.fillStyle='#000';X.fillRect(0,0,CW,CH);drawChunks(0,W-1,0,H-1);
    const actual=X.getImageData(0,0,canvas.width,canvas.height).data;
    let changed=0,coloured=0;for(let i=0;i<actual.length;i++){if(actual[i]!==original[i])changed++;if(i%4!==3&&original[i]>0)coloured++}
    const retainedChunkReferences=TERRAIN_VIEW.chunks.length,chunkCacheBeforePan=TCH.size;
    cam.x+=.25;drawChunks(0,W-1,0,H-1);
    const invalidatedChunkReferences=TERRAIN_VIEW.chunks.length,chunkCacheAfterPan=TCH.size;
    cam.x-=.25;
    out.push({scale,zoom,changed,coloured,retainedChunkReferences,invalidatedChunkReferences,chunkCacheBeforePan,chunkCacheAfterPan});
   }
  }finally{S.ex.set(saved.explored);X=saved.X;CW=saved.CW;CH=saved.CH;DPR=saved.DPR;zm=saved.zm;Object.assign(cam,saved.cam);drawTerrainViewport=saved.drawTerrainViewport;TERRAIN_VIEW.key=null}
  return out;
 });
 for(const r of results){assert.ok(r.coloured>1000,'comparison includes visible painted terrain');assert.equal(r.changed,0,'pixel-identical terrain at scale/zoom '+r.scale+'/'+r.zoom);assert.ok(r.retainedChunkReferences>0);assert.equal(r.invalidatedChunkReferences,0,'panning releases invalid viewport references');assert.ok(r.chunkCacheAfterPan>=r.chunkCacheBeforePan,'the live terrain chunk cache is retained')}
 return results;
}

// Dispatching events verifies the recovery contract, not physical GPU loss.
export async function checkGraphicsRecovery(page){
 const result=await page.evaluate(()=>{
  snd=mus=0;mode='title';
  if(!loadSeriesSLargeBattleSave())throw Error('Large battle fixture failed');
  const initialWarmup={jobs:TINT_WARMUP.total,skipped:TINT_WARMUP.skipped,pixels:TINT_WARMUP.plannedPixels};
  const gameSaves=()=>JSON.stringify(Object.entries(localStorage).filter(([key])=>!/^ck_graphics_loss_(latest|[0-3])$/.test(key)));
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,saves=gameSaves(),views=[];
  const home=S.bs.find(b=>b.t===0&&b.k==='tc');
  for(const zoom of [.8,3]){
   zm=zoom;TW=64*zm;TH=32*zm;ctr(home.x+5,home.y+5);mode='pause';draw(0);draw(0);
   const data=WORLD_X.getImageData(0,0,cv.width,cv.height).data;let coloured=0;
   // Exclude the HUD, minimap and menus; the middle of the world must render.
   for(let y=80;y<Math.floor(cv.height*.6);y+=2)for(let x=20;x<Math.floor(cv.width*.65);x+=2){const i=(y*cv.width+x)*4;if(data[i]+data[i+1]+data[i+2]>90)coloured++}
   views.push({zoom,coloured,units:S.us.length,buildings:S.bs.length,fogMs:perfFogMs,tileTotalMs:perfTilesMs});
  }
  terrainTileTexture(0,0,0,[1,-1,-1,-1]);const terrainBlendBeforeLoss=TERRAIN_BLEND.size;
  mode='play';const lost=new Event('contextlost',{cancelable:true});cv.dispatchEvent(lost);
  const paused=mode==='pause',restorationAllowed=!lost.defaultPrevented,statusVisible=!!document.querySelector('[role="status"]');
  const releasedWhileLost=TEAM_FRAME_CACHE.pixels===0&&TROOP_TEXTURE_LRU.size===0&&TCH.size===0;
  cv.dispatchEvent(new Event('contextrestored'));const blendReset=TERRAIN_BLEND.size===0&&terrainBlendPixels===0;
  let batches=0,maxCreations=0;
  while(TINT_WARMUP.status==='pending'&&batches<1000){
   const step=advanceRosterTintWarmup();maxCreations=Math.max(maxCreations,step.created);batches++;
  }
  const blocked=checkGraphicsRestoreReadiness(),readiness=GRAPHICS_RECOVERY.readiness;
  draw(0);draw(0);
  return {initialWarmup,releasedWhileLost,terrainBlendBeforeLoss,blendReset,views,paused,restorationAllowed,statusVisible,
   restored:GRAPHICS_RECOVERY.lost.size===0&&!GRAPHICS_RECOVERY.status,
   terrainRebuilt:TCH.size>0&&!!TERRAIN_VIEW.key,coldWhileBlocked:TCH.size===0&&!TERRAIN_VIEW.key,
   blocked,readiness,skipped:TINT_WARMUP.skipped,batches,maxCreations,
   before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,savesUnchanged:saves===gameSaves(),stillPaused:mode==='pause'};
 });
 for(const view of result.views){assert.equal(view.units,372);assert.equal(view.buildings,238);assert.ok(view.fogMs>=0&&view.fogMs<=view.tileTotalMs,'fog time is a subset of tile time');assert.ok(view.coloured>1000,'large battle draws world pixels at zoom '+view.zoom)}
 for(const key of ['releasedWhileLost','blendReset','paused','restorationAllowed','statusVisible','restored','savesUnchanged','stillPaused'])assert.equal(result[key],true,key);
 assert.ok(result.maxCreations<=4);
 assert.equal(result.blocked,false,'the real large battle must unlock Resume after restoration');
 assert.equal(result.skipped,0,'the recovery working set must fit without skipping required poses');
 assert.equal(result.readiness.ready,true);assert.equal(result.terrainRebuilt,true);
 assert.ok(result.terrainBlendBeforeLoss>0);assert.equal(result.before,result.after);return result;
}

export async function checkFogMask(page){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,savedX=X,cases=[];
  try{
   for(const dpr of [.6,.9,1,1.2])for(const zoom of [.8,1.96,3])for(const pan of [0,.35]){
    clearFogMaskCache();const unknown=[],dim=[];
    for(let y=0;y<24;y++)for(let x=0;x<24;x++){
     const list=(y*24+x)%3===0?unknown:(y*24+x)%3===1?dim:null;
     if(list)list.push((x-y)*32*zoom+192+pan,(x+y)*16*zoom-96-pan);
    }
    const canvas=()=>{const c=document.createElement('canvas');c.width=Math.round(384*dpr);c.height=Math.round(256*dpr);return c};
    const reference=canvas(),actual=canvas();
    const paint=fn=>{X.setTransform(1,0,0,1,0,0);X.clearRect(0,0,X.canvas.width,X.canvas.height);X.setTransform(dpr,0,0,dpr,0,0);const gradient=X.createLinearGradient(0,0,384,256);gradient.addColorStop(0,'#548ec9');gradient.addColorStop(1,'#9d8047');X.fillStyle=gradient;X.fillRect(0,0,384,256);fn(unknown,32*zoom+1.5,16*zoom+1.5,'#000');fn(dim,32*zoom+1,16*zoom+1,'rgba(0,0,0,.42)')};
    X=reference.getContext('2d');paint(paintFogLayer);const expected=X.getImageData(0,0,reference.width,reference.height).data;
    X=actual.getContext('2d');paint(drawWorldFog);paint(drawWorldFog);
    let ready,maskPixels,preserved,mask;beginGraphicsSurfaceUse();
    try{
     paint(drawWorldFog);mask=FOG_MASK_CACHE.canvas;ready=FOG_MASK_CACHE.ready;maskPixels=mask?.width*mask?.height;
     clearFogMaskCache();preserved=!!mask&&mask.width>1;
    }finally{endGraphicsSurfaceUse()}
    const released=!!mask&&mask.width===1&&mask.height===1;
    const pixels=X.getImageData(0,0,actual.width,actual.height).data;let changed=0;
    for(let i=0;i<pixels.length;i++)if(pixels[i]!==expected[i])changed++;
    cases.push({dpr,zoom,pan,changed,ready,maskPixels,preserved,released});
   }
  }finally{X=savedX;clearFogMaskCache()}
  return {cases,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(result.before,result.after);for(const c of result.cases){assert.equal(c.changed,0,'fog mask changed pixels: '+JSON.stringify(c));assert.equal(c.ready,true);assert.ok(c.maskPixels<=4000000);assert.equal(c.preserved,true);assert.equal(c.released,true)}
 return result;
}
