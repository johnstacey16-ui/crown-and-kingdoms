/* Original projectile art, particle lifetime/drawing and bounded sprite warm-up.
 * Presentation-only helpers extracted unchanged from js/render.js.
 * The world draw dispatcher and viewport caches remain in js/render.js. */
// Copied visual descriptions only: no entity/target references, RNG or combat
// state are needed to distinguish the current catalogue's projectile families.
const PROJECTILE_STYLES=Object.freeze({xbow:'bolt',genoa:'bolt',chuko:'bolt',scor:'heavy-bolt',skirm:'javelin',jan:'bullet',hcan:'bullet',conq:'bullet',bomb:'cannon',cgal:'cannon',mang:'stone',treb:'stone',axe:'axe',gbeto:'blade'});
function projectileVisualStyle(kind){const style=typeof kind==='string'?PROJECTILE_STYLES[kind]:null;return typeof style==='string'?style:'arrow'}
function projectileVisualHeading(p){
 if(!p||![p.x,p.y,p.tx,p.ty].every(Number.isFinite))return null;
 return Math.atan2(p.ty-p.y,p.tx-p.x);
}
function drawProjectileArtwork(g,x,y,heading,style,time,scale=1){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const t=Number.isFinite(time)?time:0,z=Number.isFinite(scale)&&scale>0?scale:1;
 g.save();
 try{
  g.translate(x,y);g.rotate(Number.isFinite(heading)?heading:0);g.scale(z,z);g.lineCap='round';g.lineJoin='round';
  const line=(x1,y1,x2,y2,color,width)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
  if(style==='cannon'){
   line(-11,0,-4,0,'rgba(174,165,146,.45)',1.5);g.fillStyle='#25282a';g.strokeStyle='#aaa28e';g.lineWidth=.6;g.beginPath();g.arc(0,0,3,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#8d969a';g.beginPath();g.arc(.6,-.8,.9,0,Math.PI*2);g.fill();
  }else if(style==='stone'){
   g.rotate(t*2);g.fillStyle='#777570';g.strokeStyle='#302d27';g.lineWidth=.8;g.beginPath();g.moveTo(-3,-2);g.lineTo(0,-3.7);g.lineTo(3,-2);g.lineTo(3.5,1);g.lineTo(1,3);g.lineTo(-3,2);g.closePath();g.fill();g.stroke();line(-1.8,-1.6,.7,-2.2,'#c0b8a5',1.2);
  }else if(style==='bullet'){
   line(-7,0,0,0,'rgba(230,215,171,.7)',1);line(-1,0,1.5,0,'#fff0cb',1.5);
  }else if(style==='axe'){
   g.rotate(t*13);line(-5,0,4,0,'#3b2a1b',2.4);line(-5,-.3,4,-.3,'#b78d57',1.1);g.fillStyle='#a6b2b4';g.strokeStyle='#303536';g.lineWidth=.6;g.beginPath();g.moveTo(1,-1);g.lineTo(2,-5);g.quadraticCurveTo(7,-5,6,2);g.lineTo(2,1);g.closePath();g.fill();g.stroke();line(5,-3,5.6,.5,'#edf0df',.8);
  }else if(style==='blade'){
   g.rotate(t*15);g.fillStyle='#b2bec1';g.strokeStyle='#30373a';g.lineWidth=.6;g.beginPath();g.moveTo(-4,1);g.quadraticCurveTo(1,-5,6,-2);g.quadraticCurveTo(2,-1,0,2);g.closePath();g.fill();g.stroke();line(-5,1,-2,0,'#b08a4a',1.7);
  }else{
   const spear=style==='javelin',heavy=style==='heavy-bolt',bolt=style==='bolt',length=spear?19:heavy?16:bolt?10:13,tail=-length*.55,tip=length*.45;
   line(tail,0,tip-2,0,'#33291f',heavy?2.4:1.8);line(tail,-.2,tip-2,-.2,spear?'#d0b17c':'#b99863',heavy?1.2:.9);
   g.fillStyle=heavy?'#c6ccca':'#d9ded1';g.beginPath();g.moveTo(tip,0);g.lineTo(tip-(spear?4:3),heavy?-2:-1.3);g.lineTo(tip-(spear?4:3),heavy?2:1.3);g.closePath();g.fill();
   if(!spear){line(tail,0,tail-1.3,-1.7,'#e8dcc0',.9);line(tail+1.8,0,tail+.4,1.6,'#a89777',.8)}
  }
 }finally{g.restore()}
 return true;
}

/* Particle emission, lifetime, rendering and queued procedural warm-up. */
const PMAX=[100,260,520],PT=[];

/* Particle emission, lifetime and bounded sprite warm-up share the renderer's
 * texture state; the fixed-step engine only schedules these operations. */
function emit(k,x,y,n,o){const cap=PMAX[gq];o=o||{};for(let i=0;i<n;i++){if(PT.length>=cap)return;PT.push({k,x,y,z:0,vx:(Math.random()-.5)*(o.s||1),vy:(Math.random()-.5)*(o.s||1),vz:(o.vz||0)*(.6+Math.random()*.8),l:o.l||.6,t:0,c:o.c||'#ccc',r:o.r||2})}}
function updP(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.t+=dt;if(p.t>=p.l){PT[i]=PT[PT.length-1];PT.pop();continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='deb'||p.k==='spark')p.vz-=9*dt}}
let WQ=[];
function queueWarm(){WQ=[];const uu=new Set(CIV.map(c=>c.uu)),mine=new Set((S.civ||[0,1]).map(c=>CIV[c].uu));for(const k in U){if(k==='tw'||k==='cs'||k==='tca')continue;if(uu.has(k)&&!mine.has(k))continue;for(const t of[0,1,2,3]){WQ.push([k,t,0,0]);for(let f=0;f<4;f++)WQ.push([k,t,1,f])}}WQ.reverse()}
function warm(){if(!WQ.length)return;const t0=performance.now();while(WQ.length&&performance.now()-t0<3){const q=WQ.pop(),k=q[0];if(typeof hasReadyAssetPose==='function'&&hasReadyAssetPose(k,q[1],q[2]))continue;const sz=USZ(k);spr(k+'|'+q[1]+'|'+q[2]+'|'+q[3],sz[0],sz[1],g=>paintUnit(g,k,teamColor(q[1]),q[2],q[3]))}}

/* Draw the particles whose lifecycle is updated by engine.js. */
function drawP(){for(const p of PT){const P=w2s(p.x,p.y),a=1-p.t/p.l;X.globalAlpha=a*(p.k==='smk'||p.k==='puff'||p.k==='dust'?.55:.95);X.fillStyle=p.c;X.beginPath();X.arc(P[0],P[1]-Math.max(0,p.z)*zm*14,(p.r+(p.k==='smk'||p.k==='puff'||p.k==='dust'?p.t*6:0))*zm,0,7);X.fill()}X.globalAlpha=1}

