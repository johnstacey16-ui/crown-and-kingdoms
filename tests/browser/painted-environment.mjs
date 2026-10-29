import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkPaintedEnvironment(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,atlas=ASSET.atl['painted-environment'];
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=460;const g=canvas.getContext('2d');g.fillStyle='#536441';g.fillRect(0,0,900,460);
  const samples=[];
  for(const [i,kind]of ['deer','fish','relic','pine','oak','birch'].entries()){
   const art=assetFrame('env_'+kind,0,0,0,0),f=art.f,tile=document.createElement('canvas');tile.width=tile.height=160;
   const c=tile.getContext('2d'),scale=Math.min(128/f.w,128/f.h);c.drawImage(art.img,f.x,f.y,f.w,f.h,16,16,f.w*scale,f.h*scale);
   const p=c.getImageData(0,0,160,160).data;let hash=2166136261,opaque=0,transparent=0;
   for(let n=0;n<p.length;n++){hash=Math.imul(hash^p[n],16777619);if(n%4===3){if(p[n]>128)opaque++;if(!p[n])transparent++}}
   samples.push({kind,opaque,transparent,hash:hash>>>0,neutral:art.img===atlas.img});
   const width=i>=3?Math.min(62,86*f.w/f.h):[46,40,28][i];
   for(let j=0;j<2;j++){const sc=width*(j+1)/f.w,x=(i%3)*300+80+j*130,y=(i<3?160:430);g.drawImage(art.img,f.x,f.y,f.w,f.h,x-f.ax*sc,y-f.ay*sc,f.w*sc,f.h*sc)}
  }
  const drawn=drawPaintedRelic(g,450,200,28);const ok=atlas.ok;atlas.ok=false;
  const fallback=drawPaintedRelic(g,450,200,28)===false&&paintedEnvironmentFrame({k:'w',x:4,y:4})===null;atlas.ok=ok;
  return {samples,drawn,fallback,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.drawn&&result.fallback);
 assert.equal(new Set(result.samples.map(s=>s.hash)).size,6);
 for(const s of result.samples)assert.ok(s.opaque>500&&s.transparent>5000&&s.neutral,'transparent neutral '+s.kind);
 await writeFile(output+'/painted-environment.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
