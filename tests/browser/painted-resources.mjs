import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkPaintedResources(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,atlas=ASSET.atl['painted-resources'];
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=430;const g=canvas.getContext('2d');
  g.fillStyle='#536441';g.fillRect(0,0,900,430);
  const samples=[];
  for(const [col,kind]of ['stone','gold','berry'].entries())for(let variant=0;variant<2;variant++){
   const art=assetFrame('node_'+kind+'_'+variant,0,0,0,0),f=art.f;
   const tile=document.createElement('canvas');tile.width=tile.height=128;const c=tile.getContext('2d');
   c.drawImage(art.img,f.x,f.y,f.w,f.h,0,0,128,128*f.h/f.w);
   const pixels=c.getImageData(0,0,128,128).data;let opaque=0,transparent=0,hash=2166136261;
   for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3){if(pixels[i]>128)opaque++;if(!pixels[i])transparent++}}
   samples.push({kind,variant,opaque,transparent,hash:hash>>>0,neutral:art.img===atlas.img});
   for(const [row,width]of [54,108].entries()){
    const scale=width/f.w,x=col*300+90+variant*130,y=65+row*180;
    g.drawImage(art.img,f.x,f.y,f.w,f.h,x-f.ax*scale,y,f.w*scale,f.h*scale);
   }
  }
  const node={k:'f',x:4,y:5,amt:100},art=paintedResourceFrame(node.k,node.x,node.y);
  const stable=art.f===paintedResourceFrame(node.k,node.x,node.y).f;
  const excluded=['f','g','s'].every(k=>paintedResourceFrame(k,4,5,true)===null);
  const previous=atlas.ok;atlas.ok=false;const fallback=paintedResourceFrame('g',4,5)===null;atlas.ok=previous;
  return {samples,stable,excluded,fallback,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.stable&&result.excluded&&result.fallback);
 assert.equal(new Set(result.samples.map(x=>x.hash)).size,6,'six distinct decoded resource images');
 for(const sample of result.samples){assert.ok(sample.opaque>2000&&sample.transparent>1000,'bounded transparent silhouette');assert.ok(sample.neutral,'natural resource colours are not team-recoloured')}
 await writeFile(output+'/painted-resources.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;
 return result;
}
