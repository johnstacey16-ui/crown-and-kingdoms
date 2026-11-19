// Optional authoring tool: retain native original building cutouts, not states
// fabricated from one drawing. The renderer owns shared age/construction/damage.
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {extractSpriteGrid} from './sprite-grid.mjs';
import {applyBuildingAgeArt} from './building-age-art.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';

const sharp=createRequire(import.meta.url)('sharp');
const root=new URL('../',import.meta.url);
const kinds=['feitoria','krepost','donjon'];
const sources={},args=process.argv.slice(2),atlases=[];
while(args.length){
 const flag=args.shift(),kind=args.shift(),source=args.shift();
 if(flag!=='--source'||!kinds.includes(kind)||!source||sources[kind])
  throw Error('Use --source KIND PNG once for each approved regional building');
 sources[kind]=source;
}
for(const kind of kinds){
 const src='./assets/painted-building-'+kind+'.webp',path=new URL(src,root);
 if(!sources[kind]&&!existsSync(path))continue;
 const {data,info}=await sharp(sources[kind]||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==info.height||info.width<1024||info.width>2048)
  throw Error('Use a native square 1024–2048px transparent building cutout: '+kind);
 let empty=0;
 for(let i=3;i<data.length;i+=4)if(data[i]===0)empty++;
 if(empty<info.width*info.height*.35)throw Error('Building background is not transparent: '+kind);
 const clean=extractSpriteGrid(data,info.width,info.height,1,1,1,null,true);
 const f=clean.frames[0];
 if(f.w<200||f.h<200||f.x<16||f.y<16||f.x+f.w>info.width-16||f.y+f.h>info.height-16)
  throw Error('Building silhouette is empty or touches the canvas edge: '+kind);
 // Native frame geometry is unchanged on a no-source rebuild. Do not resample
 // or rewrite a previously accepted image just to regenerate its manifest.
 if(sources[kind])writeFileSync(path,await sharp(clean.data,{raw:{width:info.width,height:info.height,channels:4}})
  .webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
 const anims={};
 for(let team=0;team<4;team++)for(const state of ['idle','walk','attack','work'])
  anims['bld_'+kind+'/'+state+'/'+team]={dur:1,scale:1,frames:[f]};
 atlases.push({id:'painted-building-'+kind,src,meta:{painted:true,regionalBuildings:true,width:info.width,height:info.height,anims}});
}
writeFileSync(new URL('assets/regional-building-manifest.json',root),JSON.stringify({atlases}));
const manifest=new URL('assets/atlas-manifest.json',root);
writeFileSync(manifest,JSON.stringify(applyBuildingAgeArt(JSON.parse(readFileSync(manifest)))));
updateArtRevisions();
console.log('Packed '+atlases.length+' original regional building bases; shared visual states remain separate.');
