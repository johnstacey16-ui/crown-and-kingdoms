import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

// Render dense deterministic fixtures through the real solo and projected views.
// Counts describe retained tint canvases, not process/GPU memory or Xbox FPS.
export async function checkLargeArmyTints(page,output){
 const results=[];
 for(const renderer of ['solo','team'])for(const scenario of ['normal','large','diverse','zoomed-3','zoomed-14','native-14']){
  const result=await page.evaluate(({renderer,scenario})=>{
   const saved={S,gt,zm,TW,TH,DPR,width:cv.width,height:cv.height,x:cam.x,y:cam.y,gq,perfLayerMode};
   const c=TEAM_FRAME_CACHE,canvas=document.createElement('canvas'),description=document.createElement('p');
   const map=CK_UNIT_MAP.create({canvas,description,submit:()=>({ok:false}),leave(){}});
   const world={...S,us:[],bs:[],nodes:[],rel:[],pj:[],sel:[],teamN:4,t:0,
    tech:Array.from({length:4},()=>({})),age:[3,3,3,3],civ:[0,1,2,3],
    res:Array.from({length:4},()=>({f:200,w:200,g:200,s:200})),dip:createDiplomacy(4),
    vs:new Uint8Array(W*H).fill(1),ex:new Uint8Array(W*H).fill(1),nd:Array(W*H).fill(null)};
   const measured=scenario.includes('-'),kinds=scenario==='zoomed-3'?3:14;
   const roster=measured?['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml'].slice(0,kinds):scenario==='diverse'?Object.keys(U):['mil','vil','arc','spear','knight','scout','skirm','mon'];
   const count=measured?90:scenario==='normal'?200:800,teams=scenario==='normal'?2:4;
   for(let i=0;i<count;i++){
    const kind=roster[Math.floor(i/teams)%roster.length],team=i%teams,x=28+(i%40)*.14,y=28+Math.floor(i/40)*.18;
    world.us.push({netId:'tint-army-'+i,k:kind,t:team,x,y,hp:U[kind].hp,mh:U[kind].hp,o:'i',p:[],cd:0,st:0,dr:0,car:0});
   }
   let draws=0;const context=renderer==='solo'?X:canvas.getContext('2d'),original=context.drawImage;
   context.drawImage=function(...args){if(args[0].paintedSourceFrame||TROOP_TEXTURE_CONTEXTS.has(args[0]))draws++;return original.apply(this,args)};
   const blocks=[],snap=()=>({hits:c.hits,creations:c.creations,evictions:c.evictions,draws});
   let peakPixels=0,peakCanvases=0,isolated=true,mirrored=0,animated=0;
   const samples=[];
   try{
    S=world;gq=0;perfLayerMode=2;zm=measured?(scenario==='native-14'?1:2.05):.65;TW=64*zm;TH=32*zm;
    if(measured){DPR=scenario==='native-14'?1:.6;cv.width=Math.round(CW*DPR);cv.height=Math.round(CH*DPR);}
    context.setTransform(DPR,0,0,DPR,0,0);
    cam.x=-CW/2;cam.y=62*TH/2-CH/2;
    clearTeamFrameCache();
    for(let block=0;block<3;block++){
     const start=snap(),time=performance.now();
     for(let frame=0;frame<(measured?24:8);frame++){
      // Repeat identical pose cycles: cold admission, then two warm cycles.
      world.t=gt=frame*.12;
      for(let i=0;i<count;i++){
       const u=world.us[i],direction=Math.floor(i/4)%2?-1:1;u.x=28+(i%40)*.14+direction*frame*.012;u.dr=direction<0?4:0;
       if(measured&&i%3===0){u.o='i';u.p=[];u.tg=null;}
       else if(i%2){u.o='a';u.p=[];u.cd=U[u.k].cd*(1-(frame%8)/8);u.tg={x:u.x+direction,y:u.y};}
       else{u.o='m';u.p=[[u.x+direction*2,u.y]];u.cd=0;u.tg=null;}
       const pose=unitVisualPose(u,world.t);
       if(pose.state!==0)animated++;
       if(Math.cos(pose.heading)-Math.sin(pose.heading)<0)mirrored++;
      }
      const before=CK_SIM_SYNC.worldCheckpoint(world,1).hash;
      resetGraphicsTraceFrame();const drawStart=performance.now();
      if(renderer==='solo')drawWorld();else map.refresh(world,0,W,H,true);
      // Finish the submitted canvas work instead of retaining a huge deferred
      // command stream during this synchronous benchmark.
      context.getImageData(0,0,1,1);
      samples.push({ms:performance.now()-drawStart,...GRAPHICS_TRACE.frame});
      isolated&&=before===CK_SIM_SYNC.worldCheckpoint(world,1).hash;
      peakPixels=Math.max(peakPixels,c.pixels);peakCanvases=Math.max(peakCanvases,c.entries.size);
     }
     const end=snap(),hits=end.hits-start.hits,misses=end.creations-start.creations;
     blocks.push({cycle:block,hits,misses,hitRate:hits/(hits+misses),evictions:end.evictions-start.evictions,
      nativeDraws:end.draws-start.draws,desktopElapsedMs:Math.round(performance.now()-time)});
    }
    const retainedPixels=[...c.entries.values()].reduce((sum,image)=>sum+image.width*image.height,0);
    const times=samples.map(f=>f.ms).sort((a,b)=>a-b),percentile=p=>times[Math.min(times.length-1,Math.floor(times.length*p))];
    return {renderer,scenario,units:count,teams,roster:roster.length,zoom:zm,dpr:DPR,blocks,isolated,mirrored,animated,
     samples,desktopFrameMs:{p50:percentile(.5),p95:percentile(.95),p99:percentile(.99)},
     retainedPixels,pixelAccountingMatches:retainedPixels===c.pixels,peakPixels,peakCanvases,retainedCanvases:c.entries.size,limit:c.limit};
   }finally{context.drawImage=original;S=saved.S;gt=saved.gt;zm=saved.zm;TW=saved.TW;TH=saved.TH;DPR=saved.DPR;cv.width=saved.width;cv.height=saved.height;cam.x=saved.x;cam.y=saved.y;gq=saved.gq;perfLayerMode=saved.perfLayerMode;}
  },{renderer,scenario});
  assert.ok(result.isolated&&result.pixelAccountingMatches);
  assert.ok(result.peakPixels<=result.limit&&result.retainedCanvases>0);
  for(const block of result.blocks)assert.ok(block.nativeDraws>=result.units*(scenario.includes('-')?24:8)*.9,'fixture actually draws its army');
  assert.ok(result.mirrored>0&&result.animated>0,'fixture covers mirrored and animated poses');
  if(scenario.includes('-'))assert.ok(result.mirrored/(result.units*72)>.4&&result.mirrored/(result.units*72)<.6,'approximately half of measured troops face left');
  assert.ok(result.desktopFrameMs.p95>0,'report browser frame time without claiming Xbox FPS');
  if(scenario==='normal'||scenario==='large')assert.equal(result.blocks[2].misses,0,'ordinary army reaches a warm cache');
  results.push(result);
  console.log(renderer+'/'+scenario+': '+JSON.stringify(result.blocks));
  await writeFile(output+'/large-army-tints.json',JSON.stringify(results,null,2));
 }
 await writeFile(output+'/large-army-tints.json',JSON.stringify(results,null,2));
 return results;
}
