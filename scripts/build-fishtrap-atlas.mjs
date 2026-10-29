// Optional authoring tool. Preserve the original source; runtime needs only WebP.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid,extractSpriteGrid} from './sprite-grid.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
const asset=name=>new URL('assets/'+name,root),source=process.argv[2];
let {data,info}=await sharp(source||asset('painted-fishtraps.webp').pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width%2||info.height%2)throw Error('Fish traps require a two-by-two grid');
let empty=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)empty++;
if(empty<info.width*info.height*.35)throw Error('Fish-trap background must be transparent');
if(source){const packed=reflowSpriteGrid(data,info.width,info.height,2,2,4,true);data=packed.data;info={...info,width:packed.width,height:packed.height}}
const clean=extractSpriteGrid(data,info.width,info.height,2,2,4,null,true),anims={};
for(let i=0;i<4;i++){
 const f=clean.frames[i],left=(i%2)*info.width/2,top=Math.floor(i/2)*info.height/2;
 if(f.w<30||f.h<20||f.x<left+4||f.y<top+4||f.x+f.w>left+info.width/2-4||f.y+f.h>top+info.height/2-4)throw Error('Incomplete fish-trap cell '+i);
 anims['env_trap_'+i+'/idle/0']={dur:1,scale:1,frames:[{...f,ay:f.ay-3}]};
}
if(source||!clean.data.equals(data))writeFileSync(asset('painted-fishtraps.webp'),await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
const atlas={id:'painted-fishtraps',src:'./assets/painted-fishtraps.webp',meta:{painted:true,neutral:true,width:info.width,height:info.height,anims}};
writeFileSync(asset('fishtrap-manifest.json'),JSON.stringify({atlases:[atlas]}));
const pack=JSON.parse(readFileSync(asset('atlas-manifest.json')));pack.atlases=pack.atlases.filter(a=>a.id!==atlas.id);pack.atlases.push(atlas);pack.version=pack.atlases.some(a=>a.meta.environmentMotion)?'painted-raster-v16-wildlife-motion':'painted-raster-v15-fishtraps';
writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
console.log('Packed four neutral painted fish traps; no gameplay fields changed.');
