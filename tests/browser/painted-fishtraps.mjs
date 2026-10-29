import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkPaintedFishtraps(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,atlas=ASSET.atl['painted-fishtraps'];
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=320;
  const g=canvas.getContext('2d');g.fillStyle='#28596b';g.fillRect(0,0,800,320);
  const samples=[],textures=new Set([atlas.img]),nodes=[];
  for(let i=0;i<4;i++){
   const art=assetFrame('env_trap_'+i,0,0,0,0),f=art.f,c=document.createElement('canvas');c.width=c.height=160;
   const ctx=c.getContext('2d'),scale=128/f.w;ctx.drawImage(art.img,f.x,f.y,f.w,f.h,16,16,f.w*scale,f.h*scale);
   const pixels=ctx.getImageData(0,0,160,160).data;let hash=2166136261,opaque=0,transparent=0;
   for(let n=0;n<pixels.length;n++){hash=Math.imul(hash^pixels[n],16777619);if(n%4===3){if(pixels[n]>128)opaque++;if(!pixels[n])transparent++}}
   samples.push({variant:i,hash:hash>>>0,opaque,transparent,neutral:art.img===atlas.img});
   textures.add(paintedNodeTexture(art,38));textures.add(paintedNodeTexture(art,54));
   for(const [j,width] of [38,76,114].entries()){
    const sc=width/f.w;g.drawImage(art.img,f.x,f.y,f.w,f.h,i*200+100-f.ax*sc,70+j*100-f.ay*sc,f.w*sc,f.h*sc);
   }
   outer:for(let y=10;y<30;y++)for(let x=10;x<30;x++)if(Math.min(3,Math.floor(hsh(x,y)*4))===i){nodes.push({k:'f',fi:1,trap:1,x,y,t:0,amt:900});break outer}
  }
  const saved=JSON.stringify(nodes),soloOriginal=X.drawImage,mapCanvas=document.getElementById('battlefield-art'),mapContext=mapCanvas.getContext('2d'),mapOriginal=mapContext.drawImage;
  let soloDraws=0,mapDraws=0,fallback=false;
  try{
   X.drawImage=function(...args){if(textures.has(args[0]))soloDraws++;return soloOriginal.apply(this,args)};
   for(const n of nodes)drawNode(n);
   mapContext.drawImage=function(...args){if(textures.has(args[0]))mapDraws++;return mapOriginal.apply(this,args)};
   artMap.refresh(S,0,W,H,true);
   const ok=atlas.ok;try{atlas.ok=false;fallback=paintedEnvironmentFrame(nodes[0])===null;drawNode(nodes[0])}finally{atlas.ok=ok}
  }finally{X.drawImage=soloOriginal;mapContext.drawImage=mapOriginal}
  const projected=CK_UNIT_MAP.project(S,0,W,H).battlefield.tiles.some(t=>t.node?.trap&&t.node.fish);
  return {samples,soloDraws,mapDraws,projected,fallback,unchanged:JSON.stringify(nodes)===saved,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.unchanged&&result.fallback&&result.projected);
 assert.equal(result.soloDraws,4);assert.ok(result.mapDraws>0,'team-relative map actually draws the painted trap');
 assert.equal(new Set(result.samples.map(x=>x.hash)).size,4);
 for(const s of result.samples)assert.ok(s.opaque>1500&&s.transparent>10000&&s.neutral);
 await writeFile(output+'/painted-fishtraps.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
