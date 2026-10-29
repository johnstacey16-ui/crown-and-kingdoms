// Optional authoring tool; runtime and CI do not require sharp.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../',import.meta.url);
import {extractSpriteGrid,reflowSpriteGrid} from './sprite-grid.mjs';
const kinds=['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml','tk','huskarl','jaguar','kamayuk','shotel','jan','genoa','plumed','gbeto','chuko','hcan','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar','fish','gal','trn','cog','cart','king','eled','ele','ram','bomb','treb','mang','scor','wagon'],args=process.argv.slice(2),sources={},atlases=[];
if(args[0]?.startsWith('--')){
 while(args.length){const flag=args.shift(),kind=args.shift(),path=args.shift();if(flag!=='--source'||!kinds.includes(kind)||!path)throw Error('Use --source KIND PNG');sources[kind]=path;}
}else args.forEach((path,i)=>{if(!kinds[i])throw Error('Too many source images');sources[kinds[i]]=path});
// Preserve legitimate disconnected hoof/shadow, rigging and net components.
// Dense vessels/carts allow 65 percent nonzero alpha; infantry retains 55 percent.
const ships=new Set(['fish','gal','trn','cog']),vehicles=new Set([...ships,'cart']);
const large=new Set(['eled','ele','ram','bomb','treb','mang','scor','wagon']),elephants=new Set(['ele','eled']);
const multipart=new Set(['conq','tarkan',...vehicles,...large]);
// Source review locates the actual release/recoil/thrust pose in each sheet.
const impactSource={ele:10,eled:11,ram:11,bomb:11,treb:11,mang:11,scor:11,wagon:11};
for(const kind of kinds){
 const src='./assets/painted-motion-'+kind+'.webp',path=new URL(src,root);
 let {data,info}=await sharp(sources[kind]||path.pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width%4||info.height%4)throw Error('Invalid motion grid '+kind);
 let empty=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)empty++;
 if(empty<info.width*info.height*((vehicles.has(kind)||large.has(kind))?.35:.45))throw Error('Sprite sheet background is not transparent: '+kind);
 if(sources[kind]){
  // These ranged sheets contain detached muzzle smoke/bolt artwork. Keep the
  // complete in-cell character; production projectiles remain a separate layer.
  if(['jan','genoa'].includes(kind))data=extractSpriteGrid(data,info.width,info.height,4,4,16).data;
  const padded=reflowSpriteGrid(data,info.width,info.height,4,4,16,multipart.has(kind),(vehicles.has(kind)||large.has(kind)||['mgd','cata','conq','boyar','tarkan','huszar'].includes(kind))?128:['camel','mamel'].includes(kind)?96:64);data=padded.data;info={...info,width:padded.width,height:padded.height};}
 const isolated=extractSpriteGrid(data,info.width,info.height,4,4,16,null,multipart.has(kind)),frames=isolated.frames;
 if(sources[kind]||!isolated.data.equals(data)){
  const bytes=await sharp(isolated.data,{raw:{width:info.width,height:info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer();writeFileSync(path,bytes);
 }
 const heights=frames.slice(0,8).map(f=>f.h).sort((a,b)=>a-b),referenceHeight=(heights[3]+heights[4])/2;
 const widths=frames.slice(0,8).map(f=>f.w),maxWidth=Math.max(...widths);
 const scale=large.has(kind)?Math.min((elephants.has(kind)?74:60)/referenceHeight,(elephants.has(kind)?76:86)/maxWidth):ships.has(kind)?Math.min(48/referenceHeight,104/maxWidth):kind==='cart'?Math.min(60/referenceHeight,86/maxWidth):(['knight','scout','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'].includes(kind)?60:46)/referenceHeight,anims={};
 const walk=frames.slice(0,8),swing=frames.slice(8),impact=(impactSource[kind]??12)-8,attack=[...swing.slice(impact),...swing.slice(0,impact)];
 // Combat damage happens when the simulation resets cooldown; that is the strike
 // frame, followed by recovery, ready pose and the next wind-up. Noncombat
 // activity uses the same atlas slot without adding orders or combat behaviour.
 for(let team=0;team<4;team++){
  anims[kind+'/idle/'+team]={dur:1,scale,referenceHeight,frames:[swing[0]]};
  anims[kind+'/walk/'+team]={dur:elephants.has(kind)?.12:large.has(kind)?.11:['knight','scout','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'].includes(kind)?.075:.095,scale,referenceHeight,frames:walk};
  anims[kind+'/attack/'+team]={dur:.1,scale,referenceHeight,frames:attack};
  if(['vil','mon','fish'].includes(kind))anims[kind+'/work/'+team]={dur:.13,scale,referenceHeight,frames:swing};
 }
 atlases.push({id:'painted-motion-'+kind,src,meta:{painted:true,motion:true,...(large.has(kind)?{sourceActionFrame:impactSource[kind]}:{}),width:info.width,height:info.height,anims}});
}
writeFileSync(new URL('assets/motion-manifest.json',root),JSON.stringify({version:1,atlases}));
const manifest=new URL('assets/atlas-manifest.json',root),pack=JSON.parse(readFileSync(manifest));
pack.version=pack.atlases.some(a=>a.meta.environmentMotion)?'painted-raster-v16-wildlife-motion':pack.atlases.some(a=>a.id==='painted-fishtraps')?'painted-raster-v15-fishtraps':'painted-raster-v14-motion';pack.atlases=[...atlases,...pack.atlases.filter(a=>!a.meta.motion)];
writeFileSync(manifest,JSON.stringify(pack));
console.log('Packed 752 original motion poses for all forty-seven current playable unit types.');

