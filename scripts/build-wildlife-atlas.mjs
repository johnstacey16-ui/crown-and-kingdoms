import {applyHouseAgeArt} from './house-age-art.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';
// Optional original-art authoring tool; no runtime sharp dependency.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid,extractSpriteGrid} from './sprite-grid.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url),asset=n=>new URL('assets/'+n,root);
const [deerSource,fishSource]=process.argv.slice(2),atlases=[];
for(const [kind,source]of [['deer',deerSource],['fish',fishSource]]){
 const src='./assets/painted-wildlife-'+kind+'.webp',path=new URL(src,root);
 let {data,info}=await sharp(source||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width%4||info.height%2)throw Error('Wildlife requires four columns and two rows');
 let empty=0;for(let i=3;i<data.length;i+=4)if(!data[i])empty++;
 if(empty<info.width*info.height*(kind==='fish'?.3:.45))throw Error('Wildlife background must be transparent');
 if(source){const p=reflowSpriteGrid(data,info.width,info.height,4,2,8,true);data=p.data;info={...info,width:p.width,height:p.height}}
 const clean=extractSpriteGrid(data,info.width,info.height,4,2,8,null,true),frames=clean.frames;
 for(let i=0;i<8;i++){const f=frames[i],x=i%4*info.width/4,y=Math.floor(i/4)*info.height/2;
  if(f.w<30||f.h<20||f.x<x+4||f.y<y+4||f.x+f.w>x+info.width/4-4||f.y+f.h>y+info.height/2-4)throw Error('Incomplete wildlife pose '+kind+'/'+i);
 }
 if(source||!clean.data.equals(data))writeFileSync(path,await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
 const anim={dur:kind==='deer'?.32:.2,scale:1,referenceWidth:Math.max(...frames.map(f=>f.w)),referenceHeight:Math.max(...frames.map(f=>f.h)),frames};
 atlases.push({id:'painted-wildlife-'+kind,src,meta:{painted:true,neutral:true,environmentMotion:true,width:info.width,height:info.height,anims:{['env_'+kind+'/idle/0']:anim}}});
}
writeFileSync(asset('wildlife-manifest.json'),JSON.stringify({atlases}));
const pack=JSON.parse(readFileSync(asset('atlas-manifest.json')));
pack.atlases=[...pack.atlases.filter(a=>a.meta.motion),...atlases,...pack.atlases.filter(a=>!a.meta.motion&&!a.meta.environmentMotion)];pack.version=pack.atlases.some(a=>a.meta.scarceResources)?'painted-raster-v17-scarce-resources':'painted-raster-v16-wildlife-motion';
applyHouseAgeArt(pack);
writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
updateArtRevisions();
console.log('Packed eight neutral idle poses each for deer and fish shoals.');
