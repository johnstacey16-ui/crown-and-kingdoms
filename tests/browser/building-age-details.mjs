import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

export async function checkBuildingAgeDetails(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,kinds=Object.keys(B).filter(k=>k!=='house'&&k!=='tc'),samples=[];
  const preview=document.createElement('canvas');preview.width=960;preview.height=800;const pg=preview.getContext('2d');pg.fillStyle='#314238';pg.fillRect(0,0,preview.width,preview.height);
  for(const [ki,kind] of kinds.entries())for(let age=0;age<4;age++)for(let team=0;team<4;team++){
   const art=paintedBuildingFrame(kind,team,0,age),f=art.f,canvas=document.createElement('canvas');canvas.width=180;canvas.height=170;const g=canvas.getContext('2d'),scale=145/f.w;
   drawBuildingArtwork(g,art,90,165,scale,true,1,false,0,0);
   const pixels=g.getImageData(0,0,180,170).data;let hash=2166136261,opaque=0;for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>32)opaque++}
   samples.push({kind,age,team,hash:hash>>>0,opaque,base:art.img.paintedSourceFrame||art.f});
   if(team===0){const col=ki%5,row=Math.floor(ki/5),cell=age%2+(age>1?2:0);if(age===3)pg.drawImage(canvas,col*192,row*200,180,170)}
  }
  const saved={age:S.age,vs:S.vs,bs:S.bs,sel:S.sel},calls=[];let solo=[],map=[];
  const original=drawBuildingAgeDetails;drawBuildingAgeDetails=function(g,art,...args){calls.push({kind:art.architectureKind,age:art.architectureAge});return original(g,art,...args)};
  try{
   const base={netId:'age-detail-fixture',k:'mill',x:20,y:20,s:B.mill.s||2,hp:B.mill.hp,mh:B.mill.hp,pr:B.mill.bt,done:true,q:[],t:0};
   for(let age=0;age<4;age++){S.age=[age,age];S.vs[20*W+20]=1;S.bs=[base];calls.length=0;drawBld(base);solo.push(...calls);const world={...S,teamN:2,us:[],bs:[base],age:[age,age],dip:createDiplomacy(2),tech:[{},{}],res:[{f:0,w:0,g:0,s:0},{f:0,w:0,g:0,s:0}]};const canvas=document.createElement('canvas'),description=document.createElement('p'),mapView=CK_UNIT_MAP.create({canvas,description,submit:()=>({ok:false}),leave(){}});calls.length=0;mapView.refresh(world,0,W,H,true);map.push(...calls)}
  }finally{drawBuildingAgeDetails=original;S.age=saved.age;S.vs=saved.vs;S.bs=saved.bs;S.sel=saved.sel}
  return {samples,solo,map,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:preview.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.equal(result.samples.length,20*4*4);
 for(const kind of [...new Set(result.samples.map(s=>s.kind))])for(let team=0;team<4;team++){
  const set=result.samples.filter(s=>s.kind===kind&&s.team===team);assert.equal(new Set(set.map(s=>s.hash)).size,4);assert.ok(set.every(s=>s.opaque>250));
  assert.ok(set.every(s=>JSON.stringify(s.base)===JSON.stringify(set[0].base)),'native source frame remains fixed across ages');
 }
 assert.deepEqual(result.solo.map(s=>s.age),[0,1,2,3]);assert.deepEqual(result.map.map(s=>s.age),[0,1,2,3]);
 await writeFile(output+'/building-age-details.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
