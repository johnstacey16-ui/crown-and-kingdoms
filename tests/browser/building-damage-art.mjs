import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkBuildingDamage(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,c=BUILDING_DAMAGE_CACHE;
  c.entries.clear();c.pixels=0;
  const samples=[],contact=document.createElement('canvas');contact.width=1200;contact.height=1120;
  const cg=contact.getContext('2d');cg.fillStyle='#435541';cg.fillRect(0,0,1200,1120);
  let alphaDifferences=0,healthyDifferences=0,peakPixels=0,peakCanvases=0;
  const variants=Object.keys(B).flatMap(kind=>['house','tc'].includes(kind)?[0,1,2,3].map(age=>({kind,age})):[{kind,age:undefined}]);
  for(const {kind,age} of variants)for(let team=0;team<4;team++){
   const art=paintedBuildingFrame(kind,team,0,age),f=art.f,source=document.createElement('canvas');source.width=f.w;source.height=f.h;
   const g=source.getContext('2d');g.drawImage(art.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const original=g.getImageData(0,0,f.w,f.h).data,changes=[];
   for(const stage of [1,2]){
    const damaged=damagedBuildingArtwork(art,stage),q=damaged.f;
    if(q.w!==f.w||q.h!==f.h||q.ax!==f.ax||q.ay!==f.ay)throw Error('Damage changed native geometry');
    const pixels=damaged.img.getContext('2d').getImageData(0,0,f.w,f.h).data;let changed=0;
    for(let i=0;i<original.length;i+=4){if(original[i+3]!==pixels[i+3])alphaDifferences++;if(original[i+3]>32&&(original[i]!==pixels[i]||original[i+1]!==pixels[i+1]||original[i+2]!==pixels[i+2]))changed++}
    changes.push(changed);peakPixels=Math.max(peakPixels,c.pixels);peakCanvases=Math.max(peakCanvases,c.entries.size);
   }
   // Repair and healthy rendering bypass the overlay completely.
   if(damagedBuildingArtwork(art,0)!==art)healthyDifferences++;
   samples.push({kind,age,team,changedPixels:changes});
   if(team===0&&(age===undefined||age===3)&&['house','tc','castle','dock'].includes(kind)){
    const row=['house','tc','castle','dock'].indexOf(kind),scale=Math.min(240/f.w,225/f.h);
    for(let col=0;col<4;col++){
     drawBuildingArtwork(cg,art,col*300+150,row*280+265,scale,true,1,false,[0,1,2,0][col],2.4);
     cg.fillStyle='#fff0ce';cg.font='16px system-ui';cg.fillText(kind+' '+['healthy','damaged','critical','repaired'][col],col*300+15,row*280+20);
    }
   }
  }
  const base={netId:'damage-fixture',k:'house',t:0,x:20,y:20,s:B.house.s,done:true,pr:B.house.bt,hp:B.house.hp*.2,mh:B.house.hp,q:[]};
  let hiddenRetained=false,hiddenRepairRetained=false,unknownFallback=false;
  const sight=S.vs,enemy={...base,t:1,hp:B.house.hp};
  try{
   S.vs=new Uint8Array(W*H);unknownFallback=buildingVisualDamage(enemy)===0;
   S.vs[20*W+20]=1;buildingVisualDamage(enemy);S.vs.fill(0);enemy.hp=B.house.hp*.2;hiddenRetained=buildingVisualDamage(enemy)===0;
   S.vs[20*W+20]=1;buildingVisualDamage(enemy);S.vs.fill(0);enemy.hp=B.house.hp;hiddenRepairRetained=buildingVisualDamage(enemy)===2;
  }finally{S.vs=sight}
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),map=CK_UNIT_MAP.create({canvas,description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
  const oldSolo=X.drawImage,oldMap=ctx.drawImage,soloStages=[],mapStages=[];
  try{
   X.drawImage=function(...a){soloStages.push(a[0].paintedDamageStage||0);return oldSolo.apply(this,a)};
   ctx.drawImage=function(...a){mapStages.push(a[0].paintedDamageStage||0);return oldMap.apply(this,a)};
   drawBld(base);map.refresh({...S,us:[],bs:[base]},0,W,H,true);
   base.hp=base.mh;drawBld(base);map.refresh({...S,us:[],bs:[base]},0,W,H,true);
  }finally{X.drawImage=oldSolo;ctx.drawImage=oldMap}
  // Animated effects vary with clock without allocating textures or entities.
  const effect=document.createElement('canvas');effect.width=effect.height=256;const eg=effect.getContext('2d'),effectHashes=[];
  for(const time of [.1,.5,.9]){
   eg.clearRect(0,0,256,256);drawBuildingDamageEffects(eg,128,240,180,200,2,time);const p=eg.getImageData(0,0,256,256).data;let hash=2166136261;for(const value of p)hash=Math.imul(hash^value,16777619);effectHashes.push(hash>>>0);
  }
  const warm=()=>{for(const kind of ['house','tc'])for(let team=0;team<2;team++)for(const stage of [1,2])damagedBuildingArtwork(paintedBuildingFrame(kind,team,0,3),stage)};
  warm();const ready=c.creations;warm();const warmAllocations=c.creations-ready;
  const originalCreate=document.createElement,art=paintedBuildingFrame('house',0,0,3);let allocationFallback=false;
  c.entries.clear();c.pixels=0;
  try{document.createElement=function(tag,...a){if(tag==='canvas')throw Error('test canvas unavailable');return originalCreate.call(this,tag,...a)};allocationFallback=damagedBuildingArtwork(art,1)===art}finally{document.createElement=originalCreate}
  return {samples,alphaDifferences,healthyDifferences,peakPixels,peakCanvases,limit:c.limit,warmAllocations,allocationFallback,hiddenRetained,hiddenRepairRetained,unknownFallback,soloStages,mapStages,effectHashes,
   before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,image:contact.toDataURL()};
 });
 await writeFile(output+'/building-damage.png',Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
 await writeFile(output+'/building-damage.json',JSON.stringify(result,null,2));
 assert.equal(result.before,result.after);assert.equal(result.alphaDifferences,0);assert.equal(result.healthyDifferences,0);
 assert.ok(result.samples.length===112&&result.samples.every(s=>s.changedPixels.every(n=>n>100)));
 assert.ok(result.peakPixels<=result.limit&&result.peakCanvases>0);assert.equal(result.warmAllocations,0);
 assert.ok(result.hiddenRetained&&result.hiddenRepairRetained&&result.unknownFallback&&result.allocationFallback);
 assert.deepEqual(result.soloStages,[2,0]);assert.ok(result.mapStages.includes(2)&&result.mapStages.at(-1)===0);
 assert.equal(new Set(result.effectHashes).size,3);
 return result;
}
