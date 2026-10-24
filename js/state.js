/* Crown & Kingdoms — shared runtime state, canvas minimap buffers and core helpers. */
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];const TEAM_COLORS=['#3b82f6','#d9423a','#a855f7','#eab308'];const teamColor=t=>TEAM_COLORS[t]||'#64748b';
let S,pad=null,P=[],E=[],prev=[],mode='title',ca=0,diff=1,kingdoms=4,startAge=0,startRes=0,startArmy=0,startVillagers=1,workerQuick=0,popLimit=200,mapLayout=0,gameMode=0,perfHud=0,perfFps=0,perfStepMs=0,perfDrawMs=0,perfStepPeak=0,perfDrawPeak=0,menu=null,place=null,fx=[],notes=[],cur={x:600,y:400},cam={x:0,y:0},idleI=0,gpErr='',aip=0,ti=0,si=0,oi=0,rbk='pause',seedOv=null,aiCiv=-1,cmp=null,bi=0,ci=0,PRF=null,VOL={m:1,mu:1,sf:1,am:1},rmb=1,RE=[],civ=0,fm=0,vm=0,scoreLimit=1200,mt=0,mus=1,corp=[],rub=[],pm=0,gs=1,gt=0,ov=0,snd=1,dz=.18,dzr=.18,AC=null,ER=[],BM={},hs=0,ri=0,rw=0,msz=2,inf='c',pat=0,cspd=1,camspd=1,last=performance.now(),acc=0;
const mmc=document.createElement('canvas');mmc.width=W;mmc.height=H;const mmx=mmc.getContext('2d');let mmd=mmx.createImageData(W,H);let PA;function setSize(n){W=H=n;if(typeof TCH!=='undefined')TCH.clear();PA={pr:new Int32Array(n*n),g:new Float32Array(n*n),cl:new Int32Array(n*n),st:new Int32Array(n*n),v:0};mmc.width=n;mmc.height=n;mmd=mmx.createImageData(n,n)}
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),note=s=>{uis('note');notes.push({s,t:3.5});if(notes.length>4)notes.shift()};
const mk=s=>{s|=0;const next=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};next.state=()=>s>>>0;return next};

/* Resolve the visible name of a researched unit in one shared presentation helper. */
function unitName(k,t){
 const tech=S&&S.tech&&S.tech[t]||{};
 if(k==='mil')return tech.champ?'Champion':tech.twohand?'Two-Handed Swordsman':tech.longs?'Long Swordsman':tech.man?'Man-at-Arms':U[k].n;
 if(k==='spear'&&tech.halb)return 'Halberdier';
 if(k==='spear'&&tech.pike)return 'Pikeman';
 if(k==='xbow'&&tech.arb)return 'Arbalester';
 if(k==='skirm'&&tech.elsk)return 'Elite Skirmisher';
 if(k==='scout'&&tech.lcav)return 'Light Cavalry';
 if(k==='knight'&&tech.cavl)return 'Cavalier';
 if(k==='camel'&&tech.hcamel)return 'Heavy Camel Rider';
 return U[k]?U[k].n:k;
}
