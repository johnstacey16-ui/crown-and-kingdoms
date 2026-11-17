/* Draw-scoped native tint overflow. These images must not escape a unit draw
 * or enter a texture cache: the next unit may overwrite their pixels. */
const UNIT_TINT_WORKSPACE={enabled:false,depth:0,slots:[],clearPending:false,
 pixels:new Map(),pixelBytes:0,pixelLimit:4*1024*1024,pixelEntries:16};
// Batch-local immutable ImageData, not another retained drawable cache. Only
// privately read pixels can be held: warm-up's shared working buffer mutates.
function unitTintPixels(key){
 const entry=UNIT_TINT_WORKSPACE.pixels.get(key);
 if(!entry)return null;
 const w=UNIT_TINT_WORKSPACE;
 w.pixels.delete(key);w.pixels.set(key,entry);
 GRAPHICS_TRACE.frame.transientPixelHits++;
 return entry;
}
function rememberUnitTintPixels(key,pixels){
 const w=UNIT_TINT_WORKSPACE,bytes=pixels.data.byteLength;
 if(!key||!bytes||bytes>w.pixelLimit||w.pixelEntries<1)return;
 const previous=w.pixels.get(key);
 if(previous){w.pixelBytes-=previous.data.byteLength;w.pixels.delete(key)}
 while(w.pixels.size&&(w.pixelBytes+bytes>w.pixelLimit||w.pixels.size>=w.pixelEntries)){
  const oldest=w.pixels.keys().next().value;
  w.pixelBytes-=w.pixels.get(oldest).data.byteLength;w.pixels.delete(oldest);
 }
 w.pixels.set(key,pixels);w.pixelBytes+=bytes;
 GRAPHICS_TRACE.frame.transientPixelPeakBytes=Math.max(GRAPHICS_TRACE.frame.transientPixelPeakBytes,w.pixelBytes);
}
function clearUnitTintPixels(){UNIT_TINT_WORKSPACE.pixels.clear();UNIT_TINT_WORKSPACE.pixelBytes=0}
function unitTintExperimentAllowed(){
 return UNIT_TINT_WORKSPACE.enabled&&typeof perfTestMatch!=='undefined'&&perfTestMatch&&
  (mode==='play'||mode==='pause')&&!(typeof window!=='undefined'&&window.CK_NET?.isRunning?.());
}
function setUnitTintExperiment(enabled){
 if(UNIT_TINT_WORKSPACE.depth||GRAPHICS_SURFACE_LIFETIME.depth||
    typeof canvasBenchmark!=='undefined'&&canvasBenchmark)return false;
 if(enabled&&(typeof perfTestMatch==='undefined'||!perfTestMatch||mode!=='pause'||
    typeof window!=='undefined'&&window.CK_NET?.isRunning?.()))return false;
 UNIT_TINT_WORKSPACE.enabled=!!enabled;if(!enabled)clearUnitTintWorkspaces();return true;
}
function beginUnitTintScope(){
 if(!unitTintExperimentAllowed())return false;
 UNIT_TINT_WORKSPACE.depth++;return true;
}
function endUnitTintScope(){
 if(UNIT_TINT_WORKSPACE.depth)UNIT_TINT_WORKSPACE.depth--;
 if(!UNIT_TINT_WORKSPACE.depth&&UNIT_TINT_WORKSPACE.clearPending){clearUnitTintWorkspaces();return}
 if(!UNIT_TINT_WORKSPACE.depth&&!GRAPHICS_SURFACE_LIFETIME.depth)releaseUnitTintWorkspaces();
}
function unitTintOverflow(){return unitTintExperimentAllowed()&&UNIT_TINT_WORKSPACE.depth>0&&GRAPHICS_TRACE.frame.tints>=4}
function unitTintFailure(cause){
 if(cause?.unitTintOverflow)return cause;
 const error=new Error('Temporary coloured unit artwork could not be drawn'+(cause?.message?': '+cause.message:'.'));
 error.unitTintOverflow=true;return error;
}
function unitTintSurface(slot,name,w,h){
 let canvas=slot[name],ctx=slot[name+'Context'];
 if(canvas&&(!ctx||ctx.isContextLost?.())){
  retireGraphicsSurface(canvas);canvas=null;ctx=null;
 }
 if(!canvas){
  canvas=document.createElement('canvas');ctx=null;
  GRAPHICS_TRACE.frame.transientSurfaces++;
 }
 const resized=canvas.width!==w||canvas.height!==h;
 if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 if(resized)GRAPHICS_TRACE.frame.transientResizes++;
 if(!ctx)ctx=canvas.getContext('2d');
 slot[name]=canvas;slot[name+'Context']=ctx;
 if(!ctx||ctx.isContextLost?.())return null;
 // The crop surface is reused with source-over compositing. Its transparent
 // pixels must start blank, exactly like a newly allocated cached crop.
 if(name==='crop'&&!resized)ctx.clearRect(0,0,w,h);
 let pixels=0;
 for(const active of UNIT_TINT_WORKSPACE.slots)if(active){
  if(active.tint)pixels+=active.tint.width*active.tint.height;
  if(active.crop)pixels+=active.crop.width*active.crop.height;
 }
 GRAPHICS_TRACE.frame.transientPeakPixels=Math.max(GRAPHICS_TRACE.frame.transientPeakPixels,pixels);
 return canvas;
}
function writeUnitTintOverflow(pixels,frame,team){
 const index=UNIT_TINT_WORKSPACE.depth-1;
 if(index<0)return null;
 const slot=UNIT_TINT_WORKSPACE.slots[index]||(UNIT_TINT_WORKSPACE.slots[index]={});
 const canvas=unitTintSurface(slot,'tint',frame.w,frame.h);if(!canvas)return null;
 slot.tintContext.putImageData(pixels,0,0);if(slot.tintContext.isContextLost?.())return null;
 canvas.paintedAtlas=true;canvas.paintedTeam=team;
 const source=canvas.paintedSourceFrame||(canvas.paintedSourceFrame={});
 source.x=frame.x;source.y=frame.y;source.w=frame.w;source.h=frame.h;
 canvas.unitTintWorkspace=slot;
 GRAPHICS_TRACE.frame.transientTints++;
 return canvas;
}
function unitTintCrop(art,w,h){
 const slot=art.img.unitTintWorkspace;
 if(!slot||!UNIT_TINT_WORKSPACE.depth)return null;
 const canvas=unitTintSurface(slot,'crop',w,h);if(!canvas)return null;
 const ctx=slot.cropContext,f=art.f;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(art.img,f.x,f.y,f.w,f.h,0,0,w,h);
 if(ctx.isContextLost?.())return null;
 return canvas;
}
function releaseUnitTintWorkspaces(){
 if(UNIT_TINT_WORKSPACE.depth)return;
 clearUnitTintPixels();
 for(const slot of UNIT_TINT_WORKSPACE.slots)if(slot){
  if(slot.tint&&(slot.tint.width>1||slot.tint.height>1))retireGraphicsSurface(slot.tint);
  if(slot.crop&&(slot.crop.width>1||slot.crop.height>1))retireGraphicsSurface(slot.crop);
 }
}
function clearUnitTintWorkspaces(){
 if(UNIT_TINT_WORKSPACE.depth){UNIT_TINT_WORKSPACE.clearPending=true;return}
 releaseUnitTintWorkspaces();UNIT_TINT_WORKSPACE.slots=[];UNIT_TINT_WORKSPACE.clearPending=false;
}
