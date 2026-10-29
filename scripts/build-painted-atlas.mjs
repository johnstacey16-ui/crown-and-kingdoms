// Development packer: npm install --no-save sharp, then pass the three source PNGs.
// The generated artwork is original; this packs it without changing its contents.
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {extractSpriteGrid} from './sprite-grid.mjs';
const root=new URL('../',import.meta.url),asset=n=>new URL('assets/'+n,root);
mkdirSync(new URL('assets/',root),{recursive:true});
const [buildingSource,unitSource,terrainSource]=process.argv.slice(2);
for(const [src,name]of [[buildingSource,'painted-buildings.webp'],[unitSource,'painted-units.webp'],[terrainSource,'painted-terrain.webp']]){
 if(src)await sharp(src).webp({quality:94,alphaQuality:100,effort:6}).toFile(asset(name).pathname);
}
const config={};vm.createContext(config);vm.runInContext(readFileSync(new URL('js/config.js',root),'utf8')+';globalThis.catalog={U,B}',config);
const units=['vil','mil','arc','spear','scout','knight','xbow','cart','fish','gal','trn','cog','ram','mon','woad','bers','mamel','jan','chuko','saml','eled','hcan','bomb','axe','lbow','mgd','cata','ele','tk','treb','camel','king','skirm','mang','scor','conq','genoa','boyar','tarkan','huskarl','jaguar','plumed','kamayuk','shotel','gbeto','wagon','huszar'];
const buildings=['tc','house','lumber','mine','mill','farm','bar','rng','stable','smith','market','palisade','wall','dock','siege','univ','gate','outpost','wonder','monastery','tower','castle'];
async function frames(name,columns,rows,count){
 const {data,info}=await sharp(asset(name).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const out=[];
 for(let i=0;i<count;i++){
  const x0=Math.round(i%columns*info.width/columns),y0=Math.round(Math.floor(i/columns)*info.height/rows),x1=Math.round((i%columns+1)*info.width/columns),y1=Math.round((Math.floor(i/columns)+1)*info.height/rows);
  let l=x1,t=y1,r=x0,b=y0;
  for(let y=y0+2;y<y1-2;y++)for(let x=x0+2;x<x1-2;x++)if(data[(y*info.width+x)*4+3]>70){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
  l=Math.max(x0,l-2);t=Math.max(y0,t-2);r=Math.min(x1-1,r+2);b=Math.min(y1-1,b+2);
  if(r<=l||b<=t)throw Error('Empty painted cell '+name+' '+i);
  out.push({x:l,y:t,w:r-l+1,h:b-t+1,ax:(r-l+1)/2,ay:b-t});
 }
 return{frames:out,width:info.width,height:info.height};
}
const uf=await frames('painted-units.webp',8,6,48),bf=await frames('painted-buildings.webp',6,4,24);
// Preserve the original sheet; isolate only the three idle cells with observed
// neighbouring fragments. Multi-part ships and carts retain their original art.
const raw=await sharp(asset('painted-units.webp').pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const isolated=extractSpriteGrid(raw.data,raw.info.width,raw.info.height,8,6,48,[2,3,6]);
for(const i of [2,3,6]){const f=isolated.frames[i];uf.frames[i]={...f,ax:f.w/2};}
const cleanBytes=await sharp(isolated.data,{raw:{width:raw.info.width,height:raw.info.height,channels:4}}).webp({quality:94,alphaQuality:100,effort:6}).toBuffer();
writeFileSync(asset('painted-units-v2.webp'),cleanBytes);
const pack={version:'painted-raster-v1',terrain:{src:'./assets/painted-terrain.webp',columns:3,rows:2},atlases:[]};
const states=['idle','walk','attack','work'];
function atlas(id,src,info){const a={id,src:'./assets/'+src,meta:{painted:true,width:info.width,height:info.height,anims:{}}};pack.atlases.push(a);return a;}
const troops=atlas('painted-forces','painted-units-v2.webp',uf),architecture=atlas('painted-architecture','painted-buildings.webp',bf);
function bind(a,key,f,scale){for(let team=0;team<4;team++)for(const state of states)a.meta.anims[key+'/'+state+'/'+team]={dur:.18,scale,frames:[f]};}
for(let i=0;i<units.length;i++){
 const k=units[i],f=uf.frames[i];
 const mounted=['scout','knight','mamel','mgd','cata','ele','eled','camel','boyar','tarkan','huszar'].includes(k);
 const ship=['fish','gal','trn','cog'].includes(k),siege=['ram','mang','scor','treb','bomb','wagon','cart'].includes(k);
 const h=ship?48:k==='ele'||k==='eled'?74:mounted?60:siege?60:46,w=ship?104:mounted?76:siege?86:48;
 bind(troops,k,f,Math.min(w/f.w,h/f.h));
}
for(let i=0;i<buildings.length;i++)bind(architecture,'bld_'+buildings[i],bf.frames[i],1);
for(const [proxy,kind]of [['tca','tc'],['tw','tower'],['cs','castle']])bind(architecture,proxy,bf.frames[buildings.indexOf(kind)],.35);
bind(architecture,'node_tree',bf.frames[23],.4);
const motionPath=asset('motion-manifest.json');if(existsSync(motionPath)){const motion=JSON.parse(readFileSync(motionPath));pack.version=motion.atlases.length>=19?'painted-raster-v7-motion':motion.atlases.length>=15?'painted-raster-v6-motion':motion.atlases.length>=11?'painted-raster-v5-motion':motion.atlases.length>=8?'painted-raster-v4-motion':motion.atlases.length>=6?'painted-raster-v3-motion':'painted-raster-v2-motion';pack.atlases.unshift(...motion.atlases)}
const resourcePath=asset('resource-manifest.json');if(existsSync(resourcePath))pack.atlases.push(...JSON.parse(readFileSync(resourcePath)).atlases);
const environmentPath=asset('environment-manifest.json');if(existsSync(environmentPath))pack.atlases.push(...JSON.parse(readFileSync(environmentPath)).atlases);
writeFileSync(asset('atlas-manifest.json'),JSON.stringify(pack));
console.log('Packed 47 troop types, 22 buildings, 3 combat proxies and painted terrain.');

