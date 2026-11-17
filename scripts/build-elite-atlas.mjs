// Optional original-art packer: provide four transparent 4x4 source sheets.
// npm install --no-save sharp; node scripts/build-elite-atlas.mjs SOURCE...
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extractSpriteGrid} from './sprite-grid.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';
const sharp=createRequire(import.meta.url)('sharp');
const root=new URL('../',import.meta.url),kinds=['huskarl','lbow','mgd','axe'];
const sources=process.argv.slice(2);
if(sources.length!==4)throw Error('Supply Huskarl, Longbowman, Mangudai and Axeman PNGs');
const atlases=[],provenance=[];
for(const [index,kind] of kinds.entries()){
 const source=readFileSync(sources[index]);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let clear=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)clear++;
 if(clear/info.width/info.height<.45)throw Error('Expected transparent sprite sheet: '+kind);
 const isolated=extractSpriteGrid(data,info.width,info.height,4,4,16,null,true);
 // Reject clipped source figures before packing; never silently crop weapons.
 for(const [i,f] of isolated.frames.entries()){
  const left=Math.round(i%4*info.width/4),right=Math.round((i%4+1)*info.width/4);
  const top=Math.round(Math.floor(i/4)*info.height/4),bottom=Math.round((Math.floor(i/4)+1)*info.height/4);
  if(f.x<=left||f.y<=top||f.x+f.w>=right||f.y+f.h>=bottom)throw Error('Figure touches cell boundary: '+kind+'/'+i);
 }
 const src='./assets/painted-elite-'+kind+'.webp';
 writeFileSync(new URL(src,root),await sharp(isolated.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
 const frames=isolated.frames,heights=frames.slice(0,8).map(f=>f.h).sort((a,b)=>a-b);
 const referenceHeight=(heights[3]+heights[4])/2,scale=(kind==='mgd'?60:46)/referenceHeight;
 const attack=[...frames.slice(12),...frames.slice(8,12)],anims={};
 for(let team=0;team<4;team++){
  anims[kind+'_elite/idle/'+team]={dur:1,scale,referenceHeight,frames:[frames[8]]};
  anims[kind+'_elite/walk/'+team]={dur:kind==='mgd'?.075:.095,scale,referenceHeight,frames:frames.slice(0,8)};
  anims[kind+'_elite/attack/'+team]={dur:.1,scale,referenceHeight,frames:attack};
 }
 atlases.push({id:'painted-elite-'+kind,src,meta:{painted:true,motion:true,elite:kind,width:info.width,height:info.height,anims}});
 provenance.push({kind,sourceSha256:createHash('sha256').update(source).digest('hex'),frames:16,facings:'one authored facing plus runtime reflection',death:'not authored'});
}
const elite={version:1,provenance,atlases};
writeFileSync(new URL('assets/elite-manifest.json',root),JSON.stringify(elite));
const file=new URL('assets/atlas-manifest.json',root),pack=JSON.parse(readFileSync(file));
pack.atlases=[...pack.atlases.filter(a=>!a.meta.elite),...atlases];
writeFileSync(file,JSON.stringify(pack));
updateArtRevisions();
console.log('Packed 64 original Elite poses; independent facings and death art remain unfinished.');
