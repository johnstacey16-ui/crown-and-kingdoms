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
