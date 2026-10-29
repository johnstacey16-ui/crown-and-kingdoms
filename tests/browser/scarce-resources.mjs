import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function checkScarceResources(page,output){
 const result=await page.evaluate(()=>{
  const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,atlas=ASSET.atl['painted-scarce-resources'];
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=640;const g=canvas.getContext('2d');g.fillStyle='#536441';g.fillRect(0,0,1200,640);
  const textures=new Set([atlas.img]),samples=[];
  for(const [col,kind]of ['stone','gold','berry'].entries())for(let variant=0;variant<2;variant++){
   const full=assetFrame('node_'+kind+'_'+variant,0,0,0,0),low=assetFrame('node_'+kind+'_low_'+variant,0,0,0,0),f=low.f;
   textures.add(paintedNodeTexture(low,50));textures.add(paintedNodeTexture(low,54));
   const c=document.createElement('canvas');c.width=c.height=160;const ctx=c.getContext('2d'),sc=128/low.referenceWidth;
   ctx.drawImage(low.img,f.x,f.y,f.w,f.h,80-f.ax*sc,145-f.ay*sc,f.w*sc,f.h*sc);
   const p=ctx.getImageData(0,0,160,160).data;let hash=2166136261,opaque=0,transparent=0;
   for(let i=0;i<p.length;i++){hash=Math.imul(hash^p[i],16777619);if(i%4===3){if(p[i]>128)opaque++;if(!p[i])transparent++}}
   samples.push({kind,variant,hash:hash>>>0,opaque,transparent,neutral:low.img===atlas.img,smaller:f.w/low.referenceWidth<1});
   for(const [index,art] of [full,low].entries())for(let z=1;z<=2;z++){
    const f=art.f,scale=(kind==='berry'?50:54)*z/(art.referenceWidth||f.w);
    g.drawImage(art.img,f.x,f.y,f.w,f.h,col*400+90+index*190-f.ax*scale,variant*320+z*150-f.ay*scale,f.w*scale,f.h*scale);
   }
  }
  const nodes=['s','g','f'].map(k=>S.nodes.find(n=>n.k===k&&!n.fi&&!n.an&&!n.fm&&!n.trap));
  const saved=nodes.map(n=>({n,amount:n.amt,seen:S.vs[n.y*W+n.x],had:PAINT.resourceAmounts.has(n),known:PAINT.resourceAmounts.get(n)}));
  const savedJSON=JSON.stringify(nodes),selector=paintedResourceFrame,soloOriginal=X.drawImage;
  const mapCanvas=document.createElement('canvas'),description=document.createElement('p');
  const map=CK_UNIT_MAP.create({canvas:mapCanvas,description,submit:()=>({ok:false}),leave(){}}),context=mapCanvas.getContext('2d'),mapOriginal=context.drawImage;
  const calls=[],stages=[];let pass='',draws=0,fallback=true,hiddenCells=-1;
  try{
   paintedResourceFrame=function(kind,x,y,excluded,amount){if(!excluded&&['s','g','f'].includes(kind))calls.push({pass,kind,amount});return selector(kind,x,y,excluded,amount)};
   X.drawImage=function(...args){if(textures.has(args[0]))draws++;return soloOriginal.apply(this,args)};
   for(const [name,amount,seen]of [['normal',900,1],['hidden-low',10,0],['observed-low',10,1],['hidden-lower',1,0]]){
    pass='solo-'+name;const old=draws;
    for(const n of nodes){n.amt=amount;S.vs[n.y*W+n.x]=seen;drawNode(n)}
    stages.push({pass,lowDraws:draws-old});
   }
   context.drawImage=function(...args){if(textures.has(args[0]))draws++;return mapOriginal.apply(this,args)};
   for(const [name,amount,seen]of [['normal',900,1],['hidden-low',10,0],['observed-low',10,1],['hidden-lower',1,0]]){
    pass='map-'+name;const old=draws;for(const n of nodes)n.amt=amount;
    const world=seen?S:{...S,us:[],bs:[]};
    if(!seen)hiddenCells=CK_UNIT_MAP.project(world,0,W,H).battlefield.visible.length;
    map.refresh(world,0,W,H,true);stages.push({pass,lowDraws:draws-old});
   }
   const ok=atlas.ok;try{atlas.ok=false;for(const n of nodes){const a=selector(n.k,n.x,n.y,false,10);fallback&&=!!a&&a.img===ASSET.atl['painted-resources'].img}}finally{atlas.ok=ok}
  }finally{
   paintedResourceFrame=selector;X.drawImage=soloOriginal;context.drawImage=mapOriginal;
   for(const s of saved){s.n.amt=s.amount;S.vs[s.n.y*W+s.n.x]=s.seen;if(s.had)PAINT.resourceAmounts.set(s.n,s.known);else PAINT.resourceAmounts.delete(s.n)}
  }
  return {samples,stages,calls,hiddenCells,fallback,unchanged:JSON.stringify(nodes)===savedJSON,before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,data:canvas.toDataURL()};
 });
 assert.equal(result.before,result.after);assert.ok(result.unchanged&&result.fallback);assert.equal(result.hiddenCells,0);
 assert.equal(new Set(result.samples.map(x=>x.hash)).size,6);for(const s of result.samples)assert.ok(s.opaque>1800&&s.transparent>8000&&s.neutral&&s.smaller);
 for(const view of ['solo','map'])for(const [stage,expected,amount]of [['normal',0,900],['hidden-low',0,900],['observed-low',3,10],['hidden-lower',3,10]]){
  const pass=view+'-'+stage;assert.equal(result.stages.find(x=>x.pass===pass).lowDraws,expected,pass);
  const calls=result.calls.filter(c=>c.pass===pass);assert.equal(calls.length,3,pass);assert.ok(calls.every(c=>c.amount===amount),pass+' uses only observed quantities');
 }
 await writeFile(output+'/scarce-resources.png',Buffer.from(result.data.split(',')[1],'base64'));delete result.data;return result;
}
