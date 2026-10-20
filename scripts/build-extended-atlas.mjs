// Original repo-native vector artwork. Run with --check to verify committed outputs.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const colours=['#4b8fe8','#df514c','#47a979','#d9ae45'];
const states=['idle','walk','attack','work'];
export const tradeKinds=['cart','cog'];
export const uniqueKinds=['conq','genoa','boyar','tarkan','huskarl','jaguar','plumed','kamayuk','shotel','gbeto','wagon','huszar'];
const mounted=new Set(['boyar','tarkan','huszar']);
const n=v=>Number(v.toFixed(2));
const path=(d,fill,stroke='#30271f',width=1.2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ellipse=(x,y,rx,ry,fill,stroke='none')=>`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}"/>`;
const rect=(x,y,w,h,fill,stroke='#30271f')=>`<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" rx="1" fill="${fill}" stroke="${stroke}"/>`;
const circle=(x,y,r,fill,stroke='none')=>ellipse(x,y,r,r,fill,stroke);

function body(k,colour,dir){
 const angle=dir*Math.PI/4,side=Math.cos(angle)<-.1?-1:1,back=Math.sin(angle)<-.4;
 const skin=['jaguar','plumed','kamayuk'].includes(k)?'#ad7450':['shotel','gbeto'].includes(k)?'#88543d':'#d2aa85';
 let out=ellipse(32,55,15,mounted.has(k)?4:3,'#151a19');
 if(k==='cart'){
  out+=path('M13 35L55 32L79 41L38 47Z','#9b7145')+path('M13 35V46L38 56V47Z','#705132')+path('M38 47L79 41V51L38 56Z','#9c7749');
  out+=path('M18 36V18Q43 5 69 20V40','#d9c7a0')+path('M18 19Q43 6 69 20L64 26Q43 15 23 25Z',colour);
  out+=path('M22 25V38M64 26V42M19 32L66 33','none','#73522f',2)+rect(33,31,13,13,'#b2915b')+path('M35 31L44 44M44 31L35 44','none','#685436');
  return out;
 }
 if(k==='cog'){
  out=ellipse(47,56,37,5,'#173d4f');
  out+=path('M8 39Q43 50 85 34L75 54Q42 64 17 52Z','#785337')+path('M13 43Q42 55 80 40M18 49Q45 59 76 47','none','#bd9861',1.5);
  out+=path('M20 36L28 27L77 29L83 35L70 42L26 44Z','#bd9b64')+path('M18 34L21 45M79 30L80 40','none','#483f31',2);
  out+=path('M48 45V5M30 10H71','none','#5a412b',2)+path('M32 11Q28 25 34 36L69 31Q62 20 69 11Z','#eee1ba');
  out+=path('M34 13Q32 20 34 26L65 23Q64 17 67 13Z',colour)+path('M48 4L10 40M49 5L84 35','none','#a79878',.8);
  out+=rect(57,34,10,7,'#b49353')+rect(29,37,9,6,'#8b6943');return out;
 }
 if(k==='wagon'){
  out+=path('M9 34L41 27L57 35L25 44Z','#a88c5b')+path('M9 34V47L25 55V44Z','#67573e')+path('M25 44L57 35V47L25 55Z',colour);
  out+=path('M13 32V21L40 14L53 22V35','#6b777e')+path('M13 21L40 14L53 22L26 30Z','#adb2ac')+path('M18 27L43 20M29 31L49 25','none','#26353a',2);
  out+=path('M46 28L61 24L62 28L47 32Z','#333e43');return out;
 }
 const ride=mounted.has(k),top=ride?18:27;
 if(ride){
  out+=ellipse(30,40,18,9,k==='huszar'?'#c1aa84':'#7d5d47','#342f28');
  out+=path(`M${32+side*12} 39L${32+side*19} 23L${32+side*25} 26L${32+side*23} 38Z`,k==='huszar'?'#b6a27d':'#806149');
  out+=path(`M${32+side*15} 29L${32+side*20} 23L${32+side*23} 28`, '#3f3b30');
  out+=path(`M${32-side*15} 37Q${32-side*26} 30 ${32-side*22} 46`,'none','#3c322b',3);
  out+=path('M21 33L41 33L40 44L22 44Z',colour)+path('M22 36H39','none','#e4ca8e');
 }
 const coat=k==='huskarl'?'#8b9393':k==='jaguar'?'#c39b54':k==='conq'?'#bec1b8':k==='boyar'?'#909b9f':k==='genoa'?'#e1d4b3':colour;
 out+=path(`M24 ${top}Q32 ${top-4} 40 ${top}L42 ${top+15}Q32 ${top+20} 22 ${top+15}Z`,coat);
 out+=path(`M27 ${top}L27 ${top+14}M37 ${top}L37 ${top+14}`,'none',colour,3);
 out+=ellipse(32+side*1.5,top-9,6,7,skin,'#44372a');
 if(!back)out+=circle(32+side*5,top-10,1,'#272b28');
 if(['conq','genoa','boyar','huskarl'].includes(k)){
  out+=path(`M24 ${top-8}Q24 ${top-20} 40 ${top-12}L41 ${top-8}Z`,'#9fa9aa')+path(`M24 ${top-8}H41`,'none','#403d35',1.5);
  if(k==='conq')out+=path(`M33 ${top-16}Q38 ${top-26} 44 ${top-18}`,'none',colour,3);
 }else if(k==='jaguar'){
  out+=path(`M24 ${top-7}L23 ${top-17}L28 ${top-19}L33 ${top-16}L38 ${top-19}L42 ${top-13}L39 ${top-5}`,'#ba8b46');
  out+=circle(26,top-14,1.6,'#45332a')+circle(37,top-15,1.5,'#45332a');
 }else if(k==='plumed'||k==='huszar'){
  for(let i=0;i<4;i++)out+=path(`M${26+i*3} ${top-14}L${22+i*5} ${Math.max(2,top-25-i%2*2)}`,'none',i%2?colour:'#d7c193',2.5);
 }else if(k==='gbeto')out+=path(`M24 ${top-11}Q23 ${top-22} 39 ${top-16}L43 ${top-1}L38 ${top-2}L36 ${top-12}Z`,'#d38952');
 else out+=path(`M24 ${top-12}Q32 ${top-20} 40 ${top-12}`,'none','#493f31',3);
 if(k==='boyar')out+=path('M20 25L13 28L16 42L24 38Z',colour,'#c5c4ac',2);
 if(k==='huskarl')out+=ellipse(22,36,8,10,'#8b593c','#bdad83')+circle(22,36,2,'#b8b8ab');
 if(k==='huszar')out+=path('M23 16L14 6L17 24M40 17L48 7L45 26','none','#c5b38b',2);
 return out;
}

function detail(k,state,frame,dir,colour){
 const side=Math.cos(dir*Math.PI/4)<-.1?-1:1,walk=state==='walk',work=state==='work',attack=state==='attack';
 const stride=walk?(frame?3:-3):0,hand=attack?(frame?-22:16):work?(frame?8:-4):0;
 if(k==='cart'||k==='wagon'){
  const wheels=k==='cart'?[[25,50],[63,49]]:[[19,49],[48,48]];
  let out='';for(const [x,y]of wheels){out+=ellipse(x,y,6,7,'#4b3a2b','#c1a471');
   for(let i=0;i<3;i++){const a=i*Math.PI/3+(walk?frame*.6:0);out+=path(`M${n(x-Math.cos(a)*5)} ${n(y-Math.sin(a)*6)}L${n(x+Math.cos(a)*5)} ${n(y+Math.sin(a)*6)}`,'none','#ab8957',1);}}
  if(work&&k==='cart')out+=circle(48+frame*3,35,3,'#e0be5c','#7b6939');
  if(attack&&frame&&k==='wagon')out+=path('M58 24L65 20L63 25L70 28L61 29Z','#efd07c','#d18b45');return out;
 }
 if(k==='cog')return path(`M12 ${58+frame}Q26 ${54+frame} 39 59M56 59Q71 ${55+frame} 87 ${58+frame}`,'none','#9ac5cd',1.5)+(work?circle(63,34-frame*4,3,'#dfbd60','#6b5d39'):'');
 let out='';
 if(mounted.has(k)){
  out+=path(`M20 43L${19+stride} 53L${16+stride} 56M28 45L${30-stride} 55M39 44L${41+stride} 55M45 42L${46-stride} 53`,'none','#4f4034',3);
 }else out+=path(`M27 43L${26+stride} 53L${23+stride} 56M36 43L${37-stride} 54L${41-stride} 56`,'none','#4d463b',3.5);
 const y=mounted.has(k)?27:34;
 out+=path(`M${32+side*7} ${y-7}L${32+side*10} ${y+3}`,'none','#c79b73',3.5);
 let weapon='';
 if(k==='conq'||k==='wagon')weapon=path(`M${32+side*6} ${y+2}L${32+side*24} ${y-7}`,'none','#495354',3)+path(`M${32+side*7} ${y+3}L${32+side*15} ${y}`,'none','#785536',3);
 else if(k==='genoa')weapon=path(`M${32+side*6} ${y+2}L${32+side*22} ${y-4}M${32+side*17} ${y-11}L${32+side*20} ${y+4}`,'none','#8b643a',2.5)+path(`M${32+side*17} ${y-11}Q${32+side*25} ${y-4} ${32+side*20} ${y+4}`,'none','#bbbda9');
 else if(k==='plumed')weapon=path(`M${32+side*14} ${y-14}Q${32+side*28} ${y-1} ${32+side*14} ${y+12}M${32+side*14} ${y-14}V${y+12}`,'none','#b99b61',1.7);
 else if(k==='kamayuk')weapon=path(`M${32+side*15} 50L${32+side*19} 7`,'none','#8e7143',2)+path(`M${32+side*19} 7L${32+side*16} 13L${32+side*21} 13Z`,'#c4cdcb');
 else if(k==='tarkan')weapon=path(`M${32+side*12} ${y+3}L${32+side*18} ${y-8}`,'none','#8d6338',2.5)+path(`M${32+side*18} ${y-8}Q${32+side*(12+frame*2)} ${y-16} ${32+side*20} ${y-19}Q${32+side*27} ${y-10} ${32+side*18} ${y-8}Z`,'#e9b35d','#ac6537');
 else if(k==='shotel')weapon=path(`M${32+side*11} ${y+4}Q${32+side*27} ${y+1} ${32+side*23} ${y-17}Q${32+side*20} ${y-4} ${32+side*12} ${y-1}Z`,'#b9c7c3');
 else if(k==='gbeto')weapon=path(`M${32+side*12} ${y}L${32+side*27} ${y-7}L${32+side*19} ${y+2}Z`,'#c8c8b2');
 else if(k==='jaguar')weapon=path(`M${32+side*13} ${y+8}L${32+side*20} ${y-16}`,'none','#453f33',5)+path(`M${32+side*17} ${y-13}L${32+side*23} ${y-11}M${32+side*15} ${y-6}L${32+side*21} ${y-4}`,'none','#c0bca7',2);
 else weapon=path(`M${32+side*11} ${y+7}L${32+side*22} ${y-19}`,'none','#c1c8c2',2.5)+path(`M${32+side*10} ${y+1}L${32+side*17} ${y+5}`,'none','#a68c51',2);
 out+=`<g transform="rotate(${hand*side} 32 ${y})">${weapon}</g>`;
 if(attack&&frame&&k==='conq')out+=path(`M${32+side*23} ${y-7}L${32+side*29} ${y-13}L${32+side*27} ${y-6}L${32+side*31} ${y-3}Z`,'#efd49a','#d39b54');
 return out;
}

function atlas(id,kinds,width,columns){
 const anims={},defs=[],tiles=[];let index=0;
 for(const kind of kinds)for(let team=0;team<4;team++)for(let dir=0;dir<8;dir++)defs.push(`<g id="${kind}-${team}-${dir}">${body(kind,colours[team],dir)}</g>`);
 for(const kind of kinds)for(const state of states)for(let team=0;team<4;team++){
  const dirs=[];
  for(let dir=0;dir<8;dir++){
   const frames=[];
   for(let frame=0;frame<2;frame++){
    const x=index%columns*width,y=Math.floor(index/columns)*64;index++;
    const bob=state==='walk'?(frame?-.6:.6):0;
    tiles.push(`<g transform="translate(${x} ${y})"><g clip-path="url(#${id}-cell)"><g transform="translate(0 ${bob})"><use href="#${kind}-${team}-${dir}"/>${detail(kind,state,frame,dir,colours[team])}</g></g></g>`);
    frames.push({x,y,w:width,h:64,ax:width===96?48:32,ay:56});
   }dirs.push(frames);
  }
  anims[`${kind}/${state}/${team}`]={dur:state==='walk'?.12:state==='attack'?.18:.3,scale:1,dirs};
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${columns*width}" height="${Math.ceil(index/columns)*64}" viewBox="0 0 ${columns*width} ${Math.ceil(index/columns)*64}"><title>Original Crown and Kingdoms ${id} vector atlas</title><defs><clipPath id="${id}-cell"><rect width="${width}" height="64"/></clipPath>${defs.join('')}</defs>${tiles.join('')}</svg>\n`;
 return {entry:{id,src:`./assets/${id}.svg`,meta:{anims}},svg};
}
function palisade(){
 const anims={},tiles=[];let index=0;
 for(let team=0;team<4;team++)for(const state of states){
  const frames=[];
  for(let frame=0;frame<2;frame++){
   const x=index%4*128,y=Math.floor(index/4)*128;index++;
   let art=ellipse(64,105,51,10,'#19231a');
   for(let i=0;i<9;i++){
    const px=13+i*11,base=102-Math.abs(i-4)*2,top=base-46-(i%2)*4;
    art+=path(`M${px} ${base}V${top+8}L${px+5} ${top}L${px+10} ${top+8}V${base}Z`,i%2?'#967044':'#b08a51');
    art+=path(`M${px+4} ${top+11}V${base-3}`,'none','#d0ae71',1)+path(`M${px+8} ${top+16}V${base-6}`,'none','#694e32',1);
   }
   art+=path('M16 86L64 98L112 86M16 66L64 78L112 66','none','#63492e',5)+path('M64 78V99','none','#b69154',2);
   art+=path('M65 64V27','none','#5e4731',2)+path(`M66 29Q${79+frame} 28 88 34L84 44Q76 37 66 39Z`,colours[team]);
   tiles.push(`<g transform="translate(${x} ${y})">${art}</g>`);frames.push({x,y,w:128,h:128,ax:64,ay:112});
  }
  anims[`bld_palisade/${state}/${team}`]={dur:.35,scale:1,frames};
 }
 return {entry:{id:'palisade-atlas',src:'./assets/palisade-atlas.svg',meta:{anims}},svg:`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="1024" viewBox="0 0 512 1024"><title>Original timber palisade atlas</title>${tiles.join('')}</svg>\n`};
}
const outputs=[atlas('trade-atlas',tradeKinds,96,16),atlas('unique-forces-atlas',uniqueKinds,64,32),palisade()];
const manifestPath=resolve(root,'assets/atlas-manifest.json');
const pack=JSON.parse(readFileSync(manifestPath,'utf8'));
const ids=new Set(outputs.map(o=>o.entry.id));pack.atlases=pack.atlases.filter(a=>!ids.has(a.id));
// cs is a castle attack proxy in U, not a trainable troop. Reuse castle frames.
const buildings=pack.atlases.find(a=>a.id==='ck-detailed-buildings');
for(let team=0;team<4;team++)for(const state of states){
 const entry=buildings.meta.anims[`bld_castle/${state}/${team}`];
 buildings.meta.anims[`cs/${state}/${team}`]={...entry,scale:.5};
}
for(const o of outputs)pack.atlases.push(o.entry);
const files=new Map(outputs.map(o=>[resolve(root,o.entry.src),o.svg]));
files.set(manifestPath,JSON.stringify(pack));
for(const [name,text]of files){
 if(check){if(readFileSync(name,'utf8')!==text)throw Error('Generated atlas differs: '+name);}
 else writeFileSync(name,text);
}
console.log((check?'Verified':'Generated')+' original trade, unique-force and palisade atlases');
