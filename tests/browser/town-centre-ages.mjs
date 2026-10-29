import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkTownCentreAges(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,atlas=ASSET.atl['painted-town-centre-ages'],savedAge=S.age,savedSight=S.vs[20*W+20];
  const originalSolo=X.drawImage,samples=[],draws=[],mapDraws=[];
  const contact=document.createElement('canvas');contact.width=2000;contact.height=1600;const g=contact.getContext('2d');g.fillStyle='#435541';g.fillRect(0,0,2000,1600);
  const mapCanvas=document.createElement('canvas'),description=document.createElement('p'),map=CK_UNIT_MAP.create({canvas:mapCanvas,description,submit:()=>({ok:false}),leave(){}}),context=mapCanvas.getContext('2d'),originalMap=context.drawImage;
  const base={netId:'tc-age-fixture',k:'tc',x:20,y:20,s:3,hp:B.tc.hp,mh:B.tc.hp,pr:B.tc.bt,done:true,q:[]};
  let phase='',fallback=false,unknownFallback=false,hiddenRetained=false;
  try{
   for(let age=0;age<4;age++)for(let team=0;team<4;team++){
    const art=paintedBuildingFrame('tc',team,0,age),f=art.f,c=document.createElement('canvas');c.width=320;c.height=280;const ctx=c.getContext('2d'),sc=250/f.w;
    ctx.drawImage(art.img,f.x,f.y,f.w,f.h,160-f.ax*sc,275-f.ay*sc,f.w*sc,f.h*sc);
    const pixels=ctx.getImageData(0,0,320,280).data;let hash=2166136261,opaque=0,transparent=0;
    for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3){if(pixels[i]>128)opaque++;if(!pixels[i])transparent++}}
    samples.push({age,team,hash:hash>>>0,opaque,transparent,tag:art.img.paintedTeam??0});
    if(team<2)for(const scale of [1,2]){const z=198*scale/f.w,row=team+(scale-1)*2;g.drawImage(art.img,f.x,f.y,f.w,f.h,age*500+250-f.ax*z,row*400+385-f.ay*z,f.w*z,f.h*z)}
   }
   const images=new Set([atlas.img,...Object.values(atlas.teams||{})]);
   X.drawImage=function(...a){if(images.has(a[0]))draws.push({phase,x:a[1],y:a[2]});return originalSolo.apply(this,a)};
   context.drawImage=function(...a){if(images.has(a[0]))mapDraws.push({phase,x:a[1],y:a[2]});return originalMap.apply(this,a)};
   const world={...S,teamN:4,tech:Array.from({length:4},()=>({})),res:Array.from({length:4},()=>({f:200,w:200,g:100,s:0})),civ:[0,1,2,3],dip:createDiplomacy(4),us:[],bs:[]};
   for(let age=0;age<4;age++)for(let team=0;team<4;team++){
    phase=age+'/'+team;S.age=[age,age,age,age];S.vs[20*W+20]=1;drawBld({...base,t:team});
    world.age=[age,age,age,age];world.bs=[{...base,t:team}];map.refresh(world,team,W,H,true);
    const frame=paintedBuildingFrame('tc',team,0,age).f;
    const actual=mapDraws.at(-1);if(actual?.phase!==phase||actual.x!==frame.x||actual.y!==frame.y)throw Error('Map missed Town Centre stage '+phase);
   }
   const b={...base,t:1},visible=S.vs[20*W+20];
   try{S.age=[0,1];S.vs[20*W+20]=1;buildingVisualAge(b);S.vs[20*W+20]=0;S.age[1]=3;hiddenRetained=buildingVisualAge(b)===1}finally{S.vs[20*W+20]=visible}
   const ok=atlas.ok;try{atlas.ok=false;fallback=paintedBuildingFrame('tc',1,0,3).img!==atlas.teams?.[1]&&!!paintedBuildingFrame('tc',1,0,3)}finally{atlas.ok=ok}
   unknownFallback=paintedBuildingFrame('tc',0,0,undefined).img!==atlas.img;
  }finally{S.age=savedAge;S.vs[20*W+20]=savedSight;X.drawImage=originalSolo;context.drawImage=originalMap}
  return {samples,solo:draws,map:mapDraws,hiddenRetained,fallback,unknownFallback,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:contact.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.hiddenRetained&&result.fallback&&result.unknownFallback);
 assert.equal(result.solo.length,16);assert.equal(result.map.length,16);assert.equal(new Set(result.samples.map(s=>s.hash)).size,16);
 for(const sample of result.samples)assert.ok(sample.opaque>8000&&sample.transparent>20000&&sample.tag===sample.team);
 for(let age=0;age<4;age++){const calls=result.solo.filter(d=>d.phase.startsWith(age+'/'));assert.equal(new Set(calls.map(d=>d.x+'/'+d.y)).size,1)}
 await writeFile(output+'/town-centre-ages.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
