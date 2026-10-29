import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkFrameTints(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,c=TEAM_FRAME_CACHE;c.entries.clear();c.pixels=0;
  const start=c.creations;let frames=0,components=0,nativeDifferences=0,scaledDifferences=0,legacyPixels=0,peak=0,atlases=0;
  const scaled=(image,f,mirror,factor)=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const g=canvas.getContext('2d');
   const scale=Math.min(128/f.w,128/f.h)*factor;g.translate(160,310);g.scale(mirror?-scale:scale,scale);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
   g.drawImage(image,f.x,f.y,f.w,f.h,-f.ax,-f.ay,f.w,f.h);return g.getImageData(0,0,320,320).data;
  };
  for(const a of Object.values(ASSET.atl))if(a.ok&&a.meta.painted&&!a.meta.neutral){
   atlases++;const unique=new Map();for(const animation of Object.values(a.meta.anims))for(const list of animation.dirs||[animation.frames])for(const f of list)unique.set([f.x,f.y,f.w,f.h].join('/'),f);
   const list=[...unique.values()];
   for(let team=0;team<4;team++){
    const legacy=paintedTeamImage(a,team),ctx=legacy.getContext('2d');legacyPixels+=legacy.width*legacy.height;
    for(let index=0;index<list.length;index++){
     const f=list[index],actual=paintedTeamFrame(a,team,f),old=ctx.getImageData(f.x,f.y,f.w,f.h).data,now=actual.img.getContext('2d').getImageData(actual.f.x,actual.f.y,f.w,f.h).data;
     if(a.meta.motion&&(actual.f.x!==0||actual.f.y!==0||actual.f.ax!==f.ax||actual.f.ay!==f.ay||actual.img.width!==f.w||actual.img.height!==f.h))throw Error('Tint crop changed geometry');
     for(let i=0;i<old.length;i++)if(old[i]!==now[i])nativeDifferences++;components+=old.length;frames++;
     if(index===0||index===list.length-1)for(const factor of[1,2])for(const mirror of[false,true]){
      const oldCrop=a.meta.motion?troopFrameTexture({img:legacy,f}):null;
      const expected=scaled(oldCrop||legacy,oldCrop?{...f,x:0,y:0}:f,mirror,factor),actualPixels=scaled(actual.img,actual.f,mirror,factor);
      for(let i=0;i<expected.length;i++)if(expected[i]!==actualPixels[i])scaledDifferences++;
     }
     peak=Math.max(peak,c.pixels);if(c.pixels>c.limit)throw Error('Tint cache exceeded retained-pixel budget');
    }
    delete a.teams[team];
   }
  }
  // An ordinary repeat of a small active roster must allocate no new canvases.
  const warm=()=>{for(const kind of['mil','vil','knight','arc','bld_house_age_3','bld_tc_age_3'])for(let team=0;team<4;team++)assetFrame(kind,team,0,0,.1)};
  warm();const ready=c.creations;warm();const warmAllocations=c.creations-ready;
  return {atlases,frames,components,nativeDifferences,scaledDifferences,legacyTotalCanvasPixels:legacyPixels,retainedPixelLimit:c.limit,peakRetainedPixels:peak,retainedPixels:c.pixels,newCanvases:c.creations-start,evictions:c.evictions,warmAllocations,legacyMotionCopiesRetained:Object.values(ASSET.atl).filter(a=>a.meta.motion).reduce((n,a)=>n+Object.keys(a.teams||{}).length,0),before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash};
 });
 assert.equal(result.before,result.after);assert.ok(result.atlases>=51&&result.frames>3000);assert.equal(result.nativeDifferences,0);assert.equal(result.scaledDifferences,0);
 assert.ok(result.peakRetainedPixels<=result.retainedPixelLimit);assert.equal(result.warmAllocations,0);assert.equal(result.legacyMotionCopiesRetained,0);
 await writeFile(output+'/frame-tints.json',JSON.stringify(result,null,2));return result;
}
