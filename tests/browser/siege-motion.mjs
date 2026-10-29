import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkSiegeMotion(page,output){
 const result=await page.evaluate(()=>{
  const kinds=['eled','ele','ram','bomb','treb','mang','scor','wagon'];
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=kinds.length*320;
  const g=canvas.getContext('2d');g.fillStyle='#263d32';g.fillRect(0,0,canvas.width,canvas.height);
  const poses=[],raster=[];
  for(const [row,kind] of kinds.entries()){
   const actor={k:kind,netId:'siege-'+kind,x:20,y:20,p:[],o:'a',cd:U[kind].cd,tg:{x:24,y:20}};
   const saved=JSON.stringify(actor),pose=unitVisualPose(actor,5),a=assetFrame(kind,0,2,0,999,0,pose.phase),atlas=ASSET.atl['painted-motion-'+kind];
   const cell=Math.floor(a.sourceFrame.x/(atlas.meta.width/4))+4*Math.floor(a.sourceFrame.y/(atlas.meta.height/4));
   poses.push({kind,paused:JSON.stringify(pose)===JSON.stringify(unitVisualPose(actor,5)),unchanged:saved===JSON.stringify(actor),phase:pose.phase,sourceCell:cell,expectedCell:atlas.meta.sourceActionFrame});
   for(const state of [1,2])for(let frame=0;frame<8;frame++){
    const f=assetFrame(kind,0,state,0,0,0,frame/8);
    drawPaintedTroop(g,f,frame*192+96,(row*2+state)*160-5,f.sc*1.5,state,0,false,kind,frame/8);
   }
   for(let team=0;team<4;team++)for(const state of [1,2]){
    const c=document.createElement('canvas');c.width=256;c.height=192;const ctx=c.getContext('2d'),hashes=new Set();let minimum=Infinity;
    for(let frame=0;frame<8;frame++){
     const a=assetFrame(kind,team,state,0,0,0,frame/8),f=a.f,s=a.sc*1.5;
     ctx.clearRect(0,0,256,192);ctx.drawImage(a.img,f.x,f.y,f.w,f.h,128-f.ax*s,180-f.ay*s,f.w*s,f.h*s);
     const p=ctx.getImageData(0,0,256,192).data;let hash=2166136261,opaque=0;
     for(let i=0;i<p.length;i++){hash=Math.imul(hash^p[i],16777619);if(i%4===3&&p[i]>32)opaque++}
     hashes.add(hash>>>0);minimum=Math.min(minimum,opaque);
    }
    raster.push({kind,team,state,distinct:hashes.size,minimum});
   }
  }
  return {poses,raster,cartSize:USZ('cart'),wagonSize:USZ('wagon'),before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.equal(result.raster.length,64);
 for(const r of result.raster){assert.equal(r.distinct,8,r.kind+'/'+r.team+'/'+r.state);assert.ok(r.minimum>400)}
 for(const p of result.poses){assert.ok(p.paused&&p.unchanged);assert.equal(p.phase,0);assert.equal(p.sourceCell,p.expectedCell)}
 assert.deepEqual(result.cartSize,[100,90]);assert.deepEqual(result.wagonSize,[100,90]);
 await writeFile(output+'/siege-motion.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
