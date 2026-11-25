import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkEliteArtwork(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash;
  const saved={civ:S.civ,tech:S.tech,us:S.us,bs:S.bs,sel:S.sel};
  const original=unitAssetFrame,originalDraw=X.drawImage,originalTexture=troopFrameTexture;
  const contact=document.createElement('canvas');contact.width=1536;contact.height=8448;
  const g=contact.getContext('2d');g.fillStyle='#263c36';g.fillRect(0,0,1536,8448);
  const mapCanvas=document.createElement('canvas'),mapContext=mapCanvas.getContext('2d'),originalMapDraw=mapContext.drawImage;
  const map=CK_UNIT_MAP.create({canvas:mapCanvas,description:document.createElement('p'),submit:()=>({ok:false}),leave(){}});
  const samples=[],paletteComparisons=[],selection=[],draws=[],frames=new Set();let current='';
  try{
   S.us=[];S.bs=[];S.sel=[];
   unitAssetFrame=function(...args){const art=original(...args);if(current&&art){selection.push({pass:current,kind:args[0],team:args[1],elite:!!art.elite});frames.add(art.img)}return art};
   troopFrameTexture=function(art,...args){const frame=originalTexture(art,...args);if(frame&&frames.has(art.img))frames.add(frame);return frame};
   X.drawImage=function(...a){if(current&&frames.has(a[0]))draws.push(current);return originalDraw.apply(this,a)};
   mapContext.drawImage=function(...a){if(current&&frames.has(a[0]))draws.push(current);return originalMapDraw.apply(this,a)};
   const roster=[['huskarl',18],['lbow',1],['mgd',2],['axe',0],['woad',6],['bers',7],['saml',11],['tk',5],['jaguar',19],['kamayuk',21],['shotel',22],['gbeto',23],['obuch',35],['jan',9],['chuko',10],['genoa',15],['plumed',20],['rattan',28],['composite',41],['urumi',37],['chakram',39],['serjeant',34],['cata',3],['boyar',16],['leitis',32],['tarkan',17],['keshik',30],['monaspa',42],['conq',14],['huszar',25],['coust',33],['mamel',8],['kipchak',31],['centurion',40],['arambai',27],['konnik',29],['ele',4],['eled',13],['wagon',24],['orgun',26],['husswagon',36],['ratha',38],['rathaM',38],['footkonnik',29]];
   for(const [row,[kind,id]] of roster.entries()){
    // One review zoom per unit across its whole pose range. A long spear must
    // not be clipped by the review canvas or shrink only on its strike frame.
    let previewZoom=2.6;
    for(const state of [1,2])for(let phase=0;phase<8;phase++){
     const art=original(kind,0,{state,time:0,phase:phase/8},true),f=art.f;
     previewZoom=Math.min(previewZoom,84/(Math.max(f.ax,f.w-f.ax)*art.sc),168/(f.ay*art.sc));
    }
    S.civ=[id,id];S.tech=[{},{}];
    if(original(kind,0,{state:1,time:0},!!eliteUniqueUnitAppearance(kind,0)).elite)throw Error('Elite before research');
    S.tech[0][CIV[id].elite.k]=1;
    const actor={netId:'elite-art-'+kind,k:kind,t:0,x:24,y:24,hp:U[kind].hp,o:'a',cd:U[kind].cd*.5,p:[],rp:0,car:0,hit:-99};
    current=kind;drawUnit(actor,new Set());current='';
    if(!selection.some(s=>s.pass===kind&&s.elite)||!draws.includes(kind))throw Error('Solo did not draw Elite '+kind);
    // Deliberately disagree with the solo world: multiplayer must use the
    // supplied projection's researched appearance and draw its actual texture.
    const research=S.tech,world={...S,us:[actor],bs:[],tech:research};
    S.tech=[{},{}];current='map-'+kind;
    try{map.refresh(world,0,W,H,true)}finally{S.tech=research;current=''}
    if(!selection.some(s=>s.pass==='map-'+kind&&s.elite)||!draws.includes('map-'+kind))throw Error('Map did not draw Elite '+kind);
    if(original(kind,1,{state:1,time:0},!!eliteUniqueUnitAppearance(kind,1)).elite)throw Error('Elite leaked to opponent');
    S.tech[1][CIV[id].elite.k]=1;
    for(let team=0;team<4;team++)for(const state of[1,2]){
     const hashes=new Set();let minimum=Infinity,edgePixels=0;
     for(let phase=0;phase<8;phase++){
      const art=original(kind,team,{state,time:0,heading:0,phase:phase/8},true),f=art.f;
      if(!art.elite||art.img.paintedTeam!==team)throw Error('Wrong Elite palette');
      const cv=document.createElement('canvas');cv.width=192;cv.height=192;
      const ctx=cv.getContext('2d'),scale=art.sc*previewZoom;
      drawPaintedTroop(ctx,art,96,182,scale,state,0,phase%2===0,kind,phase/8);
      const pixels=ctx.getImageData(0,0,192,192).data;let hash=2166136261,opaque=0;
      for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>32)opaque++}
      for(let y=0;y<192;y++)for(let x=0;x<192;x++)if((x<2||x>=190||y<2||y>=190)&&pixels[(y*192+x)*4+3]>32)edgePixels++;
      hashes.add(hash>>>0);minimum=Math.min(minimum,opaque);
      if(team<2&&[0,3].includes(phase)){
       const col=team*4+(state-1)*2+(phase===3?1:0);g.drawImage(cv,col*192,row*192);
      }
     }
     samples.push({kind,team,state,distinct:hashes.size,minimum,edgePixels,previewZoom});
    }
    // A mathematically correct tint can still leave nearly identical teams if
    // the source cloth is too grey to enter the unchanged blue-colour mask.
    // Compare matching rendered poses, not just metadata or palette labels.
    for(let col=0;col<4;col++){
     const blue=g.getImageData(col*192,row*192,192,192).data;
     const red=g.getImageData((col+4)*192,row*192,192,192).data;
     let changed=0;
     for(let i=0;i<blue.length;i+=4)if(Math.max(Math.abs(blue[i]-red[i]),Math.abs(blue[i+1]-red[i+1]),Math.abs(blue[i+2]-red[i+2]))>20)changed++;
     paletteComparisons.push({kind,state:col<2?'walk':'attack',phase:col%2?3:0,changed});
    }
    const atlas=ASSET.atl['painted-elite-'+kind],ok=atlas.ok;
    try{atlas.ok=false;if(original(kind,0,{state:1,time:0},true)?.elite)throw Error('Elite failed to fall back')}
    finally{atlas.ok=ok}
   }
  }finally{S.civ=saved.civ;S.tech=saved.tech;S.us=saved.us;S.bs=saved.bs;S.sel=saved.sel;unitAssetFrame=original;X.drawImage=originalDraw;troopFrameTexture=originalTexture;mapContext.drawImage=originalMapDraw}
  return {samples,paletteComparisons,selection,draws,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:contact.toDataURL()};
 });
 assert.equal(result.before,result.after);
 assert.equal(result.samples.length,352);
 assert.ok(result.samples.every(s=>s.distinct===8&&s.minimum>150),'all Elite actions have eight decoded nonempty poses for four palettes');
 assert.ok(result.samples.every(s=>s.edgePixels===0),'review cells retain entire weapons, shields and feet');
 assert.equal(result.paletteComparisons.length,176);
 assert.ok(result.paletteComparisons.every(s=>s.changed>=100),'every reviewed blue/red pose retains a visible team-colour area');
 await writeFile(output+'/painted-elites.png',Buffer.from(result.data.split(',')[1],'base64'));
 delete result.data;return result;
}
