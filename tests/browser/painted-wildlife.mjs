import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkPaintedWildlife(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,canvas=document.createElement('canvas');canvas.width=1280;canvas.height=640;
  const g=canvas.getContext('2d');g.fillStyle='#355645';g.fillRect(0,0,1280,320);g.fillStyle='#28596b';g.fillRect(0,320,1280,320);
  const samples=[],poses=[],textures=new Set(),nodes=S.nodes.filter(n=>n.an||n.fi&&!n.trap),saved=JSON.stringify(nodes);
  for(const [row,kind] of ['deer','fish'].entries()){
   const n=nodes.find(n=>kind==='deer'?n.an:n.fi),atlas=ASSET.atl['painted-wildlife-'+kind],anim=atlas.meta.anims['env_'+kind+'/idle/0'],width=kind==='deer'?46:40;
   const a=paintedEnvironmentFrame(n,S.t),b=paintedEnvironmentFrame(n,S.t),next=paintedEnvironmentFrame(n,S.t+anim.dur);
   poses.push({kind,paused:a.f===b.f,advances:a.f!==next.f,referenceWidth:a.referenceWidth,expectedWidth:anim.referenceWidth});
   textures.add(atlas.img);
   for(let frame=0;frame<8;frame++){
    const art=assetFrame('env_'+kind,0,0,0,0,0,frame/8),f=art.f,sc=width/art.referenceWidth;
    textures.add(paintedNodeTexture(art,width));textures.add(paintedNodeTexture(art,54));
    for(let z=1;z<=2;z++)g.drawImage(art.img,f.x,f.y,f.w,f.h,frame*160+80-f.ax*sc*z,row*320+z*150-f.ay*sc*z,f.w*sc*z,f.h*sc*z);
    const c=document.createElement('canvas');c.width=c.height=192;const ctx=c.getContext('2d');
    ctx.drawImage(art.img,f.x,f.y,f.w,f.h,96-f.ax*sc*2,180-f.ay*sc*2,f.w*sc*2,f.h*sc*2);
    const p=ctx.getImageData(0,0,192,192).data;let hash=2166136261,opaque=0;for(let i=0;i<p.length;i++){hash=Math.imul(hash^p[i],16777619);if(i%4===3&&p[i]>32)opaque++}
    samples.push({kind,frame,hash:hash>>>0,opaque,neutral:art.img===atlas.img});
   }
  }
  const originalSelector=paintedEnvironmentFrame,soloOriginal=X.drawImage,mapContext=document.getElementById('battlefield-art').getContext('2d'),mapOriginal=mapContext.drawImage;
  const clocks=[];let pass='solo',soloDraws=0,mapDraws=0,fallback=true;
  try{
   paintedEnvironmentFrame=function(n,time){if(n.an||n.fi&&!n.trap)clocks.push({pass,kind:n.an?'deer':'fish',time});return originalSelector(n,time)};
   X.drawImage=function(...args){if(textures.has(args[0]))soloDraws++;return soloOriginal.apply(this,args)};
   for(const n of nodes)drawNode(n);
   pass='map';mapContext.drawImage=function(...args){if(textures.has(args[0]))mapDraws++;return mapOriginal.apply(this,args)};
   artMap.refresh(S,0,W,H,true);
   for(const kind of ['deer','fish']){
    const atlas=ASSET.atl['painted-wildlife-'+kind],ok=atlas.ok;
    try{atlas.ok=false;const a=originalSelector(nodes.find(n=>kind==='deer'?n.an:n.fi),S.t);fallback&&=!!a&&!a.animated&&a.img===ASSET.atl['painted-environment'].img}finally{atlas.ok=ok}
   }
  }finally{paintedEnvironmentFrame=originalSelector;X.drawImage=soloOriginal;mapContext.drawImage=mapOriginal}
  return {samples,poses,clocks,time:S.t,soloDraws,mapDraws,fallback,unchanged:JSON.stringify(nodes)===saved,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.unchanged&&result.fallback);assert.equal(result.soloDraws,2);assert.ok(result.mapDraws>=2);
 for(const kind of ['deer','fish']){
  assert.equal(new Set(result.samples.filter(s=>s.kind===kind).map(s=>s.hash)).size,8);
  for(const pass of ['solo','map'])assert.ok(result.clocks.some(c=>c.pass===pass&&c.kind===kind&&c.time===result.time));
 }
 for(const p of result.poses){assert.ok(p.paused&&p.advances);assert.equal(p.referenceWidth,p.expectedWidth)}
 for(const s of result.samples)assert.ok(s.opaque>500&&s.neutral);
 await writeFile(output+'/painted-wildlife.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
