import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkHorseMotion(page,output){
 const result=await page.evaluate(()=>{
  const kinds=['mgd','cata','conq','boyar','tarkan','huszar'];
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,canvas=document.createElement('canvas');canvas.width=1280;canvas.height=kinds.length*320;
  const g=canvas.getContext('2d');g.fillStyle='#192b30';g.fillRect(0,0,canvas.width,canvas.height);const poses=[],raster=[];
  for(const [unit,kind]of kinds.entries()){
   const actor={k:kind,x:20,y:20,netId:'preview-'+kind,p:[],o:'a',cd:U[kind].cd,tg:{x:24,y:20}},saved=JSON.stringify(actor);
   const pose=unitVisualPose(actor,5),paused=JSON.stringify(pose)===JSON.stringify(unitVisualPose(actor,5));
   const firing=assetFrame(kind,0,2,0,999,0,pose.phase),atlas=ASSET.atl['painted-motion-'+kind];
   poses.push({kind,paused,unchanged:saved===JSON.stringify(actor),phase:pose.phase,firstImpact:JSON.stringify(firing.sourceFrame)===JSON.stringify(atlas.meta.anims[kind+'/attack/0'].frames[0]),referencePixels:firing.referenceHeight*firing.sc});
   for(let state=1;state<=2;state++)for(let frame=0;frame<8;frame++){
    const a=assetFrame(kind,0,state,0,0,0,frame/8);drawPaintedTroop(g,a,frame*160+70,(unit*2+state)*160-5,a.sc*1.5,state,0,false,kind,frame/8);
   }
  }
  for(const kind of kinds)for(let team=0;team<4;team++)for(const state of [1,2]){
   const tile=document.createElement('canvas');tile.width=256;tile.height=192;const c=tile.getContext('2d'),hashes=new Set();let minimum=Infinity;
   for(let frame=0;frame<8;frame++){
    const a=assetFrame(kind,team,state,0,0,0,frame/8),f=a.f;c.clearRect(0,0,256,192);c.drawImage(a.img,f.x,f.y,f.w,f.h,128-f.ax*a.sc*1.5,180-f.ay*a.sc*1.5,f.w*a.sc*1.5,f.h*a.sc*1.5);
    const p=c.getImageData(0,0,256,192).data;let hash=2166136261,opaque=0;for(let i=0;i<p.length;i++){hash=Math.imul(hash^p[i],16777619);if(i%4===3&&p[i]>32)opaque++}hashes.add(hash>>>0);minimum=Math.min(minimum,opaque);
   }
   raster.push({kind,team,state,distinct:hashes.size,minimum});
  }
  return {poses,raster,conqSize:USZ('conq'),before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.equal(result.raster.length,48);
 for(const r of result.raster){assert.equal(r.distinct,8,r.kind+'/'+r.team+'/'+r.state);assert.ok(r.minimum>500)}
 for(const p of result.poses){assert.ok(p.paused&&p.unchanged&&p.firstImpact);assert.equal(p.phase,0);assert.ok(Math.abs(p.referencePixels-60)<1e-8)}
 assert.deepEqual(result.conqSize,[90,86],'Conquistador overlays use cavalry dimensions');
 await writeFile(output+'/horse-motion.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
