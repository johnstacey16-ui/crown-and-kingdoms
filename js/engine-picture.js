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
// Following an Xbox world-context loss, detect sustained slow presentation.
// Do not alter saves, controller coordinates or normal (loss-free) game sessions.
let recoveryWindowStart=null,recoveryIntervals=[];
function resetGraphicsRecoverySampling(){recoveryWindowStart=null;if(recoveryIntervals.length)recoveryIntervals=[]}
function sampleGraphicsRecovery(now,rafMs){
 const r=GRAPHICS_RECOVERY;
 if(!r.worldLosses||r.scale<=.5||selectedXboxPicturePreset===3||
    mode!=='play'||!S||canvasBenchmark||document.hidden||r.lost.size){
  resetGraphicsRecoverySampling();return;
 }
 if(!Number.isFinite(rafMs)||rafMs<1||rafMs>1000){resetGraphicsRecoverySampling();return}
 if(recoveryWindowStart===null){recoveryWindowStart=now;return}
 const elapsed=now-recoveryWindowStart;
 if(elapsed>=8000){
  const median=canvasBenchmarkMedian(recoveryIntervals);
  if(recoveryIntervals.length>=16&&median!==null&&median>48&&
     perfStepMs<18&&(perfDrawMs>22||perfGapMs>22)){
   r.scale=r.scale===1?.75:.5;
   rs();perfFps=0;
   note('Graphics recovery: physical canvas capped at '+Math.round(r.scale*100)+'% to stabilize Xbox FPS.');
  }
  recoveryWindowStart=now;recoveryIntervals=[];return;
 }
 if(elapsed>=1500&&recoveryIntervals.length<1000)recoveryIntervals.push(rafMs);
}
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
if(perfSharpHud&&perfRenderScale<1&&GRAPHICS_RECOVERY.scale===1&&HUD_X&&hudCanvas&&(mode==='play'||mode==='pause')){
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
 resetGraphicsRecoverySampling();
 perfFlatField=0;perfLayerMode=0;perfObjectPass=0;perfUnitPass=0;
}
// Discard only derived pixels. Observation/age/damage knowledge, game state,
// saves and source images are deliberately retained across canvas restoration.
function clearGraphicsSurfaces(){
 // Promptly release derived graphics backing stores after a world context loss;
 // otherwise Xbox Edge may hold the old GPU surfaces until a later GC pass.
 // Decoded source atlases, simulation state and local saves are never touched.
 const release=c=>{if(c&&Number.isFinite(c.width)&&Number.isFinite(c.height)){
  if(c.width>1)c.width=1;if(c.height>1)c.height=1;
 }};
 clearFogMaskCache();clearTerrainBlend();
 for(const chunk of TCH.values())release(chunk?.cv);
 TCH.clear();release(TERRAIN_VIEW.canvas);
 TERRAIN_VIEW.canvas=null;TERRAIN_VIEW.key=null;TERRAIN_VIEW.pending=null;TERRAIN_VIEW.chunks=[];
 for(const image of TEAM_FRAME_CACHE.entries.values())release(image);
 TEAM_FRAME_CACHE.entries.clear();TEAM_FRAME_CACHE.pixels=0;
 release(TEAM_FRAME_CACHE.scratch);TEAM_FRAME_CACHE.scratch=null;
 // The retained readback context points at the old, released canvas.
 // Without resetting it, the first post-recovery tint writes into 1x1 pixels.
 teamFrameScratchContext=null;
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
// World and sharp-HUD losses have separate cache effects. Repeated world
// losses activate a session-only physical pixel cap to avoid a black-screen loop.
const GRAPHICS_RECOVERY={lost:new Set(),losses:0,worldLosses:0,worldLost:false,status:null,scale:1};
function installCanvasRecovery(canvas){
 if(!canvas)return;
 canvas.addEventListener('contextlost',()=>{
  // Canvas2D restores by default. Do not call preventDefault.
  if(GRAPHICS_RECOVERY.lost.has(canvas))return;
  GRAPHICS_RECOVERY.lost.add(canvas);GRAPHICS_RECOVERY.losses++;
  if(canvas===cv){
   GRAPHICS_RECOVERY.worldLost=true;
   GRAPHICS_RECOVERY.worldLosses++;
   const count=GRAPHICS_RECOVERY.worldLosses;
   GRAPHICS_RECOVERY.scale=Math.min(GRAPHICS_RECOVERY.scale,count>=3?.5:count>=2?.75:1);
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
  if(GRAPHICS_RECOVERY.worldLost)clearGraphicsSurfaces();
  GRAPHICS_RECOVERY.worldLost=false;
  rs();resetGraphicsDiagnostics();
  GRAPHICS_RECOVERY.status?.remove();GRAPHICS_RECOVERY.status=null;
  const safe=GRAPHICS_RECOVERY.scale<1?' Recovery scale '+Math.round(GRAPHICS_RECOVERY.scale*100)+'%.':'';
  note((mode==='pause'?'Picture restored. Resume when ready.':'Picture restored.')+safe);
 });
}
