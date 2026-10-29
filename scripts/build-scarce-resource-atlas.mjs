// Optional original-art authoring tool for the last-40-units resource stage.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid,extractSpriteGrid} from './sprite-grid.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url),asset=n=>new URL('assets/'+n,root),source=process.argv[2];
let {data,info}=await sharp(source||asset('painted-scarce-resources.webp').pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width%3||info.height%2||source&&(info.width!==1536||info.height!==1024))throw Error('Scarce resources require a native1536x1024 three-by-two source grid');
let empty=0;for(let i=3;i<data.length;i+=4)if(!data[i])empty++;
if(empty<info.width*info.height*.4)throw Error('Scarce-resource background must be transparent');
if(source){const p=reflowSpriteGrid(data,info.width,info.height,3,2,6,true);data=p.data;info={...info,width:p.width,height:p.height}}
const clean=extractSpriteGrid(data,info.width,info.height,3,2,6,null,true),anims={};
for(let i=0;i<6;i++){
 const f=clean.frames[i],x=i%3*info.width/3,y=Math.floor(i/3)*info.height/2;
 if(f.w<30||f.h<20||f.x<x+4||f.y<y+4||f.x+f.w>x+info.width/3-4||f.y+f.h>y+info.height/2-4)throw Error('Incomplete scarce resource '+i);
 // Native512px cells define physical scale; sparse piles keep their smaller footprint.
 anims['node_'+['stone','gold','berry'][i%3]+'_low_'+Math.floor(i/3)+'/idle/0']={dur:1,scale:1,referenceWidth:512,frames:[{...f,ay:f.ay-3}]};
}
if(source||!clean.data.equals(data))writeFileSync(asset('painted-scarce-resources.webp'),await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
const atlas={id:'painted-scarce-resources',src:'./assets/painted-scarce-resources.webp',meta:{painted:true,neutral:true,scarceResources:true,width:info.width,height:info.height,anims}};
writeFileSync(asset('scarce-resource-manifest.json'),JSON.stringify({atlases:[atlas]}));
const pack=JSON.parse(readFileSync(asset('atlas-manifest.json')));pack.atlases=pack.atlases.filter(a=>a.id!==atlas.id);pack.atlases.push(atlas);pack.version='painted-raster-v17-scarce-resources';
writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
console.log('Packed six neutral low-remaining-resource variants; quantities and removal are unchanged.');
