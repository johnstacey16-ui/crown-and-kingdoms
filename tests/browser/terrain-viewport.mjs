import assert from 'node:assert/strict';

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
    out.push({scale,zoom,changed,coloured});
   }
  }finally{S.ex.set(saved.explored);X=saved.X;CW=saved.CW;CH=saved.CH;DPR=saved.DPR;zm=saved.zm;Object.assign(cam,saved.cam);drawTerrainViewport=saved.drawTerrainViewport;TERRAIN_VIEW.key=null}
  return out;
 });
 for(const r of results){assert.ok(r.coloured>1000,'comparison includes visible painted terrain');assert.equal(r.changed,0,'pixel-identical terrain at scale/zoom '+r.scale+'/'+r.zoom)}
 return results;
}

// Dispatching events verifies the recovery contract, not physical GPU loss.
export async function checkGraphicsRecovery(page){
 const result=await page.evaluate(()=>{
  snd=mus=0;mode='title';
  if(!loadSeriesSLargeBattleSave())throw Error('Large battle fixture failed');
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,saves=JSON.stringify(Object.entries(localStorage)),views=[];
  const home=S.bs.find(b=>b.t===0&&b.k==='tc');
  for(const zoom of [.8,3]){
   zm=zoom;TW=64*zm;TH=32*zm;ctr(home.x+5,home.y+5);mode='pause';draw(0);draw(0);
   const data=WORLD_X.getImageData(0,0,cv.width,cv.height).data;let coloured=0;
   // Exclude the HUD, minimap and menus; the middle of the world must render.
   for(let y=80;y<Math.floor(cv.height*.6);y+=2)for(let x=20;x<Math.floor(cv.width*.65);x+=2){const i=(y*cv.width+x)*4;if(data[i]+data[i+1]+data[i+2]>90)coloured++}
   views.push({zoom,coloured,units:S.us.length,buildings:S.bs.length,fogMs:perfFogMs,tileTotalMs:perfTilesMs});
  }
  mode='play';const lost=new Event('contextlost',{cancelable:true});cv.dispatchEvent(lost);
  const paused=mode==='pause',restorationAllowed=!lost.defaultPrevented,statusVisible=!!document.querySelector('[role="status"]');
  cv.dispatchEvent(new Event('contextrestored'));draw(0);draw(0);
  return {views,paused,restorationAllowed,statusVisible,restored:GRAPHICS_RECOVERY.lost.size===0&&!GRAPHICS_RECOVERY.status,terrainRebuilt:TCH.size>0&&!!TERRAIN_VIEW.key,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,savesUnchanged:saves===JSON.stringify(Object.entries(localStorage)),stillPaused:mode==='pause'};
 });
 for(const view of result.views){assert.equal(view.units,372);assert.equal(view.buildings,238);assert.ok(view.fogMs>=0&&view.fogMs<=view.tileTotalMs,'fog time is a subset of tile time');assert.ok(view.coloured>1000,'large battle draws world pixels at zoom '+view.zoom)}
 for(const key of ['paused','restorationAllowed','statusVisible','restored','terrainRebuilt','savesUnchanged','stillPaused'])assert.equal(result[key],true,key);
 assert.equal(result.before,result.after);return result;
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
    X=actual.getContext('2d');paint(drawWorldFog);paint(drawWorldFog);paint(drawWorldFog);
    const pixels=X.getImageData(0,0,actual.width,actual.height).data;let changed=0;
    for(let i=0;i<pixels.length;i++)if(pixels[i]!==expected[i])changed++;
    cases.push({dpr,zoom,pan,changed,ready:FOG_MASK_CACHE.ready,maskPixels:FOG_MASK_CACHE.canvas?.width*FOG_MASK_CACHE.canvas?.height});
   }
  }finally{X=savedX;clearFogMaskCache()}
  return {cases,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(result.before,result.after);for(const c of result.cases){assert.equal(c.changed,0,'fog mask changed pixels: '+JSON.stringify(c));assert.equal(c.ready,true);assert.ok(c.maskPixels<=4000000)}
 return result;
}
