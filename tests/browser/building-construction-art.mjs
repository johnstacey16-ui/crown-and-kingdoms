import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkBuildingConstruction(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,samples=[];
  const c=document.createElement('canvas');c.width=280;c.height=260;const g=c.getContext('2d');
  const contact=document.createElement('canvas');contact.width=1500;contact.height=1120;const cg=contact.getContext('2d');
  cg.fillStyle='#435541';cg.fillRect(0,0,contact.width,contact.height);
  const bytes=()=>g.getImageData(0,0,c.width,c.height).data;
  let completedDifferences=0;
  for(const kind of Object.keys(B))for(let team=0;team<4;team++){
   const art=paintedBuildingFrame(kind,team,0,3);if(!art?.painted)throw Error('Missing building '+kind);
   // Construction acceptance isolates the native reveal. Age fittings have
   // their own all-building test and are intentionally disabled here.
   const constructionArt={...art,ageDetail:false};
   const f=art.f,scale=Math.min(240/f.w,220/f.h),hashes=[];
   for(const progress of [0,.3,.65,.95,1]){
    g.clearRect(0,0,c.width,c.height);drawBuildingArtwork(g,constructionArt,140,246,scale,progress===1,progress);
    const pixels=bytes();let hash=2166136261,opaque=0;
    for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>32)opaque++}
    hashes.push(hash>>>0);if(opaque<150)throw Error('Empty construction '+kind);
    if(team===0&&['house','tc','castle','dock'].includes(kind)){
     const col=[0,.3,.65,.95,1].indexOf(progress),row=['house','tc','castle','dock'].indexOf(kind);
     cg.drawImage(c,col*300+10,row*280+15);cg.fillStyle='#fff0ce';cg.font='16px system-ui';cg.fillText(kind+' '+Math.round(progress*100)+'%',col*300+15,row*280+20);
    }
    if(progress===1){
     const actual=pixels;g.clearRect(0,0,c.width,c.height);g.drawImage(art.img,f.x,f.y,f.w,f.h,140-f.ax*scale,246-f.ay*scale,f.w*scale,f.h*scale);
     const expected=bytes();for(let i=0;i<expected.length;i++)if(actual[i]!==expected[i])completedDifferences++;
    }
   }
   samples.push({kind,team,distinct:new Set(hashes).size});
  }
  // Exercise both callers with a real unfinished building and copied projection.
  const base={netId:'construction-fixture',k:'house',x:20,y:20,s:B.house.s,t:0,hp:100,mh:B.house.hp,pr:B.house.bt*.3,done:false,q:[]};
  const oldX=X.drawImage,oldRect=X.rect,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),oldMapRect=ctx.rect;
  let soloClips=0,mapClips=0,hiddenRetained=false,unknownFallback=false;
  const sight=S.vs,enemy={...base,t:1};
  try{
   S.vs=new Uint8Array(W*H);unknownFallback=buildingVisualConstruction(enemy).complete;
   S.vs[20*W+20]=1;const seen=buildingVisualConstruction(enemy);
   S.vs.fill(0);enemy.done=true;enemy.pr=B.house.bt;
   const hidden=buildingVisualConstruction(enemy);hiddenRetained=!hidden.complete&&hidden.progress===seen.progress;
  }finally{S.vs=sight}

  const map=CK_UNIT_MAP.create({canvas,description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
  try{
   X.rect=function(...a){soloClips++;return oldRect.apply(this,a)};drawBld(base);
   ctx.rect=function(...a){mapClips++;return oldMapRect.apply(this,a)};
   map.refresh({...S,us:[],bs:[base]},0,W,H,true);
  }finally{X.drawImage=oldX;X.rect=oldRect;ctx.rect=oldMapRect}
  return {samples,completedDifferences,soloClips,mapClips,hiddenRetained,unknownFallback,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,image:contact.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.hiddenRetained&&result.unknownFallback);assert.equal(result.completedDifferences,0);
 assert.ok(result.samples.length>=88&&result.samples.every(s=>s.distinct===5));assert.ok(result.soloClips>0&&result.mapClips>0);
 await writeFile(output+'/building-construction.png',Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
 await writeFile(output+'/building-construction.json',JSON.stringify(result,null,2));return result;
}
