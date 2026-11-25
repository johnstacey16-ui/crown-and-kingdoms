// Optional authoring: two original facings, eight walking poses each. This
// mobile building remains separate from the playable-unit motion catalogue.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid,extractSpriteGrid} from './sprite-grid.mjs';
import {applyBuildingAgeArt} from './building-age-art.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
const src='./assets/painted-building-mule-motion.webp',path=new URL(src,root),source=process.argv[2];
let {data,info}=await sharp(source||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(source&&(info.width!==1536||info.height!==1024))throw Error('Use a native transparent 1536x1024 4x4 sheet');
let empty=0;for(let i=3;i<data.length;i+=4)if(!data[i])empty++;
if(empty<info.width*info.height*.35)throw Error('Mule sheet background is not transparent');
if(source){const p=reflowSpriteGrid(data,info.width,info.height,4,4,16,true,128);data=p.data;info={...info,width:p.width,height:p.height}}
const clean=extractSpriteGrid(data,info.width,info.height,4,4,16,null,true),frames=clean.frames;
for(const [i,f] of frames.entries()){
 const x=i%4*info.width/4,y=Math.floor(i/4)*info.height/4;
 if(f.w<80||f.h<80||f.x<x+4||f.y<y+4||f.x+f.w>x+info.width/4-4||f.y+f.h>y+info.height/4-4)throw Error('Incomplete mule/cart pose '+i);
}
if(source)writeFileSync(path,await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
const referenceWidth=Math.max(...frames.map(f=>f.w)),referenceHeight=Math.max(...frames.map(f=>f.h)),anims={};
for(let team=0;team<4;team++)anims['bld_mule_motion/walk/'+team]={dur:.1,scale:1,referenceWidth,referenceHeight,dirs:[frames.slice(0,8),frames.slice(8)]};
const atlas={id:'painted-mule-motion',src,meta:{painted:true,muleMotion:true,width:info.width,height:info.height,anims}};
writeFileSync(new URL('assets/mule-motion-manifest.json',root),JSON.stringify({atlases:[atlas]}));
const manifest=new URL('assets/atlas-manifest.json',root);
writeFileSync(manifest,JSON.stringify(applyBuildingAgeArt(JSON.parse(readFileSync(manifest)))));
updateArtRevisions();console.log('Packed sixteen Mule Cart walk poses in two authored facings.');
