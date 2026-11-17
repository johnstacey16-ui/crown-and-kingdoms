import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkEliteArtwork(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const saved={civ:S.civ,tech:S.tech,us:S.us,bs:S.bs,sel:S.sel};
  const original=unitAssetFrame,originalDraw=X.drawImage;
  const contact=document.createElement('canvas');contact.width=1536;contact.height=768;
  const g=contact.getContext('2d');g.fillStyle='#263c36';g.fillRect(0,0,1536,768);
  const samples=[],selection=[],draws=[],frames=new Set();let current='';
  try{
   S.us=[];S.bs=[];S.sel=[];
   unitAssetFrame=function(...args){const art=original(...args);if(current&&art){selection.push({pass:current,kind:args[0],team:args[1],elite:!!art.elite});frames.add(art.img)}return art};
   X.drawImage=function(...a){if(current&&frames.has(a[0]))draws.push(current);return originalDraw.apply(this,a)};
   const roster=[['huskarl',18],['lbow',1],['mgd',2],['axe',0]];
   for(const [row,[kind,id]] of roster.entries()){
    S.civ=[id,id];S.tech=[{},{}];
    if(original(kind,0,{state:1,time:0},!!eliteUniqueUnitUpgrade(kind,0)).elite)throw Error('Elite before research');
    S.tech[0][CIV[id].elite.k]=1;
    const actor={netId:'elite-art-'+kind,k:kind,t:0,x:24,y:24,hp:U[kind].hp,o:'a',cd:U[kind].cd*.5,p:[],rp:0,car:0,hit:-99};
    current=kind;drawUnit(actor,new Set());current='';
    if(!selection.some(s=>s.pass===kind&&s.elite)||!draws.includes(kind))throw Error('Solo did not draw Elite '+kind);
    if(original(kind,1,{state:1,time:0},!!eliteUniqueUnitUpgrade(kind,1)).elite)throw Error('Elite leaked to opponent');
    S.tech[1][CIV[id].elite.k]=1;
    for(let team=0;team<4;team++)for(const state of[1,2]){
     const hashes=new Set();let minimum=Infinity;
     for(let phase=0;phase<8;phase++){
      const art=original(kind,team,{state,time:0,heading:0,phase:phase/8},true),f=art.f;
      if(!art.elite||art.img.paintedTeam!==team)throw Error('Wrong Elite palette');
      const cv=document.createElement('canvas');cv.width=192;cv.height=192;
      const ctx=cv.getContext('2d'),scale=art.sc*2.6;
      drawPaintedTroop(ctx,art,96,182,scale,state,0,phase%2===0,kind,phase/8);
      const pixels=ctx.getImageData(0,0,192,192).data;let hash=2166136261,opaque=0;
      for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>32)opaque++}
      hashes.add(hash>>>0);minimum=Math.min(minimum,opaque);
      if(team<2&&[0,3].includes(phase)){
       const col=team*4+(state-1)*2+(phase===3?1:0);g.drawImage(cv,col*192,row*192);
      }
     }
     samples.push({kind,team,state,distinct:hashes.size,minimum});
    }
    const atlas=ASSET.atl['painted-elite-'+kind],ok=atlas.ok;
    try{atlas.ok=false;if(original(kind,0,{state:1,time:0},true)?.elite)throw Error('Elite failed to fall back')}
    finally{atlas.ok=ok}
   }
  }finally{S.civ=saved.civ;S.tech=saved.tech;S.us=saved.us;S.bs=saved.bs;S.sel=saved.sel;unitAssetFrame=original;X.drawImage=originalDraw}
  return {samples,selection,draws,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:contact.toDataURL()};
 });
 assert.equal(result.before,result.after);
 assert.equal(result.samples.length,32);
 assert.ok(result.samples.every(s=>s.distinct===8&&s.minimum>150),'all Elite actions have eight decoded nonempty poses for four palettes');
 await writeFile(output+'/painted-elites.png',Buffer.from(result.data.split(',')[1],'base64'));
 delete result.data;return result;
}
