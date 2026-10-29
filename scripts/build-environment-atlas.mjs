import {updateArtRevisions} from './build-art-revisions.mjs';
// Packs the original generated environment sheet; no recolouring or sprite painting.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {reflowSpriteGrid} from './sprite-grid.mjs';
const sharp=createRequire(import.meta.url)('sharp');
const root=new URL('../',import.meta.url),asset=n=>new URL('assets/'+n,root);
if(process.argv[2]){
 const raw=await sharp(process.argv[2]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const padded=reflowSpriteGrid(raw.data,raw.info.width,raw.info.height,3,2,6,true);
 await sharp(padded.data,{raw:{width:padded.width,height:padded.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toFile(asset('painted-environment.webp').pathname);
}
const {data,info}=await sharp(asset('painted-environment.webp').pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const anims={};
for(let row=0;row<2;row++)for(let col=0;col<3;col++){
 const x0=Math.round(col*info.width/3),x1=Math.round((col+1)*info.width/3),y0=Math.round(row*info.height/2),y1=Math.round((row+1)*info.height/2);
 let l=x1,r=x0,t=y1,b=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
 if(r<=l||b<=t)throw Error('Empty environment cell');
 l=Math.max(x0,l-2);r=Math.min(x1-1,r+2);t=Math.max(y0,t-2);b=Math.min(y1-1,b+2);
 anims['env_'+['deer','fish','relic','pine','oak','birch'][row*3+col]+'/idle/0']={dur:1,scale:1,frames:[{x:l,y:t,w:r-l+1,h:b-t+1,ax:(r-l+1)/2,ay:b-t-3}]};
}
const atlas={id:'painted-environment',src:'./assets/painted-environment.webp',meta:{painted:true,neutral:true,width:info.width,height:info.height,anims}};
writeFileSync(asset('environment-manifest.json'),JSON.stringify({atlases:[atlas]}));
const pack=JSON.parse(readFileSync(asset('atlas-manifest.json')));pack.atlases=pack.atlases.filter(a=>a.id!=='painted-environment');pack.atlases.push(atlas);
writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
updateArtRevisions();
console.log('Packed six neutral painted environment sprites.');
