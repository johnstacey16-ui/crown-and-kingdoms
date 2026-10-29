import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkMapTerrainCache(page,output,prefix='terrain-cache'){
 const result=await page.evaluate(()=>{
  const original=terrainTileTexture,create=document.createElement.bind(document),before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  let allocations=0;document.createElement=(...a)=>{if(a[0]==='canvas')allocations++;return create(...a)};
  const context=document.getElementById('battlefield-art').getContext('2d');
  function sample(native){
   clearTerrainBlend();terrainTileTexture=(k,x,y,ns,res)=>original(k,x,y,ns,native?64:res);
   for(let i=0;i<3;i++)artMap.refresh(S,0,W,H,true);
   allocations=0;const start=performance.now();for(let i=0;i<20;i++)artMap.refresh(S,0,W,H,true);
   return {averageMs:(performance.now()-start)/20,canvases:allocations,entries:TERRAIN_BLEND.size,pixels:terrainBlendPixels,data:context.getImageData(0,0,680,680).data,url:context.canvas.toDataURL()};
  }
  let baseline,optimized;
  try{baseline=sample(true);optimized=sample(false)}finally{terrainTileTexture=original;document.createElement=create}
  let sum=0,changed=0,max=0;for(let i=0;i<baseline.data.length;i+=4){let different=false;for(let c=0;c<3;c++){const d=Math.abs(baseline.data[i+c]-optimized.data[i+c]);sum+=d;max=Math.max(max,d);if(d)different=true}if(different)changed++}
  const beforeImage=baseline.url,afterImage=optimized.url;delete baseline.data;delete baseline.url;delete optimized.data;delete optimized.url;
  return {baseline,optimized,pixels:{meanRGBDelta:sum/(680*680*3),maxChannelDelta:max,changedPixels:changed},before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,beforeImage,afterImage};
 });
 assert.equal(result.before,result.after);assert.equal(result.optimized.canvases,0,'stationary unit-map terrain reuses warmed textures');
 assert.ok(result.optimized.pixels<=1024*1024,'same 4 MiB RGBA pixel budget');
 assert.ok(result.optimized.canvases<=result.baseline.canvases);assert.ok(result.pixels.meanRGBDelta<2,'display-sized cache keeps terrain pixel differences small');
 for(const [name,key]of [[prefix+'-before','beforeImage'],[prefix+'-after','afterImage']]){await writeFile(output+'/'+name+'.png',Buffer.from(result[key].split(',')[1],'base64'));delete result[key]}
 return result;
}

// Fully explored coastal terrain is a cache stress fixture, not normal fog policy.
export async function checkNavalTerrainCache(browser,origin,output){
 const page=await browser.newPage({viewport:{width:960,height:850}});
 try{
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>typeof startScenario==='function'&&ASSET.n===57&&PAINT.terrain);
  await page.evaluate(()=>{
   startScenario(12);mode='title';
   const commands=window.CK_GAME_COMMANDS;
   window.CK_GAME_COMMANDS={...commands,visibility:()=>new Uint8Array(W*H).fill(1)};
   const canvas=document.createElement('canvas');canvas.id='battlefield-art';document.body.append(canvas);
   window.artMap=CK_UNIT_MAP.create({canvas,description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
   artMap.refresh(S,0,W,H,false);
  });
  const result=await checkMapTerrainCache(page,output,'naval-terrain-cache');
  assert.ok(result.baseline.canvases>0,'native 256-tile cache churn is exercised on the full coastal map');
  assert.ok(result.optimized.entries>256,'small textures retain the complete coastal working set');
  return result;
 }finally{await page.close()}
}
