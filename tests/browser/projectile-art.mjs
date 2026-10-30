import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkProjectileArtwork(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,styles=['arrow','bolt','heavy-bolt','javelin','bullet','cannon','stone','axe','blade'];
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=660;const g=canvas.getContext('2d');g.fillStyle='#435541';g.fillRect(0,0,1200,660);
  const scratch=document.createElement('canvas');scratch.width=scratch.height=128;const sg=scratch.getContext('2d'),samples=[];
  for(const [i,style] of styles.entries()){
   const x=i%3*400,y=Math.floor(i/3)*220,hashes=[];
   for(const scale of [1,2])for(const heading of [0,Math.PI/3,Math.PI,Math.PI*1.5]){
    sg.clearRect(0,0,128,128);drawProjectileArtwork(sg,64,64,heading,style,.4,scale);const p=sg.getImageData(0,0,128,128).data;let hash=2166136261,opaque=0;
    for(let n=0;n<p.length;n++){hash=Math.imul(hash^p[n],16777619);if(n%4===3&&p[n]>32)opaque++}
    if(opaque<3)throw Error('Empty projectile '+style);hashes.push(hash>>>0);
   }
   samples.push({style,hashes});g.fillStyle='#fff0ce';g.font='19px system-ui';g.fillText(style,x+20,y+30);
   for(const [j,scale] of [1,2,8].entries()){drawProjectileArtwork(g,x+70+j*120,y+115,0,style,.4,scale);g.fillStyle='#fff0ce';g.font='14px system-ui';g.fillText(scale+'x',x+60+j*120,y+185)}
  }
  const saved={shots:S.pj,sight:S.vs,camX:cam.x,camY:cam.y},original=drawProjectileArtwork,calls=[];
  let fixedHeading=false,projectedKeys=[],visibleCount=0,isolated=true;
  const target=S.us[0];
  try{
   S.pj=[{x:20.5,y:20.5,tx:24.5,ty:20.5,a:{k:'bomb',t:1},t:target},
    {x:62.5,y:62.5,tx:64.5,ty:62.5,a:{k:'arc',t:1},t:target},
    {x:20.5,y:20.5,tx:24.5,ty:20.5,a:{k:'arc',t:1},t:target,dead:1}];
   S.vs=new Uint8Array(W*H);S.vs[20*W+20]=1;
   const state=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
   drawProjectileArtwork=function(...a){calls.push({view:a[0]===X?'solo':'map',style:a[4],heading:a[3]});return original(...a)};
   const position=w2s(20.5,20.5);cam.x+=position[0]-CW/2;cam.y+=position[1]-CH/2;
   drawWorld();
   const mapCanvas=document.createElement('canvas'),map=CK_UNIT_MAP.create({canvas:mapCanvas,description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
   const projection=CK_UNIT_MAP.project(S,0,W,H).battlefield.projectiles;
   visibleCount=projection.length;projectedKeys=Object.keys(projection[0]).sort();fixedHeading=projection[0].heading===0;
   map.refresh(S,0,W,H,true);isolated=state===CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  }finally{S.pj=saved.shots;S.vs=saved.sight;cam.x=saved.camX;cam.y=saved.camY;drawProjectileArtwork=original}
  return {samples,calls,fixedHeading,projectedKeys,visibleCount,isolated,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,image:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.isolated&&result.fixedHeading);assert.equal(result.visibleCount,1);
 assert.deepEqual(result.projectedKeys,['heading','style','x','y']);assert.deepEqual(result.calls.map(c=>c.view),['solo','map']);assert.ok(result.calls.every(c=>c.style==='cannon'));
 assert.equal(new Set(result.samples.map(s=>s.hashes[0])).size,9);
 await writeFile(output+'/projectile-art.png',Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
 await writeFile(output+'/projectile-art.json',JSON.stringify(result,null,2));return result;
}
