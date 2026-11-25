/* Xbox picture presets, frame-pacing governor and crisp HUD policy.
 * Loaded after engine-graphics-benchmark.js, before engine.js. */
// User-selectable, session-local Xbox Edge picture presets. Backing pixels
// change, but the HUD keeps native DPR for legible Xbox menus and controls.
// Neither the original graphics tier nor the save/command format is changed.
let selectedXboxPicturePreset=-1,adaptivePictureScale=.5;
const ADAPTIVE_WINDOW_MS=8000,ADAPTIVE_WARMUP_MS=1500;
let adaptiveWindowStart=null,adaptiveSamples=[],adaptiveFastWindows=0;
function outsideGameLoopMs(frameInterval,previousLoop){return Number.isFinite(frameInterval)&&Number.isFinite(previousLoop)?Math.max(0,frameInterval-previousLoop):0}
function resetAdaptivePictureSampling(){adaptiveWindowStart=null;if(adaptiveSamples.length)adaptiveSamples=[];adaptiveFastWindows=0}
// Optional conservative frame-pacing governor. Only when expressly selected.
// Warm up for 1.5s after each window, and resize at most once every 8s.
function sampleAdaptivePicture(now,rafMs){
 if(selectedXboxPicturePreset!==3||mode!=='play'||!S||canvasBenchmark||perfFlatField||perfLayerMode||document.hidden){
  resetAdaptivePictureSampling();return;
 }
 if(!Number.isFinite(rafMs)||rafMs<1||rafMs>1000){resetAdaptivePictureSampling();return}
 if(adaptiveWindowStart===null){adaptiveWindowStart=now;return}
 const elapsed=now-adaptiveWindowStart;
 if(elapsed>=ADAPTIVE_WINDOW_MS){
  const median=canvasBenchmarkMedian(adaptiveSamples);
  if(median!==null&&adaptiveSamples.length>=16){
   const levels=[.5,.75],index=levels.indexOf(adaptivePictureScale);
   if(median>46&&index>0){adaptivePictureScale=levels[index-1];adaptiveFastWindows=0}
   else if(median<24&&index<levels.length-1){
    if(++adaptiveFastWindows>=2){adaptivePictureScale=levels[index+1];adaptiveFastWindows=0}
   }else adaptiveFastWindows=0;
   if(perfRenderScale!==adaptivePictureScale){perfRenderScale=adaptivePictureScale;perfFps=0;rs()}
  }
  adaptiveWindowStart=now;adaptiveSamples=[];return;
 }
 if(elapsed>=ADAPTIVE_WARMUP_MS&&adaptiveSamples.length<1000)adaptiveSamples.push(rafMs);
}

const CK_XBOX_PICTURE_PRESETS=[
 {name:'Original 100%',scale:1,sharp:0},
 {name:'Balanced 75%',scale:.75,sharp:1},
 {name:'Smooth 50%',scale:.5,sharp:1},
 {name:'Adaptive (experimental)',scale:.5,sharp:1,adaptive:true}
];
function currentXboxPicturePreset(){
 if(selectedXboxPicturePreset===3&&perfSharpHud&&[.5,.75].includes(perfRenderScale))return 3;
 return CK_XBOX_PICTURE_PRESETS.findIndex(p=>!p.adaptive&&p.scale===perfRenderScale&&p.sharp===perfSharpHud);
}
function setXboxPicturePreset(index){
 if(canvasBenchmark||mode!=='play'&&mode!=='pause')return false;
 const p=CK_XBOX_PICTURE_PRESETS[index];
 if(!p)return false;
 selectedXboxPicturePreset=index;
 adaptivePictureScale=p.scale;resetAdaptivePictureSampling();
 perfRenderScale=p.scale;perfSharpHud=p.sharp;
 perfFlatField=0;perfLayerMode=0;
 perfFps=0;rs();return true;
}
function cycleXboxPicturePreset(step){
 const current=currentXboxPicturePreset();
 return setXboxPicturePreset(current<0?(step<0?0:1):(current+step+CK_XBOX_PICTURE_PRESETS.length)%CK_XBOX_PICTURE_PRESETS.length);
}

/* Reapply a session-only Xbox picture preset after full-screen menus, and
 * clear it when leaving the match. Keep drawing mode/resize order unchanged. */
function updateXboxPictureForFrame(){
if(mode==='play'||mode==='pause'){
 if(selectedXboxPicturePreset>=0&&!canvasBenchmark&&currentXboxPicturePreset()!==selectedXboxPicturePreset){
  const p=CK_XBOX_PICTURE_PRESETS[selectedXboxPicturePreset];
  perfRenderScale=p.adaptive?adaptivePictureScale:p.scale;perfSharpHud=p.sharp;rs();
 }
}else if(mode==='title'||mode==='end'||mode==='error'||mode==='multiplayer'){
 selectedXboxPicturePreset=-1;resetAdaptivePictureSampling();
}
}

/* World/HUD canvas selection belongs to picture presentation, not the fixed
 * simulation frame loop. Always restore the world context after UI rendering. */
function drawXboxHudOverlays(dt){
if(perfSharpHud&&perfRenderScale<1&&HUD_X&&hudCanvas&&(mode==='play'||mode==='pause')){
 // Full-resolution HUD is transparent on top of the lower-pixel battlefield.
 // Keep the original canvas/control coordinate system and guaranteed context
 // restoration even if an overlay renderer throws.
 X=HUD_X;X.setTransform(hudCanvas.width/CW,0,0,hudCanvas.height/CH,0,0);
 X.clearRect(0,0,CW,CH);
 try{drawGameOverlays(dt)}finally{X=WORLD_X}
}else drawGameOverlays(dt);
}

// Reset measurements between fixtures; never carry a prior battle's peak into
// a new 50/100/200-unit comparison. This changes no simulation or saved setting.
function resetGraphicsDiagnostics(){
 perfFps=0;perfStepPeak=0;perfDrawPeak=0;perfStepCount=0;perfFogMs=0;
 perfFrameIntervalMs=0;perfGapMs=0;perfLoopMs=0;
 perfFlatField=0;perfLayerMode=0;perfObjectPass=0;perfUnitPass=0;
 if(typeof GRAPHICS_TRACE!=='undefined'){
  resetGraphicsTraceFrame();GRAPHICS_TRACE.frames=[];GRAPHICS_TRACE.next=0;
  GRAPHICS_TRACE.atlases=new WeakSet();GRAPHICS_TRACE.atlasDraws=[];
 }
}
// Known retained surfaces and preparation pixel buffers: excludes stores awaiting GC,
// driver copies and browser compositor allocations. RGBA bytes are estimates.
function graphicsSurfaceEstimate(){
 const surfaces=new Set(),add=c=>{if(c&&Number.isFinite(c.width)&&Number.isFinite(c.height))surfaces.add(c)};
 if(typeof cv!=='undefined')add(cv);
 if(typeof hudCanvas!=='undefined')add(hudCanvas);
 if(typeof TEAM_FRAME_CACHE!=='undefined'){
  for(const c of TEAM_FRAME_CACHE.entries.values())add(c);
  add(TEAM_FRAME_CACHE.scratch);
 }
 if(typeof UNIT_TINT_WORKSPACE!=='undefined')for(const slot of UNIT_TINT_WORKSPACE.slots)if(slot){add(slot.tint);add(slot.crop)}
 if(typeof TROOP_TEXTURE_LRU!=='undefined')for(const c of TROOP_TEXTURE_LRU.values())add(c);
 if(typeof FOG_MASK_CACHE!=='undefined')add(FOG_MASK_CACHE.canvas);
 if(typeof TCH!=='undefined')for(const c of TCH.values())add(c.cv);
 if(typeof TERRAIN_VIEW!=='undefined')add(TERRAIN_VIEW.canvas);
 if(typeof TERRAIN_BLEND!=='undefined')for(const c of TERRAIN_BLEND.values())add(c);
 if(typeof NODE_TEXTURE_RECENCY!=='undefined')for(const c of NODE_TEXTURE_RECENCY.values())add(c.canvas);
 if(typeof BUILDING_DAMAGE_CACHE!=='undefined')for(const c of BUILDING_DAMAGE_CACHE.entries.values())add(c);
 if(typeof BUILDING_LOD_CACHE!=='undefined')for(const c of BUILDING_LOD_CACHE.entries.values())add(c);
 if(typeof SPC!=='undefined')for(const c of SPC.values())add(c);
 if(typeof GRAPHICS_SURFACE_LIFETIME!=='undefined')for(const c of GRAPHICS_SURFACE_LIFETIME.pending.keys())add(c);
 const images=new Set();let atlasBytes=0,touchedAtlasBytes=0;
 if(typeof ASSET!=='undefined')for(const a of Object.values(ASSET.atl)){
  for(const c of Object.values(a.teams||{}))if(c!==a.img)add(c);
  if(!a.ok||!a.img||images.has(a.img))continue;
  images.add(a.img);
  const bytes=(a.img.naturalWidth||a.img.width||a.meta.width||0)*(a.img.naturalHeight||a.img.height||a.meta.height||0)*4;
  atlasBytes+=bytes;
  if(GRAPHICS_TRACE.atlases.has(a.img))touchedAtlasBytes+=bytes;
 }
 const canvasBytes=[...surfaces].reduce((sum,c)=>sum+c.width*c.height*4,0);
 const lifetime=typeof GRAPHICS_SURFACE_LIFETIME!=='undefined'?GRAPHICS_SURFACE_LIFETIME:null;
 const groups=typeof TEAM_FRAME_GROUPS!=='undefined'?TEAM_FRAME_GROUPS:null;
 const warm=typeof TINT_WARMUP!=='undefined'?TINT_WARMUP:null;
 const tintWarmSourceBytes=(warm?.source?.pixels?.data?.byteLength||0)+(warm?.source?.original?.byteLength||0);
 const unitTintPixelBytes=typeof UNIT_TINT_WORKSPACE!=='undefined'?UNIT_TINT_WORKSPACE.pixelBytes:0;
 const demandTintSourceBytes=typeof DEMAND_TINT_SOURCE!=='undefined'? (DEMAND_TINT_SOURCE.source?.pixels?.data?.byteLength||0)+(DEMAND_TINT_SOURCE.source?.original?.byteLength||0):0;
 return {liveCanvases:surfaces.size,canvasBytes,atlasBytes,touchedAtlasBytes,demandTintSourceBytes,nativeEstimateBytes:canvasBytes+atlasBytes+tintWarmSourceBytes+unitTintPixelBytes+demandTintSourceBytes,
  unitTintPixelBytes,
  retiredCanvases:lifetime?.pending.size||0,retiredBytes:(lifetime?.pixels||0)*4,releaseFailures:lifetime?.failures||0,
  troopTintPixels:groups?.troop.pixels||0,buildingTintPixels:groups?.building.pixels||0,
  troopTintLimit:groups?.troop.limit||0,buildingTintLimit:groups?.building.limit||0,
  tintWarmStatus:warm?.status||'idle',tintWarmRemaining:warm?warm.jobs.length-warm.index:0,
  tintWarmSkipped:warm?.skipped||0,tintWarmCapHits:warm?.capHits||0,
  tintWarmSourceBytes,tintWarmSourceReads:warm?.sourceReads||0,tintWarmSourceReuses:warm?.sourceReuses||0,
  tintPredRemaining:typeof TINT_PREDICTION!=='undefined'?TINT_PREDICTION.jobs.size:0,
  tintPredCapHits:typeof TINT_PREDICTION!=='undefined'?TINT_PREDICTION.capHits:0,
  tintPredResident:groups?.troop.predicted.size||0,tintPredPixels:groups?.troop.predictedPixels||0,
  unitTintLimitActive:typeof unitTintExperimentAllowed==='function'&&!!unitTintExperimentAllowed(),
  tintFailureBlocked:!!GRAPHICS_RECOVERY.tintFailure,tintFailures:GRAPHICS_RECOVERY.tintFailures,
  restorePreparing:GRAPHICS_RECOVERY.preparing,restoreState:GRAPHICS_RECOVERY.readiness?.state||'idle',
  restoreReason:GRAPHICS_RECOVERY.readiness?.reason||'',restoreRequired:GRAPHICS_RECOVERY.readiness?.required||0,
  restoreResident:GRAPHICS_RECOVERY.readiness?.resident||0};
}
function captureGraphicsTraceFrame(now,rafMs){
 const t=GRAPHICS_TRACE,start=performance.now();
 const record={sequence:++t.sequence,now,rafMs,...t.frame,...graphicsSurfaceEstimate(),
  drawMs:perfDrawMs,unitMs:perfUnitMs,visibleUnits:perfUnitCount,simMs:perfStepMs,ticks:perfStepCount,
  zoom:zm,dpr:DPR,scale:perfRenderScale,recoveryScale:GRAPHICS_RECOVERY.scale,
  losses:GRAPHICS_RECOVERY.losses,mode,hidden:!!document.hidden,
  units:S?.us?.length||0,buildings:S?.bs?.length||0};
 record.traceMs=performance.now()-start;
 t.frames[t.next]=record;t.next=(t.next+1)%120;
}
function persistGraphicsLoss(canvas){
 if(typeof GRAPHICS_TRACE==='undefined')return;
 try{
  const t=GRAPHICS_TRACE,r=GRAPHICS_RECOVERY;
  const frames=t.frames.length<120?t.frames.slice():t.frames.slice(t.next).concat(t.frames.slice(0,t.next));
  const report={version:1,at:new Date().toISOString(),loss:r.losses,world:canvas===cv,
   estimates:'Retained RGBA surfaces plus loaded-atlas decode estimate; not browser/GPU memory. firstDrawMs includes possible decode/upload.',
   frames,current:{...t.frame,...graphicsSurfaceEstimate()},atlasFirstDraws:t.atlasDraws.slice()};
  const json=JSON.stringify(report);
  // Preserve the latest four individual losses and a stable export key.
  localStorage.setItem('ck_graphics_loss_'+((r.losses-1)%4),json);
  localStorage.setItem('ck_graphics_loss_latest',json);
 }catch(_){} // Storage restrictions/quota must never interfere with recovery.
}
// Discard only derived pixels. Observation/age/damage knowledge, game state,
// saves and source images are deliberately retained across canvas restoration.
function clearGraphicsSurfaces(){
 if(typeof clearUnitTintWorkspaces==='function')clearUnitTintWorkspaces();
 if(typeof cancelTintPredictions==='function')cancelTintPredictions();
 // Promptly release derived graphics backing stores after a world context loss;
 // otherwise Xbox Edge may hold the old GPU surfaces until a later GC pass.
 // Decoded source atlases, simulation state and local saves are never touched.
 const release=c=>retireGraphicsSurface(c);
 clearFogMaskCache();clearTerrainBlend();clearTerrainChunks();discardTerrainViewport();
 TERRAIN_VIEW.pending=null;
 clearTeamFrameCache();
 clearTeamFrameScratch();
 for(const atlas of Object.values(ASSET.atl)){
  for(const image of Object.values(atlas.teams||{}))if(image!==atlas.img)release(image);
  delete atlas.teams;
 }
 for(const image of TROOP_TEXTURE_LRU.values())release(image);
 TROOP_TEXTURE_LRU.clear();troopTexturePixels=0;
 for(const entry of NODE_TEXTURE_RECENCY.values()){
  for(const image of entry.frames.values())release(image);
  entry.frames.clear();
 }
 NODE_TEXTURE_RECENCY.clear();NODE_TEXTURE_PIXELS=0;
 for(const image of BUILDING_DAMAGE_CACHE.entries.values())release(image);
 BUILDING_DAMAGE_CACHE.entries.clear();BUILDING_DAMAGE_CACHE.pixels=0;
  for(const image of BUILDING_LOD_CACHE.entries.values())release(image);
  BUILDING_LOD_CACHE.entries.clear();BUILDING_LOD_CACHE.pixels=0;
 clearProceduralSpriteCache();
}
// World and sharp-HUD losses have separate cache effects. Recovery never
// changes the player's chosen picture quality. Retain scale=1 for trace schema.
const GRAPHICS_RECOVERY={lost:new Set(),losses:0,worldLosses:0,worldLost:false,status:null,scale:1,preparing:false,world:null,readiness:null,tintFailure:null,tintFailures:0};
function handleGraphicsTintFailure(error){
 if(error?.code!=='CK_TEAM_TINT_UNAVAILABLE'||!S||!['play','pause'].includes(mode)||window.CK_NET?.isRunning?.())return false;
 const r=GRAPHICS_RECOVERY;
 cancelGameplayGestures();mode='pause';pm=0;acc=0;
 cancelRosterTintWarmup();cancelTintPredictions();
 r.preparing=true;r.world=S;r.tintFailure=String(error.message||'Team-colour artwork unavailable');r.tintFailures++;
 r.readiness={ready:false,state:'blocked',reason:'tint',required:0,resident:0};
 return true;
}
function graphicsRestorePending(){
 const r=GRAPHICS_RECOVERY;
 if(!r.preparing)return false;
 if(r.world!==S||window.CK_NET?.isRunning?.()||['title','end','error','multiplayer','setup','camp','brief'].includes(mode)){
  // Drop only this gate's jobs: start/load may already have planned a new world.
  if(TINT_WARMUP.world===r.world)cancelRosterTintWarmup();
  if(TINT_PREDICTION.world===r.world)cancelTintPredictions();
  r.preparing=false;r.world=null;r.readiness=null;r.tintFailure=null;return false;
 }
 return true;
}
function checkGraphicsRestoreReadiness(){
 if(!graphicsRestorePending())return false;
 const r=GRAPHICS_RECOVERY;
 if(r.tintFailure)return true;
 r.readiness=rosterTintWarmupReadiness(S);
 if(r.readiness.ready){r.preparing=false;r.world=null;return false}
 return true;
}
function retryGraphicsRestore(){
 if(!graphicsRestorePending())return false;
 if(GRAPHICS_RECOVERY.readiness?.state!=='pending'){
  queueRosterTintWarmup(S,true);GRAPHICS_RECOVERY.tintFailure=null;GRAPHICS_RECOVERY.readiness=rosterTintWarmupReadiness(S);
 }
 return true;
}
function graphicsRestoreMessage(){
 if(!graphicsRestorePending())return '';
 const r=GRAPHICS_RECOVERY.readiness;
 if(GRAPHICS_RECOVERY.tintFailure)return 'Team-colour artwork unavailable. Select Resume to retry, or load/restart.';
 if(r?.state==='pending')return 'Rebuilding roster artwork: '+Math.floor(100*TINT_WARMUP.processed/Math.max(1,TINT_WARMUP.total))+'%. Resume unlocks when ready.';
 if(r?.reason==='incomplete')return 'Roster preparation is incomplete. Retry, load or restart from the menu.';
 return 'Artwork rebuild is incomplete. Select Resume to retry, or load/restart.';
}
function drawGraphicsRestorePause(){
 // A healthy sharp HUD may still contain the pre-loss picture. Clear it
 // without invoking the normal HUD, which can itself request sprite pixels.
 if(HUD_X&&hudCanvas){
  HUD_X.save();HUD_X.setTransform(1,0,0,1,0,0);
  HUD_X.clearRect(0,0,hudCanvas.width,hudCanvas.height);HUD_X.restore();
 }
 drawPause();
}
function installCanvasRecovery(canvas){
 if(!canvas)return;
 canvas.addEventListener('contextlost',()=>{
  // Canvas2D restores by default. Do not call preventDefault.
  if(GRAPHICS_RECOVERY.lost.has(canvas))return;
  GRAPHICS_RECOVERY.lost.add(canvas);GRAPHICS_RECOVERY.losses++;
  persistGraphicsLoss(canvas);
  if(canvas===cv){
   GRAPHICS_RECOVERY.worldLost=true;
   GRAPHICS_RECOVERY.worldLosses++;
   // Release derived GPU surfaces while waiting, so they do not obstruct restore.
   clearGraphicsSurfaces();
   if(!window.CK_NET?.isRunning?.())cancelRosterTintWarmup();
  }
  if(mode==='play'&&!window.CK_NET?.isRunning?.()){
   cancelGameplayGestures();mode='pause';pm=0;acc=0;
  }
  if(!GRAPHICS_RECOVERY.status){
   const status=document.createElement('div');status.setAttribute('role','status');
   status.style.cssText='position:fixed;inset:35% 10% auto;padding:20px;background:#10141f;color:#fff;border:2px solid #c9a24a;z-index:999;text-align:center;font:18px sans-serif';
   status.textContent='Graphics interrupted. Waiting for the browser to restore the picture.';
   document.body.appendChild(status);GRAPHICS_RECOVERY.status=status;
  }
 });
 canvas.addEventListener('contextrestored',()=>{
  if(!GRAPHICS_RECOVERY.lost.has(canvas))return;
  GRAPHICS_RECOVERY.lost.delete(canvas);
  if(GRAPHICS_RECOVERY.lost.size)return;
  // HUD-only loss must not throw away the entire terrain and atlas cache.
  if(GRAPHICS_RECOVERY.worldLost){
   clearGraphicsSurfaces();
   if(!window.CK_NET?.isRunning?.()){
    queueRosterTintWarmup(S,true);
    GRAPHICS_RECOVERY.tintFailure=null;
    GRAPHICS_RECOVERY.preparing=true;GRAPHICS_RECOVERY.world=S;
    GRAPHICS_RECOVERY.readiness=rosterTintWarmupReadiness(S);
   }
  }
  GRAPHICS_RECOVERY.worldLost=false;
  rs();resetGraphicsDiagnostics();
  checkGraphicsRestoreReadiness();
  GRAPHICS_RECOVERY.status?.remove();GRAPHICS_RECOVERY.status=null;
  note(mode==='pause'?'Picture restored. Resume when ready.':'Picture restored.');
 });
}
