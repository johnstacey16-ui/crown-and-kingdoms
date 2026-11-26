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
  const saved={shots:S.pj,sight:S.vs,camX:cam.x,camY:cam.y,civs:S.civ,tech:S.tech,units:S.us},original=drawProjectileArtwork,calls=[];
  let fixedHeading=false,projectedKeys=[],visibleCount=0,isolated=true,hulche,hulcheImage;
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
   const own=S.us.find(u=>u.t===0),hostile=S.us.find(u=>u.t===1),pairCalls=[];
   if(!own||!hostile)throw Error('Hulche art fixture needs both teams');
   const shooter={...own,k:'skirm',x:20.5,y:20.5,hp:30,ld:null,p:[],o:'i',tg:null};
   const foe={...hostile,k:'arc',x:24.5,y:20.5,hp:40,ld:null,p:[],o:'i',tg:null};
   S.civ=S.civ.slice();S.civ[0]=20;S.tech=S.tech.slice();S.tech[0]={...S.tech[0],ut20:1,thumb:1};
   S.us=S.us.map(u=>u===own?shooter:u===hostile?foe:u);S.pj=[];
   launchProjectile(shooter,foe);
   drawProjectileArtwork=(...a)=>{pairCalls.push({view:a[0]===X?'solo':'map',x:a[1],y:a[2],heading:a[3],style:a[4],scale:a[6]});return original(...a)};
   drawWorld();const projected=CK_UNIT_MAP.project(S,0,W,H).battlefield.projectiles;map.refresh(S,0,W,H,true);
   const solo=pairCalls.filter(p=>p.view==='solo'),network=pairCalls.filter(p=>p.view==='map');
   const separation=list=>list.length===2?Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y):0;
   hulche={shots:S.pj.length,weak:S.pj.filter(p=>p.a.skirmisherSecondary===true).length,projected:projected.length,
    styles:pairCalls.map(p=>p.style),soloSeparation:separation(solo),mapSeparation:separation(network)};
   const preview=document.createElement('canvas');preview.width=600;preview.height=180;const pg=preview.getContext('2d');
   pg.fillStyle='#435541';pg.fillRect(0,0,600,180);pg.fillStyle='#fff0ce';pg.font='18px system-ui';pg.fillText('Hulche javelin pair — 4x inspection',20,30);
   for(const p of solo)original(pg,300+(p.x-CW/2)*4,150+(p.y-CH/2)*4,p.heading,p.style,.4,p.scale*4);
   hulcheImage=preview.toDataURL();preview.width=preview.height=1;
  }finally{S.pj=saved.shots;S.vs=saved.sight;S.civ=saved.civs;S.tech=saved.tech;S.us=saved.units;cam.x=saved.camX;cam.y=saved.camY;drawProjectileArtwork=original}
  return {samples,calls,fixedHeading,projectedKeys,visibleCount,isolated,hulche,hulcheImage,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,image:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.isolated&&result.fixedHeading);assert.equal(result.visibleCount,1);
 assert.deepEqual(result.projectedKeys,['heading','style','x','y']);assert.deepEqual(result.calls.map(c=>c.view),['solo','map']);assert.ok(result.calls.every(c=>c.style==='cannon'));
 assert.equal(new Set(result.samples.map(s=>s.hashes[0])).size,9);
 assert.equal(result.hulche.shots,2);assert.equal(result.hulche.weak,1);assert.equal(result.hulche.projected,2);
 assert.deepEqual(result.hulche.styles,Array(4).fill('javelin'));
 assert.ok(result.hulche.soloSeparation>1&&result.hulche.mapSeparation>0,'both views draw separated javelins');
 await writeFile(output+'/hulche-projectiles.png',Buffer.from(result.hulcheImage.split(',')[1],'base64'));delete result.hulcheImage;
 await writeFile(output+'/projectile-art.png',Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
 await writeFile(output+'/projectile-art.json',JSON.stringify(result,null,2));return result;
}
