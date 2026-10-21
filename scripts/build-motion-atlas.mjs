// Optional authoring tool; runtime and CI do not require sharp.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
const kinds=['mil','knight','vil'],sources=process.argv.slice(2),atlases=[];
for(let k=0;k<kinds.length;k++){
 const kind=kinds[k],src='./assets/painted-motion-'+kind+'.webp',path=new URL(src,root);
 const {data,info}=await sharp(sources[k]||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const clean=Buffer.from(data);let removed=0;
 const cw=info.width/4,ch=info.height/4,frames=[];
 if(!Number.isInteger(cw)||!Number.isInteger(ch))throw Error('Invalid motion grid '+kind);
 let empty=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)empty++;
 if(empty<info.width*info.height*.45)throw Error('Sprite sheet background is not transparent: '+kind);
 for(let i=0;i<16;i++){
  const x0=i%4*cw,y0=Math.floor(i/4)*ch,visited=new Uint8Array(cw*ch),queue=new Int32Array(cw*ch);
  let l=cw,t=ch,r=0,b=0,occupied=0,primary=[];
  // A generated adjacent pose can leave a tiny detached weapon tip across a
  // grid boundary. Trim to this cell's main connected silhouette, so those
  // neighbouring fragments never enter the runtime frame rectangle.
  for(let py=0;py<ch;py++)for(let px=0;px<cw;px++){
   const first=py*cw+px;if(visited[first]||data[((y0+py)*info.width+x0+px)*4+3]<=32)continue;
   visited[first]=1;queue[0]=first;let tail=1,cl=px,ct=py,cr=px,cb=py;
   for(let head=0;head<tail;head++){
    const index=queue[head],x=index%cw,y=Math.floor(index/cw);cl=Math.min(cl,x);ct=Math.min(ct,y);cr=Math.max(cr,x);cb=Math.max(cb,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const n=ny*cw+nx;
     if(!visited[n]&&data[((y0+ny)*info.width+x0+nx)*4+3]>32){visited[n]=1;queue[tail++]=n}
    }
   }
   if(tail>occupied){occupied=tail;l=cl;t=ct;r=cr;b=cb;primary=Array.from(queue.subarray(0,tail))}
  }
  if(occupied<500)throw Error('Empty motion frame '+kind+'/'+i);
  // Isolate the primary pose, retaining a two-pixel antialiasing halo.
  const keep=new Uint8Array(cw*ch);
  for(const n of primary){const x=n%cw,y=Math.floor(n/cw);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<cw&&ny<ch)keep[ny*cw+nx]=1}}
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(!keep[y*cw+x]){const alpha=((y0+y)*info.width+x0+x)*4+3;if(clean[alpha]){clean[alpha]=0;removed++}}

  l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(cw-1,r+2);b=Math.min(ch-1,b+2);
  // The horizontal anchor stays at the cell centre, rather than following the
  // changing weapon silhouette. All frames share one body scale.
  frames.push({x:x0+l,y:y0+t,w:r-l+1,h:b-t+1,ax:cw/2-l,ay:b-t});
 }
 if(sources[k]||removed)await sharp(clean,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toFile(path.pathname+'.tmp');
 if(sources[k]||removed){const bytes=readFileSync(path.pathname+'.tmp');writeFileSync(path,bytes);unlinkSync(path.pathname+'.tmp')}
 const heights=frames.slice(0,8).map(f=>f.h).sort((a,b)=>a-b),referenceHeight=(heights[3]+heights[4])/2;
 const scale=(kind==='knight'?60:46)/referenceHeight,anims={};
 const walk=frames.slice(0,8),swing=frames.slice(8),attack=[...swing.slice(4),...swing.slice(0,4)];
 // Damage happens when the simulation resets cooldown; that is the strike
 // frame, followed by recovery, ready pose and the next wind-up.
 for(let team=0;team<4;team++){
  anims[kind+'/walk/'+team]={dur:kind==='knight'?.075:.095,scale,referenceHeight,frames:walk};
  anims[kind+'/attack/'+team]={dur:.1,scale,referenceHeight,frames:attack};
  if(kind==='vil')anims[kind+'/work/'+team]={dur:.13,scale,referenceHeight,frames:swing};
 }
 atlases.push({id:'painted-motion-'+kind,src,meta:{painted:true,motion:true,width:info.width,height:info.height,anims}});
}
writeFileSync(new URL('assets/motion-manifest.json',root),JSON.stringify({version:1,atlases}));
const manifest=new URL('assets/atlas-manifest.json',root),pack=JSON.parse(readFileSync(manifest));
pack.version='painted-raster-v2-motion';pack.atlases=[...atlases,...pack.atlases.filter(a=>!a.meta.motion)];
writeFileSync(manifest,JSON.stringify(pack));
console.log('Packed 48 original motion poses for infantry, knights and villagers.');
