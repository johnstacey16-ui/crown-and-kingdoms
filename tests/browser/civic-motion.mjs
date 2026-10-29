import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkCivicMotion(page,output){
 const result=await page.evaluate(()=>{
  const kinds=['fish','gal','trn','cog','cart','king'];
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1920;
  const g=canvas.getContext('2d');g.fillStyle='#243d42';g.fillRect(0,0,canvas.width,canvas.height);
  const raster=[],poses=[];
  for(const [row,kind] of kinds.entries()){
   const actor={k:kind,x:20,y:20,netId:'civic-'+kind,p:[[21,20]],o:'m',cd:0};
   const saved=JSON.stringify(actor),pose=unitVisualPose(actor,5);
   poses.push({kind,state:pose.state,paused:JSON.stringify(pose)===JSON.stringify(unitVisualPose(actor,5)),unchanged:saved===JSON.stringify(actor)});
   for(const state of [1,2])for(let frame=0;frame<8;frame++){
    const a=assetFrame(kind,0,state,0,0,0,frame/8);
    drawPaintedTroop(g,a,frame*192+96,(row*2+state)*160-5,a.sc*1.5,state,0,false,kind,frame/8);
   }
   for(let team=0;team<4;team++)for(const state of [1,2,...(kind==='fish'?[3]:[])]){
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
  const fisher={k:'fish',x:20,y:20,netId:'fisher',p:[],o:'g',cd:0,ret:0,tg:{x:20.5,y:20,fi:1,amt:100,k:'f'}};
  const saved=JSON.stringify(fisher),fishing=unitVisualPose(fisher,6);
  const work={state:fishing.state,paused:JSON.stringify(fishing)===JSON.stringify(unitVisualPose(fisher,6)),unchanged:saved===JSON.stringify(fisher)};
  fisher.ret=1;work.returnState=unitVisualPose(fisher,6).state;
  return {poses,raster,work,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);
 assert.equal(result.raster.length,52);
 for(const r of result.raster){assert.equal(r.distinct,8,r.kind+'/'+r.team+'/'+r.state);assert.ok(r.minimum>400)}
 for(const p of result.poses){assert.equal(p.state,1);assert.ok(p.paused&&p.unchanged)}
 assert.deepEqual(result.work,{state:3,paused:true,unchanged:true,returnState:0});
 await writeFile(output+'/civic-motion.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
