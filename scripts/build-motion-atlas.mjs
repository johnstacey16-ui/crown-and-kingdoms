// Optional authoring tool; runtime and CI do not require sharp.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
import {extractSpriteGrid,reflowSpriteGrid} from './sprite-grid.mjs';
const kinds=['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml','tk'],args=process.argv.slice(2),sources={},atlases=[];
if(args[0]?.startsWith('--')){
 while(args.length){const flag=args.shift(),kind=args.shift(),path=args.shift();if(flag!=='--source'||!kinds.includes(kind)||!path)throw Error('Use --source KIND PNG');sources[kind]=path;}
}else args.forEach((path,i)=>{if(!kinds[i])throw Error('Too many source images');sources[kinds[i]]=path});
for(const kind of kinds){
 const src='./assets/painted-motion-'+kind+'.webp',path=new URL(src,root);
 let {data,info}=await sharp(sources[kind]||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width%4||info.height%4)throw Error('Invalid motion grid '+kind);
 let empty=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)empty++;
 if(empty<info.width*info.height*.45)throw Error('Sprite sheet background is not transparent: '+kind);
 if(sources[kind]){const padded=reflowSpriteGrid(data,info.width,info.height,4,4,16);data=padded.data;info={...info,width:padded.width,height:padded.height};}
 const isolated=extractSpriteGrid(data,info.width,info.height,4,4,16),frames=isolated.frames;
 if(sources[kind]||!isolated.data.equals(data)){
  const bytes=await sharp(isolated.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer();writeFileSync(path,bytes);
 }
 const heights=frames.slice(0,8).map(f=>f.h).sort((a,b)=>a-b),referenceHeight=(heights[3]+heights[4])/2;
 const scale=(['knight','scout'].includes(kind)?60:46)/referenceHeight,anims={};
 const walk=frames.slice(0,8),swing=frames.slice(8),attack=[...swing.slice(4),...swing.slice(0,4)];
 // Damage happens when the simulation resets cooldown; that is the strike
 // frame, followed by recovery, ready pose and the next wind-up.
 for(let team=0;team<4;team++){
  anims[kind+'/idle/'+team]={dur:1,scale,referenceHeight,frames:[swing[0]]};
  anims[kind+'/walk/'+team]={dur:['knight','scout'].includes(kind)?.075:.095,scale,referenceHeight,frames:walk};
  anims[kind+'/attack/'+team]={dur:.1,scale,referenceHeight,frames:attack};
  if(['vil','mon'].includes(kind))anims[kind+'/work/'+team]={dur:.13,scale,referenceHeight,frames:swing};
 }
 atlases.push({id:'painted-motion-'+kind,src,meta:{painted:true,motion:true,width:info.width,height:info.height,anims}});
}
writeFileSync(new URL('assets/motion-manifest.json',root),JSON.stringify({version:1,atlases}));
const manifest=new URL('assets/atlas-manifest.json',root),pack=JSON.parse(readFileSync(manifest));
pack.version='painted-raster-v6-motion';pack.atlases=[...atlases,...pack.atlases.filter(a=>!a.meta.motion)];
writeFileSync(manifest,JSON.stringify(pack));
console.log('Packed 240 original motion poses for fifteen unit types.');
