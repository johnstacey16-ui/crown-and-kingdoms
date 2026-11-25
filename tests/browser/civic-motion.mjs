import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkCivicMotion(page,output){
 const result=await page.evaluate(()=>{
  const kinds=['fish','gal','trn','cog','cart','king','turtle','caravel','thirisadai'];
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=kinds.length*320;
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
  // A Mule Cart is a moving building, not the merchant Trade Cart unit.
  const mc=document.createElement('canvas');mc.width=1536;mc.height=320;const mg=mc.getContext('2d');mg.fillStyle='#314238';mg.fillRect(0,0,1536,320);
  const actor={k:'mule',t:0,x:20,y:20,s:1,hp:300,mh:300,done:true,pr:B.mule.bt,q:[],netId:'mule-motion-fixture',mulePath:[[21,20]]};
  const actorBefore=JSON.stringify(actor),muleSamples=[];
  for(let team=0;team<4;team++)for(let dir=0;dir<2;dir++){
   const hashes=new Set();let minimum=Infinity;
   for(let i=0;i<8;i++){
    const art=paintedBuildingFrame('mule',team,999,3,{state:1,dir,time:i*.1+.001});
    if(!art?.animated)throw Error('Missing Mule Cart walk art');
    const cell=document.createElement('canvas');cell.width=192;cell.height=160;const cg=cell.getContext('2d');
    drawBuildingArtwork(cg,art,96,150,132/art.referenceWidth);
    const p=cg.getImageData(0,0,192,160).data;let hash=2166136261,opaque=0;
    for(let j=0;j<p.length;j++){hash=Math.imul(hash^p[j],16777619);if(j%4===3&&p[j]>32)opaque++}
    hashes.add(hash>>>0);minimum=Math.min(minimum,opaque);
    if(team===0)mg.drawImage(cell,i*192,dir*160);
   }
   muleSamples.push({team,dir,distinct:hashes.size,minimum});
  }
  const paused=JSON.stringify(paintedBuildingFrame('mule',0,1,3,muleCartVisualPose(actor,5)).sourceFrame)===JSON.stringify(paintedBuildingFrame('mule',0,99,3,muleCartVisualPose(actor,5)).sourceFrame);
  const parked=paintedBuildingFrame('mule',0,0,3),a=ASSET.atl['painted-mule-motion'],oldOk=a.ok;let fallback;
  try{a.ok=false;fallback=JSON.stringify(paintedBuildingFrame('mule',0,0,3,muleCartVisualPose(actor,5)).sourceFrame)===JSON.stringify(parked.sourceFrame)}finally{a.ok=oldOk}
  const originalFrame=paintedBuildingFrame,savedBs=S.bs,savedTime=S.t,renderers={solo:0,map:0};let target='solo';
  paintedBuildingFrame=function(...args){const art=originalFrame(...args);if(args[0]==='mule'&&art?.animated)renderers[target]++;return art};
  try{
   S.bs=[actor];S.t=5;drawBld(actor);
   const map=CK_UNIT_MAP.create({canvas:document.createElement('canvas'),description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
   target='map';map.refresh({...S,us:[],bs:[actor]},0,W,H,true);
  }finally{paintedBuildingFrame=originalFrame;S.bs=savedBs;S.t=savedTime}
  const mule={samples:muleSamples,paused,fallback,renderers,unchanged:JSON.stringify(actor)===actorBefore,data:mc.toDataURL()};
  return {poses,raster,work,mule,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);
 assert.equal(result.raster.length,76);
 for(const r of result.raster){assert.equal(r.distinct,8,r.kind+'/'+r.team+'/'+r.state);assert.ok(r.minimum>400)}
 for(const p of result.poses){assert.equal(p.state,1);assert.ok(p.paused&&p.unchanged)}
 assert.deepEqual(result.work,{state:3,paused:true,unchanged:true,returnState:0});
 assert.equal(result.mule.samples.length,8);for(const s of result.mule.samples){assert.equal(s.distinct,8);assert.ok(s.minimum>400)}
 assert.ok(result.mule.paused&&result.mule.fallback&&result.mule.unchanged);
 assert.ok(result.mule.renderers.solo>0&&result.mule.renderers.map>0,'both production renderers select moving building art');
 await writeFile(output+'/mule-motion.png',Buffer.from(result.mule.data.split(',')[1],'base64'));delete result.mule.data;
 await writeFile(output+'/mule-motion.json',JSON.stringify(result.mule,null,2));
 await writeFile(output+'/civic-motion.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
