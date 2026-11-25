// Optional original-art authoring. Existing approved sheets survive every batch.
// --source KIND PNG adds/replaces only that kind; four positional PNGs retain
// compatibility with the original Huskarl/Longbow/Mangudai/Axeman workflow.
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {extractSpriteGrid,reflowSpriteGrid} from './sprite-grid.mjs';
import {updateArtRevisions} from './build-art-revisions.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
const kinds=['huskarl','lbow','mgd','axe','woad','bers','saml','tk','jaguar','kamayuk','shotel','gbeto','obuch','jan','chuko','genoa','plumed','rattan','composite','urumi','chakram','serjeant','cata','boyar','leitis','tarkan','keshik','monaspa','conq','huszar','coust','mamel','kipchak','centurion'],args=process.argv.slice(2),sources={};
const mountedKinds=new Set(['mgd','cata','boyar','leitis','tarkan','keshik','monaspa','conq','huszar','coust','mamel','kipchak','centurion']);
if(args[0]?.startsWith('--')){
 while(args.length){const flag=args.shift(),kind=args.shift(),path=args.shift();
  if(flag!=='--source'||!kinds.includes(kind)||!path||sources[kind])throw Error('Use --source KIND PNG once per Elite kind');
  sources[kind]=path;
 }
}else if(args.length){
 if(args.length!==4)throw Error('Supply four original positional PNGs or --source KIND PNG');
 args.forEach((path,i)=>sources[kinds[i]]=path);
}
const file=new URL('assets/elite-manifest.json',root);
const previous=existsSync(file)?JSON.parse(readFileSync(file)):{atlases:[],provenance:[]};
const atlases=[],provenance=[];
const selectedKinds=[...kinds,...previous.atlases.map(a=>a.meta.elite).filter(k=>!kinds.includes(k))];
for(const kind of selectedKinds){
 if(!sources[kind]){
  const old=previous.atlases.find(a=>a.meta.elite===kind);if(!old)continue;
  if(!existsSync(new URL(old.src,root)))throw Error('Missing approved Elite image '+kind);
  atlases.push(old);const entry=previous.provenance.find(p=>p.kind===kind);if(entry)provenance.push(entry);
  continue;
 }
 const source=readFileSync(sources[kind]);
 let {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(!kinds.slice(0,4).includes(kind)&&(info.width!==1536||info.height!==1024))throw Error('Use a native 1536x1024 source: '+kind);
 if(info.width%4||info.height%4)throw Error('Expected a four-by-four source: '+kind);
 let clear=0;for(let i=3;i<data.length;i+=4)if(!data[i])clear++;
 if(clear/info.width/info.height<.45)throw Error('Expected transparent sprite sheet: '+kind);
 const padded=reflowSpriteGrid(data,info.width,info.height,4,4,16,true,64);data=padded.data;info={...info,width:padded.width,height:padded.height};
 const isolated=extractSpriteGrid(data,info.width,info.height,4,4,16,null,true);
 for(const [i,f]of isolated.frames.entries()){
  const x=i%4*info.width/4,y=Math.floor(i/4)*info.height/4;
  if(f.x<x+4||f.y<y+4||f.x+f.w>x+info.width/4-4||f.y+f.h>y+info.height/4-4)throw Error('Figure touches cell boundary: '+kind+'/'+i);
 }
 const src='./assets/painted-elite-'+kind+'.webp';
 writeFileSync(new URL(src,root),await sharp(isolated.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer());
 const frames=isolated.frames,heights=frames.slice(0,8).map(f=>f.h).sort((a,b)=>a-b);
 const referenceHeight=(heights[3]+heights[4])/2,scale=(mountedKinds.has(kind)?60:46)/referenceHeight;
 const attack=[...frames.slice(12),...frames.slice(8,12)],anims={};
 for(let team=0;team<4;team++){
  anims[kind+'_elite/idle/'+team]={dur:1,scale,referenceHeight,frames:[frames[8]]};
  anims[kind+'_elite/walk/'+team]={dur:mountedKinds.has(kind)?.075:.095,scale,referenceHeight,frames:frames.slice(0,8)};
  anims[kind+'_elite/attack/'+team]={dur:.1,scale,referenceHeight,frames:attack};
 }
 atlases.push({id:'painted-elite-'+kind,src,meta:{painted:true,motion:true,elite:kind,sourceActionFrame:12,width:info.width,height:info.height,anims}});
 provenance.push({kind,sourceSha256:createHash('sha256').update(source).digest('hex'),frames:16,facings:'one authored facing plus runtime reflection',death:'not authored'});
}
writeFileSync(file,JSON.stringify({version:1,provenance,atlases}));
const manifest=new URL('assets/atlas-manifest.json',root),pack=JSON.parse(readFileSync(manifest));
const byId=new Map(atlases.map(a=>[a.id,a])),present=new Set(pack.atlases.map(a=>a.id));
pack.atlases=pack.atlases.map(a=>byId.get(a.id)||a);
pack.atlases.push(...atlases.filter(a=>!present.has(a.id)));
writeFileSync(manifest,JSON.stringify(pack));
updateArtRevisions();console.log('Packed '+atlases.length*16+' original Elite poses for '+atlases.length+' kinds; independent facings/death art remain unfinished.');
