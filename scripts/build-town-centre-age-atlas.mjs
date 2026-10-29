// Optional authoring tool for four original age-dependent Town Centres.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid,extractSpriteGrid} from './sprite-grid.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';
import {applyBuildingAgeArt} from './building-age-art.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url),asset=n=>new URL('assets/'+n,root),source=process.argv[2];
let {data,info}=await sharp(source||asset('painted-town-centre-ages.webp').pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==info.height||info.width%2||info.width<1024)throw Error('Town Centre ages require a square two-by-two source grid');
let empty=0;for(let i=3;i<data.length;i+=4)if(!data[i])empty++;
if(empty<info.width*info.height*.25)throw Error('Town-Centre-age background must be transparent');
if(source){const p=reflowSpriteGrid(data,info.width,info.height,2,2,4,true);data=p.data;info={...info,width:p.width,height:p.height}}
const clean=extractSpriteGrid(data,info.width,info.height,2,2,4,null,true),anims={};
for(let age=0;age<4;age++){
 const f=clean.frames[age],x=age%2*info.width/2,y=Math.floor(age/2)*info.height/2;
 if(f.w<100||f.h<100||f.x<x+4||f.y<y+4||f.x+f.w>x+info.width/2-4||f.y+f.h>y+info.height/2-4)throw Error('Incomplete Town Centre age '+age);
 for(let team=0;team<4;team++)for(const state of ['idle','walk','attack','work'])anims['bld_tc_age_'+age+'/'+state+'/'+team]={dur:1,scale:1,frames:[f]};
}
if(source||!clean.data.equals(data))writeFileSync(asset('painted-town-centre-ages.webp'),await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
const atlas={id:'painted-town-centre-ages',src:'./assets/painted-town-centre-ages.webp',meta:{painted:true,townCentreAges:true,width:info.width,height:info.height,anims}};
writeFileSync(asset('town-centre-age-manifest.json'),JSON.stringify({atlases:[atlas]}));
const pack=applyBuildingAgeArt(JSON.parse(readFileSync(asset('atlas-manifest.json'))));writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
updateArtRevisions();console.log('Packed four original town-centre-age designs; building mechanics are unchanged.');
