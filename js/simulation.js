/* Crown & Kingdoms — economy, combat, unit behaviour, AI, commands and fixed-step simulation. */
// Find accessible water staging beside a free beach with one multi-goal A* search.
function transportLandingRoute(u,x,y){
 if(!S||!u||u.k!=='trn'||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return null;
 /* Only units in the landing search square can block a candidate beach tile. */
 const occupied=new Set(),minX=Math.max(0,(x|0)-5),maxX=Math.min(W-1,(x|0)+5),minY=Math.max(0,(y|0)-5),maxY=Math.min(H-1,(y|0)+5);
 for(const v of S.us)if(v&&v.hp>0&&!v.ld&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=minX&&v.x<maxX+1&&v.y>=minY&&v.y<maxY+1)occupied.add((v.y|0)*W+(v.x|0));
 const staging=new Map();
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
  const bx=(x|0)+dx,by=(y|0)+dy;
  if(bx<=0||by<=0||bx>=W-1||by>=H-1)continue;
  const offsetX=bx+.5-x,offsetY=by+.5-y,idx=by*W+bx,dist2=offsetX*offsetX+offsetY*offsetY;
  if(dist2>25||S.g[idx]||S.nd[idx]||S.wt[idx]===1||occupied.has(idx))continue;
  for(let dir=0;dir<8;dir++){
   const direction=D8[dir],ox=direction[0],oy=direction[1],sx=bx+ox,sy=by+oy;
   if(sx<0||sy<0||sx>=W||sy>=H)continue;
   const si=sy*W+sx;
   if(S.wt[si]!==1||S.nd[si])continue;
   if(ox&&oy&&(S.wt[by*W+sx]!==1||S.wt[sy*W+bx]!==1||S.nd[by*W+sx]||S.nd[sy*W+bx]))continue;
   const prev=staging.get(si);
   if(!prev||dist2<prev.dist2)staging.set(si,{bx,by,dist2});
  }
 }
 if(!staging.size)return null;
 const goal=(a,b)=>staging.has(b*W+a);
 goal.hx=x;goal.hy=y;goal.hr=7;
 const route=path(u,goal);
 if(!route||!route.length)return null;
 const end=route[route.length-1],tile=staging.get((end[1]|0)*W+(end[0]|0));
 return tile?{route,beach:[tile.bx,tile.by]}:null;
}
function tickTrader(u,dt){
 const endpoint=u.k==='cog'?'dock':'market',keyOf=b=>[b.t,b.k,b.x,b.y].join(':');
 // AoE2 DE Xbox fidelity: trade units follow their assigned routes; they do not
 // autonomously flee enemy forces or choose a new escape destination.
 let src=u.tradeFromKey?S.bs.find(b=>keyOf(b)===u.tradeFromKey&&b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0):null;
 if(!src){
  // A lost home depot must not silently reassign the player's trade route.
  if(u.t===0){u.tradePaused=true;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.o='i';u.p=[];u.rp=0;return}
  if((u.tradeSourceWait||0)>0){u.tradeSourceWait=Math.max(0,u.tradeSourceWait-dt);u.o='i';u.p=[];u.rp=0;return}
  const footprintSq=b=>{const sz=b.s||0,dx=Math.max(b.x-u.x,0,u.x-(b.x+sz)),dy=Math.max(b.y-u.y,0,u.y-(b.y+sz));return dx*dx+dy*dy};
  const sources=S.bs.filter(b=>b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0).map(b=>({b,dist2:footprintSq(b)})).sort((a,b)=>a.dist2-b.dist2);
  src=null;
  for(let i=0;i<Math.min(24,sources.length);i++){const depot=sources[i].b;if(path(u,goalNear(depot,1))){src=depot;break}}
  u.tradeFromKey=src?keyOf(src):null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.rp=0;
 }
 if(!src){if(u.t===0&&u.tradeDestKey){u.tradePaused=true;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0}u.tradeSourceWait=4;u.o='i';u.p=[];u.rp=0;return}
 u.tradeSourceWait=0;
 let dest=u.tradeDestKey?S.bs.find(b=>keyOf(b)===u.tradeDestKey&&b.done&&b.hp>0&&b.t!==u.t&&b.k===endpoint&&!isHostile(u.t,b.t)):null;
 if(!dest){
  // Player trade routes require an explicit foreign market/dock order.
  // Do not silently pick a replacement destination on the player's behalf.
  if(u.t===0){u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.rp=0;u.o='i';u.tradePaused=true;return}
  u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.trWait=(u.trWait||0)-dt;
  if(u.trWait>0){u.o='i';u.p=[];u.rp=0;return}
  /* Filter threats once per trade route selection, and use squared corridor checks. */
  const threats=S.us.filter(e=>e&&e.hp>0&&!e.ld&&isHostile(u.t,e.t)&&U[e.k]?.dmg>0&&!!U[e.k].sh===!!U[u.k].sh);
  const candidates=S.bs.filter(b=>{const dx=b.x-src.x,dy=b.y-src.y;return b.done&&b.hp>0&&b.k===endpoint&&Number.isInteger(b.t)&&b.t>=0&&b.t<S.teamN&&b.t!==u.t&&!isHostile(u.t,b.t)&&dx*dx+dy*dy>=36}).map(b=>{
   const dx=b.x-src.x,dy=b.y-src.y,denom=dx*dx+dy*dy,distance=Math.sqrt(denom);
   let danger=0;
   for(const e of threats){
    const fraction=Math.max(0,Math.min(1,((e.x-src.x)*dx+(e.y-src.y)*dy)/denom));
    const ox=e.x-(src.x+fraction*dx),oy=e.y-(src.y+fraction*dy);
    if(ox*ox+oy*oy<49)danger++;
   }
   return {b,score:distance-danger*12}
  }).sort((a,b)=>b.score-a.score);
  dest=null;for(let i=0;i<Math.min(24,candidates.length);i++){const candidate=candidates[i];if(path(u,goalNear(candidate.b,1))){dest=candidate.b;break}}
  if(!dest){u.trWait=6;u.o='i';u.p=[];u.rp=0;return}
  u.tradeDestKey=keyOf(dest);u.trWait=0;
 }
 const goal=u.tradeReturning?src:dest;
 if(d2(u.x,u.y,goal)<=1.1){
  u.p=[];u.rp=0;
  if(u.tradeReturning){const earned=Number.isSafeInteger(u.tradeCargo)&&u.tradeCargo>0?u.tradeCargo:0,bank=S.res[u.t];if(earned&&bank&&Number.isFinite(bank.g)&&bank.g>=0&&bank.g<=Number.MAX_SAFE_INTEGER-earned){bank.g+=earned;if(u.t===0)note(U[u.k].n+' delivered +'+earned+' gold')}u.tradeCargo=0;u.tradeReturning=false;u.tradeSourceWait=0;}
  else{
   const distance=Math.hypot((src.x+src.s/2)-(dest.x+dest.s/2),(src.y+src.s/2)-(dest.y+dest.s/2));
   u.tradeCargo=Number.isFinite(distance)?Math.max(2,Math.round(distance*0.35)):0;
   u.tradeReturning=true;u.rp=0;
  }
  u.o='i';return;
 }
 if(!u.p.length||u.rp<=0){
  const p=path(u,goalNear(goal,1));u.rp=1;
  if(!p){if(u.tradeReturning){u.tradeFromKey=null;u.tradeCargo=0;u.tradeReturning=false}else u.tradeDestKey=null;u.p=[];u.rp=0;u.trWait=5;u.o='i';return}
  u.p=p;
 }
 u.o='m';walk(u,dt)
}
// DE baseline land rates; ship fishing and specialised resource rules remain under audit.
function baseGatherRate(u,n){
 if(u.k!=='vil')return GR;
 if(n.k==='w')return .39;
 if(n.k==='g')return .38;
 if(n.k==='s')return .36;
 if(n.k==='f')return n.fm?.32:n.an?.41:.31;
 return GR;
}
function gatherCapacity(u){const tech=S.tech[u.t]||{};return CAP+(tech.carry?5:0)+(u.k==='vil'&&tech.wheel?3:0)+(u.k==='vil'&&tech.handcart?7:0)}
function unitSpeed(u){const tech=S.tech[u.t]||{};return (u.k==='scout'&&tech.lcav?1.5:U[u.k].sp)*((tech.husb&&CAVARM.has(u.k))?1.1:1)*((tech.squires&&INFARM.has(u.k))?1.1:1)*((u.k==='mil'&&tech.man)?(.96/.9):1)*(u.k==='vil'?1+(tech.wheel?.1:0)+(tech.handcart?.1:0):1)*((tech.fervor&&u.k==='mon')?1.15:1)}
function walk(u,dt){const p=u.p;if(!p.length)return true;if(!Number.isFinite(dt)||dt<=0)return false;if(!Array.isArray(p[0])||p[0].length!==2){u.p=[];u.rp=0;return true}const[tx,ty]=p[0];if(!Number.isFinite(tx)||!Number.isFinite(ty)||tx<0||ty<0||tx>=W||ty>=H){u.p=[];u.rp=0;return true}if((u.sh?!(S.wt[(ty|0)*W+(tx|0)]&&!S.nd[(ty|0)*W+(tx|0)]):(S.wt[(ty|0)*W+(tx|0)]===1||S.g[(ty|0)*W+(tx|0)]&&S.gt[(ty|0)*W+(tx|0)]!==u.t+1))&&p.length>1){u.p=[];u.rp=0;return true}
const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy),st=Math.max(0,unitSpeed(u)*dt),tl=p.length>1?.45:u.o==='m'?.6:0;if(d<=st){const ox=u.x,oy=u.y;mv(u,dx,dy);if(u.x===ox&&u.y===oy&&d>0){u.p=[];u.rp=0;return true}p.shift()}else if(d<=tl)p.shift();else{const ox=u.x,oy=u.y;mv(u,dx/d*st,dy/d*st);if(u.x===ox&&u.y===oy){u.p=[];u.rp=0;return true}}return!p.length}
/* ===== COMBAT ===== */
// The spear-line's cavalry/camel/elephant bonuses increase at each upgrade.
// These are armor-class approximations for the currently modelled unit kinds.
// Other class interactions (ships, shock infantry and regional bonuses) stay
// tracked separately in the AoE2 DE parity roadmap.
const SPEAR_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon']);
const SPEAR_CAMELS=new Set(['camel','mamel']);
const SPEAR_ELEPHANTS=new Set(['ele','eled']);
function spearLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,tech=S.tech[a.t]||{};
 const tier=tech.halb?2:tech.pike?1:0;
 if(SPEAR_ELEPHANTS.has(key)||SPEAR_ELEPHANTS.has(alias))return [15,25,28][tier];
 if(SPEAR_CAMELS.has(key)||SPEAR_CAMELS.has(alias))return [12,18,26][tier];
 if(SPEAR_CAVALRY.has(key)||SPEAR_CAVALRY.has(alias))return [15,22,32][tier];
 return U.spear.bn?.[key]||U.spear.bn?.[alias]||0;
}
// Counter bonuses are attached to AoE2 armour classes, not broadly to
// villagers, siege and all ranged units. The compact roster still needs a
// complete class table (especially regional unique units) in a later audit.
const SKIRM_ARCHER_KINDS=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko']);
const SKIRM_CAV_ARCHER_KINDS=new Set(['mgd','eled','wagon']);
function scoutLineBonus(a,t){
 return t.k==='mon'?(S.tech[a.t]?.lcav?10:6):0;
}
function skirmisherBonus(a,t){
 const tech=S.tech[a.t]||{},elite=!!tech.elsk,k=t.k;
 if(k==='spear')return elite?4:3;
 if(SKIRM_ARCHER_KINDS.has(k))return elite?4:3;
 if(SKIRM_CAV_ARCHER_KINDS.has(k))return elite?2:0;
 if(k==='mamel')return 2;
 return 0;
}
function dmgT(a,t){if(!a||!t||!U[a.k]||(!t.s&&!U[t.k])||!Number.isFinite(t.hp)||t.hp<=0||t.ld||!S.tech[a.t]||!isHostile(a.t,t.t))return;const ak=U[a.k],tk=S.tech[a.t],ta=S.tech[t.t]||{},bd=(ak.rng<2?(tk.atkM2?5:tk.atkM?2:0):arrowBonus(a))+(a.k==='scout'&&(S.age?.[a.t]||0)>=1?2:0)+(!t.s&&(a.k==='spear'?spearLineBonus(a,t):a.k==='skirm'?skirmisherBonus(a,t):a.k==='scout'?scoutLineBonus(a,t):(ak.bn&&(ak.bn[t.k]||ak.bn[U[t.k].lk])||0)))+(t.s&&ak.bb||0)+(t.s&&ak.rng<2&&INFARM.has(a.k)&&tk.arson?2:0)+(tk.atkb&&tk.atkb[a.k]||0)+((a.k==='tw'||a.k==='cs'||a.k==='tca')?(tk.slit?2:0)+(tk.gtow?3:0)+(tk.keep?3:0)+(tk.gf?4:0):0),cls=ak.sg?'s':ak.rng>2?'p':'m',ib=(INFARM.has(t.k)&&ta.armI?1:0)+(ARCHARM.has(t.k)&&ta.armR?1:0)+(CAVARM.has(t.k)&&ta.armC?1:0),ar=t.s?(cls==='p'?8:2):cls==='p'?(PRA[t.k]||0)+ib+(t.k==='skirm'&&ta.elsk?1:0):(MA[t.k]||0)+ib+(t.k==='mil'&&ta.longs?1:0);t.hp-=Math.max(1,(ak.dmg+bd)*(!t.s&&ak.du?ak.du:1)-ar);fx.push({x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,l:.2,k:'h'});if(!t.s)t.hit=gt;emit('spark',t.x+(t.s||0)/2,t.y+(t.s||0)/2,t.s?3:5,{s:2.2,vz:2.6,l:.35,c:ak.rng>2?'#e8d8a0':'#ffb050',r:1.6});
hitSnd(a,t);
if(t.t===0){S.ping={x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,t:S.t};if(S.t-S.al>12){S.al=S.t;note('Under attack! L3 with nothing selected jumps there');sfx('horn');rumble(260,.6,.3)}}
if(t.hp<=0&&!t.dead){t.dead=1;if(t.s){for(let j=0;j<t.s;j++)for(let i=0;i<t.s;i++){S.g[(t.y+j)*W+t.x+i]=0;S.gt[(t.y+j)*W+t.x+i]=0}if(t.cg)for(const c of t.cg)c.ld=null;rub.push({x:t.x,y:t.y,s:t.s,t:gt});emit('smk',t.x+t.s/2,t.y+t.s/2,18,{s:1.6,vz:1.4,l:2.4,c:'#777',r:5});emit('deb',t.x+t.s/2,t.y+t.s/2,14,{s:3,vz:4,l:1,c:'#8a7a62',r:2.2});sfx('collapse',t.x+t.s/2,t.y+t.s/2);if(t.t===0)rumble(400,.9,.5);if(t.k==='tc'&&tcEnds(t)){if(cmp){if(t.t===0)endGame('lose','Your Town Centre fell');else if(CAMP[cmp.i].tcw)endGame('win','The enemy Town Centre fell')}else if(vm===0){if(t.t===0)endGame('lose','Your Town Centre fell');else if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');else note('A rival Town Centre has fallen')}else if(vm===6){if(t.t===0)endGame('lose','Your Town Centre fell in Sudden Death');else{for(const b of S.bs)if(b.t===t.t)b.hp=0;for(const u of S.us)if(u.t===t.t)u.hp=0;S.pj=S.pj.filter(p=>!p.a||p.a.t!==t.t);note(CIV[S.civ[t.t]].n+' was eliminated — Town Centre destroyed');if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death')}}}}else{sfx(U[t.k].sh?'sink':'death',t.x,t.y,{k:t.k});corp.push({x:t.x,y:t.y,k:t.k,tm:t.t,fd:t.fd||1,sh:!!U[t.k].sh,t:gt});emit('puff',t.x,t.y,6,{s:1.2,vz:1,l:.8,c:'#c8c0b0',r:3});if(corp.length>60)corp.shift();if(a.t===0)S.pl.kills++}}}
// Arrow technology applies to explicit weapon families, never all ranged damage.
const ARROW_WEAPONS=new Set(['arc','xbow','skirm','lbow','chuko','mgd','eled','genoa','plumed','wagon','gal','tw','cs','tca']);
// AoE2:DE Thumb Ring: +100% nominal accuracy against non-moving targets.
// Skirmishers gain accuracy but no faster reload; mounted archers gain a
// smaller firing-speed increase; Chu Ko Nu gains a larger one.
const THUMB_FOOT_ARCHERS=new Set(['arc','xbow','lbow','genoa','plumed','eled']);
const THUMB_MOUNTED_ARCHERS=new Set(['mgd','wagon']);
function rangedAccuracy(a){
 const d=U[a.k];if(!d)return 1;
 if(S.tech[a.t]?.thumb&&(['arc','xbow','skirm'].includes(a.k)))return 1;
 return a.k==='xbow'&&S.tech[a.t]?.arb?.9:(d.acc??1);
}
function attackReload(u){
 const base=U[u.k]?.cd||2;
 if(!S.tech[u.t]?.thumb)return base;
 if(u.k==='chuko')return base*.8;
 if(THUMB_MOUNTED_ARCHERS.has(u.k))return base*.9;
 if(THUMB_FOOT_ARCHERS.has(u.k))return base*.85;
 return base;
}
function arrowBonus(a){const t=S.tech[a.t]||{};return ARROW_WEAPONS.has(a.k)?(t.atkR2?3:t.bodkin?2:t.atkR?1:0):0}
function arrowSightBonus(e){return arrowBonus({k:B[e.k]?.atk||e.k,t:e.t})}
function attackRange(a){return (U[a.k]?.rng||0)+(a.k==='tca'?0:arrowBonus(a))+(a.k==='skirm'&&S.tech[a.t]?.elsk?1:0)}
// A shot records a fixed impact point at launch. Ballistics predicts constant
// movement along the current path segment; later turns can still dodge it.
function projectileSpeed(a){return U[a.k]?.ps||14}
function projectileAim(a,t){
 let x=t.x+(t.s||0)/2,y=t.y+(t.s||0)/2;
 const next=t.p?.[0],predict=S.tech[a.t]?.ballistics&&(ARROW_WEAPONS.has(a.k)||a.k==='scor');
 if(predict&&!t.s&&!t.ld&&next&&U[t.k]){
  const dx=next[0]-t.x,dy=next[1]-t.y,length=Math.hypot(dx,dy);
  if(length>0&&Number.isFinite(length)){
   const speed=unitSpeed(t),vx=dx/length*speed,vy=dy/length*speed,rx=x-a.x,ry=y-a.y;
   const arrowSpeed=projectileSpeed(a),aa=vx*vx+vy*vy-arrowSpeed*arrowSpeed,bb=2*(rx*vx+ry*vy),cc=rx*rx+ry*ry,disc=bb*bb-4*aa*cc;
   const time=Math.abs(aa)<1e-9?(bb<0?-cc/bb:0):disc>=0?(-bb-Math.sqrt(disc))/(2*aa):0;
   if(Number.isFinite(time)&&time>0){x+=vx*time;y+=vy*time;}
  }
 }
 return {tx:Math.max(0,Math.min(W-.001,x)),ty:Math.max(0,Math.min(H-.001,y))};
}
function launchProjectile(a,t){
 const aim=projectileAim(a,t);
 // Fixed inaccurate aim is sampled at launch from the saved/replicated RNG.
 // A miss never magically homes back towards its original target.
 // Building targets are fully accurate; projectile collision is still checked
 // at arrival, so Ballistics and target movement remain distinct mechanics.
 if(!t.s&&rangedAccuracy(a)<1&&S.r()>=rangedAccuracy(a)){
  const dx=aim.tx-a.x,dy=aim.ty-a.y,distance=Math.hypot(dx,dy)||1;
  const deviation=(.8+S.r()*.6)*(S.r()<.5?-1:1);
  aim.tx=Math.max(0,Math.min(W-.001,aim.tx-dy/distance*deviation));
  aim.ty=Math.max(0,Math.min(H-.001,aim.ty+dx/distance*deviation));
 }
 S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},...aim});
}
const hit=(a,t)=>{if(U[a.k].rng>2){sfx(U[a.k].sg?'launch':'bow',a.x,a.y);launchProjectile(a,t)}else dmgT(a,t)};
function pjs(dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 for(const p of S.pj){
  if(!p||!p.t||!p.a||!U[p.a.k]||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.t.x)||!Number.isFinite(p.t.y)||!Number.isFinite(p.t.hp)){if(p)p.dead=1;continue;}
  // Old saves lack an aim: migrate once, then retain the same fixed trajectory.
  if(p.tx===undefined&&p.ty===undefined){p.tx=p.t.x+(p.t.s||0)/2;p.ty=p.t.y+(p.t.s||0)/2;}
  if(!Number.isFinite(p.tx)||!Number.isFinite(p.ty)||p.tx<0||p.ty<0||p.tx>=W||p.ty>=H||p.t.hp<=0||p.t.ld||!isHostile(p.a.t,p.t.t)){p.dead=1;continue;}
  const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy),travel=projectileSpeed(p.a)*dt;
  if(dist>travel){p.x+=dx/dist*travel;p.y+=dy/dist*travel;continue;}
  p.x=p.tx;p.y=p.ty;
  const size=p.t.s||0,gapX=Math.max(p.t.x-p.tx,0,p.tx-p.t.x-size),gapY=Math.max(p.t.y-p.ty,0,p.ty-p.t.y-size);
  const direct=gapX*gapX+gapY*gapY<=.35*.35;
  if(direct)dmgT(p.a,p.t);
  const sp=U[p.a.k].spl;
  if(sp){const splash2=sp*sp,ix=p.tx,iy=p.ty;
   for(const e of S.us)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&!e.ld&&(e.x-ix)*(e.x-ix)+(e.y-iy)*(e.y-iy)<splash2)dmgT(p.a,e);
   for(const e of S.bs)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&(e.x+(e.s||0)/2-ix)**2+(e.y+(e.s||0)/2-iy)**2<splash2)dmgT(p.a,e);
  }
  p.dead=1;
 }
 compactNotFlag(S.pj,'dead');
}
const FOE_CELL=8,FOE_BUCKETS=new Map(),FOE_BUCKET_POOL=[];
let foeGridDirty=true;
function rebuildFoeGrid(){
 for(const bin of FOE_BUCKETS.values()){bin.length=0;FOE_BUCKET_POOL.push(bin)}
 FOE_BUCKETS.clear();
 for(let i=0;i<S.us.length;i++){
  const e=S.us[i];if(!e||e.hp<=0||e.ld||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
  const key=Math.floor(e.x/FOE_CELL)+','+Math.floor(e.y/FOE_CELL);
  let bin=FOE_BUCKETS.get(key);
  if(!bin){bin=FOE_BUCKET_POOL.pop()||[];FOE_BUCKETS.set(key,bin)}
  bin.push(i)
 }
 foeGridDirty=false
}
// Conversion helpers are shared by solo input, AI and authenticated orders.
function resetConversion(u){u.cv=0;u.cvNext=0;u.cvTargetId=null;u.cvTeam=null}
function conversionRange(u,target){return target?.s||['ram','treb'].includes(target?.k)?1:9+(S.tech[u.t]?.blockPrinting?3:0)}
function unitSight(u){return u.k==='mon'?11+(S.tech[u.t]?.blockPrinting?3:0):8+arrowSightBonus(u)}
const CONVERSION_SIEGE=new Set(['ram','mang','scor','treb','bomb']);
function canConvert(u,target){
 if(!u||u.k!=='mon'||u.hp<=0||u.ld||u.rel||u.st===4||!S.us.includes(u)||
    !target||target.hp<=0||target.ld||!isHostile(u.t,target.t)||
    !Number.isFinite(target.x)||!Number.isFinite(target.y))return false;
 const tech=S.tech[u.t]||{};
 // Cargo capture/ejection needs its own ownership model; never transfer a
 // container while its occupants still belong to another kingdom.
 if((target.cg||[]).some(c=>c&&c.hp>0))return false;
 if(target.s)return S.bs.includes(target)&&target.done&&!!tech.redemption&&
   !['tc','castle','monastery','farm','palisade','wall','gate','wonder'].includes(target.k);
 if(!S.us.includes(target)||!U[target.k]||target.k==='king')return false;
 if(target.k==='mon'&&!tech.atonement)return false;
 if((U[target.k].sg||CONVERSION_SIEGE.has(target.k))&&!tech.redemption)return false;
 return true;
}
function beginConversion(units,target){
 if(!units.length||units.some(u=>!canConvert(u,target)||(u.faith??100)<100||u.cd>0))return false;
 const routes=units.map(u=>path(u,goalNear(target,conversionRange(u,target)-.1)));
 if(routes.some(route=>!route))return false;
 units.forEach((u,i)=>{resetConversion(u);u.o='v';u.tg=target;u.p=routes[i];u.rp=.7;
  u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;u.retreating=false;u.retreatTarget=null;
  u.ut=null;u.unloadBeach=null;});return true;
}
function conversionWindow(target){
 const tech=S.tech[target.t]||{},resistance=(tech.devotion?1:0)+(tech.faith?4:0);
 const scout=target.k==='scout',ship=!!U[target.k]?.sh;
 return {min:(target.s?15:5)+resistance+(scout?3:ship?2:0),max:(target.s?25:9)+resistance+(scout?1:ship?2:0)};
}
function completeConversion(u,target){
 const team=u.t,oldTeam=target.t;
 const helpers=S.us.filter(m=>m.k==='mon'&&m.t===team&&m.hp>0&&!m.ld&&m.o==='v'&&m.tg===target);
 for(const m of helpers){if(m===u||!S.tech[team].theocracy)m.faith=0;resetConversion(m);m.o='i';m.tg=null;m.p=[];}
 if(S.tech[oldTeam]?.heresy&&!target.s){
  if(target.rel){target.rel.c=null;target.rel=null;}
  target.hp=0;target.dead=1;target.o='i';target.tg=null;target.p=[];target.pt=null;resetConversion(target);
  return true;
 }
 target.t=team;target.p=[];target.tg=null;target.pt=null;target.o='i';target.autoWorker=0;target.as=0;
 target.guardTarget=null;target.retreating=false;target.retreatTarget=null;target.ut=null;target.unloadBeach=null;
 if(target.rel){target.rel.c=null;target.rel=null;}
 if(target.s){target.q=[];target.rs=null;target.rally=null;target.cd=0;}
 else{target.car=0;target.ct=null;target.ret=0;resetConversion(target);
  if(target.k==='mon')target.faith=0;
  if(['cart','cog'].includes(target.k)){target.tradeFromKey=null;target.tradeDestKey=null;target.tradeCargo=0;target.tradePaused=true;target.manualTradeMove=false;}
 }
 // Selection and control groups remain local; stale members are filtered by
 // their existing current-ownership guards instead of being sent to a peer.
 foeGridDirty=true;fx.push({x:target.x,y:target.y,l:.5,k:'p'});return true;
}
function tickConversion(u,dt){
 const target=u.tg;
 if(!canConvert(u,target)){resetConversion(u);u.o='i';u.tg=null;u.p=[];return;}
 if(u.cvTargetId!==target.netId||u.cvTeam!==target.t){resetConversion(u);u.cvTargetId=target.netId;u.cvTeam=target.t;}
 if((u.faith??100)<100||u.cd>0)return;
 const range=conversionRange(u,target),distance=d2(u.x,u.y,target);
 if(distance>range){if(!u.p.length||u.rp<=0){u.p=path(u,goalNear(target,Math.max(.8,range-.1)))||[];u.rp=.7;}if(u.p.length)walk(u,dt);return;}
 u.p=[];u.cv+=dt;
 const window=conversionWindow(target),interval=Math.floor(u.cv+1e-8);
 if(interval<window.min||interval<Math.max(window.min,u.cvNext||0))return;
 u.cvNext=interval+1;
 if(interval>=window.max||S.r()<.4)completeConversion(u,target);
}
function defenceTarget(building,shooter,range){
 const minimum=['tower','castle'].includes(building.k)&&!S.tech[building.t]?.murderHoles?1:0;
 let best=null,distance=range*range;
 for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(building.t,e.t))continue;
  const edgeX=Math.max(building.x-e.x,0,e.x-building.x-building.s),edgeY=Math.max(building.y-e.y,0,e.y-building.y-building.s);
  if(minimum&&edgeX*edgeX+edgeY*edgeY<minimum*minimum)continue;
  const dx=e.x-shooter.x,dy=e.y-shooter.y,d=dx*dx+dy*dy;
  if(d<distance){best=e;distance=d;}
 }return best;
}
function healGarrison(b,dt){if(!b.cg?.length)return;const rate=S.tech[b.t]?.herbalMedicine ? .6 : .1;
 for(const u of b.cg)if(u&&S.us.includes(u)&&u.hp>0&&u.ld===b&&u.t===b.t)u.hp=Math.min(mhp(u),u.hp+rate*dt);
}
function nearestFoeUnit(u,r){
 if(!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(r)||r<=0)return null;
 if(foeGridDirty)rebuildFoeGrid();
 let b=null,bd2=r*r,bestIndex=Infinity;
 /* Compare squared distances: thousands of nearby combat checks need no square roots. */
 const minX=Math.floor((u.x-r)/FOE_CELL),maxX=Math.floor((u.x+r)/FOE_CELL);
 const minY=Math.floor((u.y-r)/FOE_CELL),maxY=Math.floor((u.y+r)/FOE_CELL);
 /* Empty or wholly out-of-map search bounds cannot contain indexed units. */
 if(maxX<0||maxY<0||minX>=Math.ceil(W/FOE_CELL)||minY>=Math.ceil(H/FOE_CELL))return null;
 for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
  const bin=FOE_BUCKETS.get(cx+','+cy);if(!bin)continue;
  for(const i of bin){
   const e=S.us[i];
   if(!e||!isHostile(u.t,e.t)||e.hp<=0||e.ld)continue;
   const dx=e.x-u.x,dy=e.y-u.y,d2=dx*dx+dy*dy;
   if(d2<bd2||(b&&d2===bd2&&i<bestIndex)){bd2=d2;b=e;bestIndex=i}
  }
 }
 return b
}
function foe(u,r,building){
 if(building)return defenceTarget(building,u,r);
 let b=null,bd2=r*r;
 /* Siege still prioritises hostile buildings before searching for units. */
 if(U[u.k]?.sg){
  for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){
   const sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz)),d=dx*dx+dy*dy;
   if(d<bd2){bd2=d;b=q}
  }
  if(b)return b
 }
 b=nearestFoeUnit(u,r);if(b)return b;
 for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){
  const sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz)),d=dx*dx+dy*dy;
  if(d<bd2){bd2=d;b=q}
 }
 return b
}
/* ===== ECONOMY / UNIT BEHAVIOUR ===== */
// Farms have one live assigned worker. Old duplicate orders use stable unit order.
function farmAvailableTo(u,n){
 if(!n?.fm)return true;
 if(!u||u.k!=='vil'||!Number.isInteger(n.t)||n.t!==u.t)return false;
 const workers=Array.isArray(S?.us)?S.us:[],at=workers.indexOf(u);
 return !workers.some((v,i)=>v&&v!==u&&v.k==='vil'&&v.hp>0&&!v.ld&&!v.retreating&&v.o==='g'&&v.tg===n&&(at<0||i<at));
}
function findNode(u,k,r=16){if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(r)||r<=0)return null;let b=null,bd2=r*r;for(const n of S.nodes)if(n&&n.k===k&&n.amt>0&&!n.an&&!!n.fi===!!u.sh&&(!n.trap||n.t===u.t)&&farmAvailableTo(u,n)&&Number.isInteger(n.x)&&Number.isInteger(n.y)&&n.x>=0&&n.y>=0&&n.x<W&&n.y<H&&(u.sh||S.wt[n.y*W+n.x]!==1)){const dx=n.x-u.x,dy=n.y-u.y,d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;b=n}}return b}
function dropoffKey(q){return [q.t,q.k,q.x,q.y].join(':')}
function dropoffCompatible(u,q){return q.t===u.t&&q.hp>0&&q.done&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0&&q.y>=0&&q.x<W&&q.y<H&&(u.sh?q.k==='dock':q.k==='tc'||(q.k==='lumber'&&u.ct==='w')||(q.k==='mine'&&(u.ct==='g'||u.ct==='s'))||(q.k==='mill'&&u.ct==='f'))}
function skipDropoff(u,q){if(!u||!q)return;const key=dropoffKey(q);if(!Array.isArray(u.dropSkipKeys))u.dropSkipKeys=[];if(!u.dropSkipKeys.includes(key)){if(u.dropSkipKeys.length>=32)u.dropSkipKeys.shift();u.dropSkipKeys.push(key)}}
function findDropoffRoute(u){
 if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=W||u.y>=H)return null;
 const compatible=S.bs.filter(q=>dropoffCompatible(u,q));
 if(!compatible.length)return null;
 /* Cache destination keys and distances once per routing attempt, not per sort comparison. */
 const info=new Map(),live=new Set();
 for(const q of compatible){
  const key=dropoffKey(q),sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz));
  info.set(q,{key,dist2:dx*dx+dy*dy});live.add(key)
 }
 u.dropSkipKeys=(Array.isArray(u.dropSkipKeys)?u.dropSkipKeys:[]).filter(key=>live.has(key)).slice(-32);
 const skipped=new Set(u.dropSkipKeys);
 let candidates=compatible.filter(q=>!skipped.has(info.get(q).key));
 if(!candidates.length){u.dropSkipKeys=[];candidates=compatible.slice()}
 candidates.sort((a,b)=>Number(info.get(b).key===u.dropKey)-Number(info.get(a).key===u.dropKey)||info.get(a).dist2-info.get(b).dist2);
 let failed=0;
 for(const q of candidates){
  const route=path(u,goalNear(q,1));
  if(route&&route.length)return {b:q,route};
  skipDropoff(u,q);
  if(++failed>=6)break;
 }
 return null;
}
function deployFishTrap(ships){let made=0;for(const u of ships){if(!u||u.k!=='fish'||u.hp<=0||u.ld||!S.res[u.t]||S.res[u.t].w<100)continue;let spot=null;for(let r=1;r<=4&&!spot;r++)for(let y=Math.max(1,(u.y|0)-r);y<=Math.min(H-2,(u.y|0)+r)&&!spot;y++)for(let x=Math.max(1,(u.x|0)-r);x<=Math.min(W-2,(u.x|0)+r);x++){const i=y*W+x;if(S.wt[i]===1&&!S.nd[i]&&(x+.5-u.x)**2+(y+.5-u.y)**2<=16){spot={x,y,i};break}}if(!spot)continue;S.res[u.t].w-=100;const n={k:'f',x:spot.x,y:spot.y,s:1,amt:900,fi:1,trap:1,t:u.t};S.nodes.push(n);S.nd[spot.i]=n;made++;}if(made)note('Fish trap deployed ('+made+'; -'+made*100+' wood)');else note('Need 100 wood per trap and an empty nearby water tile');return made}
function killNode(n){if(!n||!S.nodes.includes(n))return false;const i=n.y*W+n.x;if(S.nd[i]===n){S.nd[i]=null;S.g[i]=0}S.nodes=S.nodes.filter(m=>m!==n);return true}
function upU(u,dt){const d=U[u.k];u.cd-=dt;u.rp-=dt;if(u.o!=='a'&&u.wind>0){u.wind=0;u.windTarget=null}let tg=u.tg;if(u.k==='mon'){u.faith=Math.min(100,(u.faith??100)+dt*1.6*(S.tech[u.t].illumination?2:1));if(u.o!=='v')resetConversion(u);}if(u.ld)return;if(u.t===0&&u.k==='vil'&&u.o==='i'&&u.autoWorker&&S.vp&&S.vp.enabled){if((u.autoTry||0)<=0){u.autoTry=3;if(assignAutoVillager(u))return}else u.autoTry-=dt}if(u.retreating){const shelter=S.bs.find(b=>b===u.retreatTarget&&b.t===u.t&&b.hp>0&&b.done&&(b.k==='tc'||b.k==='castle'))||S.bs.filter(b=>b.t===u.t&&b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle')).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b))[0];if(!shelter){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null;u.p=[];u.o='i'}else{u.retreatTarget=shelter;if(d2(u.x,u.y,shelter)<=1.3){u.p=[];u.o='i';// Shelter proximity alone does not heal military units. Monks and unit-specific abilities use their own rules.
if(u.hp>=mhp(u)*.65||S.t>=(u.retreatRestUntil||(u.retreatRestUntil=S.t+8))){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null}}else{if((!u.p.length||u.rp<=0)&&S.t>=(u.retreatRouteRetryAt||0)){u.p=path(u,goalNear(shelter,1))||[];u.rp=1;u.retreatRouteRetryAt=S.t+(u.p.length?1:5)}if(u.p.length)walk(u,dt);return}if(u.retreating)return}}if((u.k==='cart'||u.k==='cog')&&u.o!=='B'&&u.o!=='rep'){if(u.tradePaused){u.o='i';u.p=[];u.rp=0;return}if(u.manualTradeMove&&u.o==='m'){if(walk(u,dt)){u.o='i';u.manualTradeMove=false;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;}return}u.manualTradeMove=false;tickTrader(u,dt);return}if(u.k==='bers'&&u.hp<mhp(u))u.hp=Math.min(mhp(u),u.hp+.5*dt);
if(u.k==='mon'&&(u.hc=(u.hc||0)-dt)<=0){u.hc=1;for(const e of S.us)if(e!==u&&e.t===u.t&&e.hp>0&&!e.ld){const dx=e.x-u.x,dy=e.y-u.y;if(dx*dx+dy*dy>=16)continue;const max=mhp(e);if(e.hp<max)e.hp=Math.min(max,e.hp+4)}}
if(u.k==='mon'&&u.o==='a'){const target=u.tg;if(!beginConversion([u],target)){u.o='i';u.tg=null;u.p=[];}return;}
if(u.o==='F'||u.o==='G'){const target=u.tg;if(!target||target.hp<=0||(!U[target.k]&&!target.q)||(target.q&&!target.done)||(target.t!==u.t&&diplomacyRelation(u.t,target.t)!=='ally')||!!U[u.k]?.sh!==!!(U[target.k]&&U[target.k].sh)){u.o='i';u.tg=null;u.guardTarget=null;u.p=[];return}if(u.o==='G'&&u.st!==4){const e=foe(u,6);if(e&&e!==target&&d2(target.x,target.y,e)<=5){u.guardTarget=target;u.o='a';u.tg=e;u.p=[];return}}const spacing=u.o==='F'?1.25:2,dist=d2(u.x,u.y,target);if(dist<=spacing){u.p=[];return}if(!u.p.length||u.rp<=0){u.p=path(u,goalNear(target,spacing))||[];u.rp=.6}if(u.p.length)walk(u,dt);return}if(u.o==='i'){if(u.as&&(u.sa=(u.sa||0)-dt)<=0){u.sa=1;const x=2+S.r()*(W-4),y=2+S.r()*(H-4),p=path(u,gp(x,y,2.5));if(p){u.o='m';u.p=p}}if(u.k==='mon'&&u.t>0&&(u.sc=(u.sc||0)-dt)<=0){u.sc=1;const e=u.st===4?null:S.us.find(e=>canConvert(u,e)&&d2(u.x,u.y,e)<=conversionRange(u,e));if(e){beginConversion([u],e)}else{const rl=S.rel.find(x=>!x.c&&!x.m);if(rl){u.o='r';u.tg=rl;u.p=[]}}}if(u.k!=='vil'&&u.k!=='mon'&&u.k!=='fish'&&u.k!=='trn'&&u.k!=='king'&&u.k!=='cart'&&u.k!=='cog'&&(u.sc=(u.sc||0)-dt)<=0){u.sc=.5;const sr=[Math.max(7,attackRange(u)),4,attackRange(u),0,0][u.st|0],e=sr>0?foe(u,sr):null;if(e){u.o='a';u.tg=e;u.p=[]}}return}
if(u.o==='m'){if(walk(u,dt))u.o='i';return}
if(u.o==='B'){if(!tg||tg.hp<=0||tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally'||tg.q&&!tg.done||(tg.q?!GAR[tg.k]:!U[tg.k]?.cap)||!!u.sh||(U[tg.k]?.cap&&u.t!==tg.t)||(tg.cg||[]).length>=(tg.q?GAR[tg.k]:U[tg.k].cap)||u===tg||u.ld){u.o='i';u.tg=null;u.p=[];u.rp=0;return}if(tg.q?d2(u.x,u.y,tg)<=1.4:Math.hypot(tg.x-u.x,tg.y-u.y)<=2){u.ld=tg;(tg.cg=tg.cg||[]).push(u);u.ut=null;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.tradePaused=false;u.manualTradeMove=false;u.x=tg.x+(tg.s||0)/2;u.y=tg.y+(tg.s||0)/2;u.o='i';u.p=[];u.rp=0;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,tg.q?1.3:1.7));u.rp=.8;if(!p){u.o='i';u.tg=null;u.p=[];u.rp=0;if(u.t===0)note('No route to board that transport');return}u.p=p}walk(u,dt);return}
if(u.o==='U'){
 // Keep manifests consistent with living passengers actually aboard this ship.
 if(!Array.isArray(u.cg))u.cg=[];
 u.cg=u.cg.filter(c=>c&&c.hp>0&&c.ld===u&&c.t===u.t&&U[c.k]&&!U[c.k].sh);
 const q=u.ut;
 const cancel=(message)=>{u.o='i';u.ut=null;u.unloadBeach=null;u.p=[];u.rp=0;u.unloadRouteRetryAt=0;if(message&&u.t===0)note(message)};
 if(u.k!=='trn'||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<0||q[1]<0||q[0]>=W||q[1]>=H||S.wt[(q[1]|0)*W+(q[0]|0)]===1||!u.cg.length){cancel();return}
 if(!Array.isArray(u.p))u.p=[];
 const beach=u.unloadBeach;
 if(!Array.isArray(beach)||beach.length!==2||!beach.every(Number.isFinite)){
  u.unloadBeach=null;u.p=[];u.rp=0;
 }
 if((!u.p.length||u.rp<=0)&&S.t>=(u.unloadRouteRetryAt||0)){
  const landing=transportLandingRoute(u,q[0],q[1]);
  u.unloadRouteRetryAt=S.t+2;
  if(!landing){cancel('Transport cannot reach a free landing beach');return}
  u.unloadBeach=landing.beach;u.p=landing.route;u.rp=1;
 }
 if(!u.p.length)return;
 if(!walk(u,dt))return;
 const cg=u.cg,occupied=new Set(S.us.filter(v=>v&&v.hp>0&&!v.ld&&Number.isFinite(v.x)&&Number.isFinite(v.y)).map(v=>(v.y|0)*W+(v.x|0)));
 const shore=u.unloadBeach,spots=[];
 if(!Array.isArray(shore)||shore.length!==2||!shore.every(Number.isFinite)){u.p=[];u.rp=0;u.unloadRouteRetryAt=0;return}
 // Collect all valid shore tiles once, then assign distinct positions to passengers.
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
  const x=(u.x|0)+dx,y=(u.y|0)+dy;
  if(x<=0||y<=0||x>=W-1||y>=H-1)continue;
  const idx=y*W+x;
  if(S.g[idx]||S.nd[idx]||S.wt[idx]===1||occupied.has(idx))continue;
  if(Math.hypot(x+.5-q[0],y+.5-q[1])>5||Math.hypot(x+.5-u.x,y+.5-u.y)>4||Math.hypot(x-shore[0],y-shore[1])>3)continue;
  if(!D8.some(([ax,ay])=>{const nx=x+ax,ny=y+ay;return nx>=0&&ny>=0&&nx<W&&ny<H&&S.wt[ny*W+nx]===1&&!S.nd[ny*W+nx]}))continue;
  spots.push({x,y,idx,score:Math.hypot(x+.5-q[0],y+.5-q[1])+Math.hypot(x+.5-u.x,y+.5-u.y)*.15});
 }
 spots.sort((a,b)=>a.score-b.score);
 let unloaded=0;
 for(const c of cg){
  const sp=spots[unloaded];
  if(!sp)break;
  c.x=sp.x+.5;c.y=sp.y+.5;c.ld=null;c.o='i';c.tg=null;c.ut=null;c.p=[];c.rp=0;c.pt=null;c.as=0;
  unloaded++;
 }
 u.cg=cg.filter(c=>c.ld===u&&c.hp>0);
 cancel();
 if(u.t===0)note(unloaded?(u.cg.length?'Passengers unloaded: '+unloaded+'; '+u.cg.length+' still aboard':'Passengers unloaded: '+unloaded):'No safe shore to unload; move closer to land');
 return;
}
if(u.o==='rep'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||!tg.sh||tg.hp>=mhp(tg)){u.o='i';u.tg=null;return}if(d2(u.x,u.y,tg)<=1.5){u.p=[];tg.hp=Math.min(mhp(tg),tg.hp+mhp(tg)*dt/40);if(tg.hp>=mhp(tg)){u.o='i';u.tg=null;if(u.t===0)note('Ship repaired')}}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1.2));u.rp=1;if(!p){u.o='i';u.tg=null;return}u.p=p}walk(u,dt)}return}
if(u.o==='v'){tickConversion(u,dt);return}
if(u.o==='r'){if(!u.rel){if(!tg||!tg.rl||tg.c||tg.m){u.o='i';u.tg=null;return}if(Math.hypot(tg.x-u.x,tg.y-u.y)<=1){tg.c=u;u.rel=tg;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,.8));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
let mb=null,bd=1e9;for(const q of S.bs)if(q.t===u.t&&q.done&&q.k==='monastery'){const d=d2(u.x,u.y,q);if(d<bd){bd=d;mb=q}}
if(!mb){u.o='i';return}if(bd<=1.3){u.rel.c=null;u.rel.m=mb;u.rel=null;u.o='i';if(u.t===0)note('Relic garrisoned: +0.5 gold/s');return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(mb,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(u.o==='p'){const e=u.st===4?null:foe(u,6);if(e){u.o='a';u.tg=e;u.p=[];return}const pt=u.pt;if(!pt){u.o='i';return}
if(!u.p.length||u.rp<=0){const g=pt.to?pt.b:pt.a,p=path(u,gp(g[0],g[1],1.2));u.rp=2;if(!p){u.o='i';return}u.p=p}if(walk(u,dt)){if(pt.once){u.o='i';u.pt=null}else{pt.to^=1;u.p=[]}}return}
if(u.o==='a'){if(!tg||tg.hp<=0||tg.t===u.t){const guard=u.guardTarget&&u.guardTarget.hp>0?u.guardTarget:null;u.o=guard?'G':u.pt?'p':'i';u.tg=guard;u.guardTarget=null;u.p=[];return}
if(u.k!=='vil'&&tg.q&&(u.ac=(u.ac||0)-dt)<=0){u.ac=.6;const e=foe(u,4);if(e&&!e.q)u.tg=tg=e}
const dist=d2(u.x,u.y,tg),minR=d.minR||0,range=attackRange(u);
if(u.wind>0&&(u.windTarget!==tg.netId||dist>range||minR&&dist<minR)){u.wind=0;u.windTarget=null}
if(minR&&dist<minR){if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,minR+.5));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(dist<=range){u.p=[];
 if(u.wind>0){
  u.wind=Math.max(0,u.wind-dt);
  if(u.wind===0){u.windTarget=null;hit(u,tg);u.cd=Math.max(0,attackReload(u)-(d.delay||0))}
 }else if(u.cd<=0){
  if(d.delay){u.wind=d.delay;u.windTarget=tg.netId||null}
  else{hit(u,tg);u.cd=attackReload(u)}
 }
}
else if(u.st===2){u.o='i';u.tg=null}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,range-(range>2?.4:.1)));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt)}return}
if(u.o==='g'){
if(u.ret){
 const b=S.bs.find(q=>dropoffKey(q)===u.dropKey&&dropoffCompatible(u,q));
 if(b&&d2(u.x,u.y,b)<=1.1){S.res[u.t][u.ct]+=u.car;if(u.t===0)S.pl.gath+=u.car;u.car=0;u.ret=0;u.p=[];u.dropKey='';u.dropRetry=0;return}
 if(!b||!u.p.length||u.rp<=0){
  if((u.dropRetry||0)>0){u.dropRetry-=dt;return}
  const dest=findDropoffRoute(u);
  if(!dest){u.dropKey='';u.p=[];u.dropRetry=3;return}
  u.dropKey=dropoffKey(dest.b);u.p=dest.route;u.rp=1;u.dropRetry=0;
 }
 walk(u,dt);return
}
if(!tg||tg.amt<=0||S.nd[tg.y*W+tg.x]!==tg||!!tg.fi!==!!u.sh||tg.trap&&tg.t!==u.t||tg.fm&&!farmAvailableTo(u,tg)){const a=u.autoWorker&&u.t===0?findReachableAutoNode(u,u.ct,36):null,n=a?a.n:(!u.autoWorker?findNode(u,u.ct):null);if(n){u.tg=n;u.p=a?a.route:[];u.rp=a?1:0}else if(u.car>0){u.ret=1;u.p=[]}else{u.o='i';u.tg=null;u.p=[]}return}
if(d2(u.x,u.y,tg)<=1.1){u.p=[];u.rp=0;const g=Math.min(tg.amt,baseGatherRate(u,tg)*gm(u,tg)*(tg.an&&S.tech[u.t]?.hunt?1.4:1)*dt);tg.amt-=g;u.car+=g;u.ct=tg.k;if(gt>(u.sn||0)){u.sn=gt+.7+Math.random()*.5;if(tg.k==='w')sfx('chop',u.x,u.y);else if(tg.k==='g'||tg.k==='s')sfx('mine',u.x,u.y);else if(tg.k==='f'||tg.k==='b'||tg.k==='d')sfx('harvest',u.x,u.y)}if(tg.amt<=0){if(tg.trap){tg.amt=900;if(u.t===0)note('Fish trap replenished')}else if(tg.fm){tg.amt=0;if(u.t===0)note('Farm exhausted; awaiting owner 60 wood to reseed')}else{killNode(tg);if(u.t===0)note(NM[tg.k]+' depleted')}}if(u.car>=gatherCapacity(u)){u.ret=1;u.p=[]}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){if(u.t===0&&u.autoWorker)skipAutoNode(u,tg);u.o='i';if(u.t===0)note('No route to resource');return}u.p=p}walk(u,dt)}return}
if(u.o==='b'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||(tg.done&&tg.hp>=tg.mh)){u.o='i';u.tg=null;if(tg&&tg.done&&tg.hp>0){const ak={lumber:'w',mine:'g',mill:'f'}[tg.k],n=ak&&findNode(u,ak,16);if(n){u.o='g';u.tg=n;u.ct=n.k;u.p=[];u.ret=0}}return}
if(d2(u.x,u.y,tg)<=1.1){u.p=[];u.rp=0;if(tg.done)tg.hp=Math.min(tg.mh,tg.hp+tg.mh*dt/(S.tech[u.t].crane?32:40));else{const buildRate=S.tech[u.t].crane?1.2:1;tg.pr+=dt*buildRate;if(gt>(u.sn||0)){u.sn=gt+.8+Math.random()*.4;sfx('hammer',u.x,u.y)}tg.hp=Math.min(tg.mh,tg.mh*tg.pr/B[tg.k].bt+1);
if(tg.pr>=B[tg.k].bt){tg.done=true;tg.hp=tg.mh;sfx('built',tg.x+tg.s/2,tg.y+tg.s/2);if(tg.t===0){S.pl.bl++;note(B[tg.k].n+' complete')}}}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt)}}}
function spawnPos(b){const occupied=new Set();for(const u of S.us)if(u.hp>0&&!u.ld&&Number.isFinite(u.x)&&Number.isFinite(u.y)){const x=Math.floor(u.x),y=Math.floor(u.y);if(Math.abs(u.x-(x+.5))<.35&&Math.abs(u.y-(y+.5))<.35)occupied.add(y*W+x)}for(let i=-1;i<=b.s;i++)for(const[x,y]of[[b.x+i,b.y-1],[b.x+i,b.y+b.s],[b.x-1,b.y+i],[b.x+b.s,b.y+i]]){if(x<0||y<0||x>=W||y>=H)continue;const ix=y*W+x;if(!(b.k==='dock'?(S.wt[ix]===1||S.wt[ix]===2)&&!S.nd[ix]:!S.g[ix]&&S.wt[ix]!==1&&!S.nd[ix]))continue;if(occupied.has(ix))continue;return[x+.5,y+.5]}return null}
function ageRequirements(t,world=S){
 const g=AG[world.age[t]+1];if(!g)return {ready:false,count:0};
 const completed=world.bs.filter(b=>b.t===t&&b.done&&b.hp>0);
 const count=new Set(completed.filter(b=>g.needs.includes(b.k)).map(b=>b.k)).size;
 return {ready:count>=2||!!(g.single&&completed.some(b=>b.k===g.single)),count};
}
function research(b,k){if(!b||b.hp<=0||!b.done||!S||!Number.isInteger(b.t)||!S.tech[b.t]||!B[b.k])return false;const t=b.t;if(b.q&&b.q.length){if(!t)note('Finish or cancel training before researching');return false}if(b.rs){if(!t)note('Already researching here');return false}if(S.bs.some(x=>x!==b&&x.t===t&&x.hp>0&&x.rs&&x.rs.k===k)){if(!t)note(k==='age'?'Age advance already in progress':'Technology already being researched');return false}let d;
if(k==='age'){if(b.k!=='tc'){if(!t)note('Advance Age requires a Town Centre');return false}const g=AG[S.age[t]+1];if(!g){if(!t)note('Already Imperial Age');return false}const gate=ageRequirements(t);if(!gate.ready){if(!t)note('Needs 2 different current-age buildings ('+gate.count+'/2)'+(g.single?' or a completed Castle':''));return false}d=g}
else{d=TE[k];if(!d||!Array.isArray(B[b.k].rs)||!rsOf(b).includes(k)){if(!t)note('Research unavailable at this building');return false}if(S.tech[t][k]||d.age>S.age[t]||(d.pre&&!S.tech[t][d.pre])){if(!t)note('Locked');return false}}
if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}pay(t,d.cost);b.rs={k,t:d.t};return true}
const MILITARY_PRODUCTION_BUILDINGS=new Set(['bar','rng','stable','siege','castle','monastery','dock']);
function trainRate(b,k){return S.tech[b.t]&&S.tech[b.t].cons&&MILITARY_PRODUCTION_BUILDINGS.has(b.k)&&!['vil','cart','fish','trn','cog'].includes(k)?4/3:1}
function upB(b,dt){if(!b||!b.done||b.hp<=0||!Number.isFinite(dt)||dt<=0)return;
if(b.cg?.length)healGarrison(b,dt);
if(b.k==='monastery')S.res[b.t].g+=S.rel.filter(q=>q.m===b).length*.5*dt;const ak=B[b.k].atk;if(ak){b.cd=(b.cd||0)-dt;if(b.cd<=0){const o={k:ak,t:b.t,x:b.x+b.s/2,y:b.y+b.s/2},e=foe(o,attackRange(o),b);if(e&&!e.q){const na=1+(S.tech[b.t].ys?1:0)+Math.min(8,(b.cg||[]).filter(c=>U[c.k].dmg>3).length);for(let q=0;q<na;q++)launchProjectile(o,e);sfx('bow',o.x,o.y);b.cd=U[ak].cd}}}
if(b.rs){b.rs.t-=dt;if(b.rs.t<=0){const k=b.rs.k;b.rs=null;if(k==='age'){S.age[b.t]++;if(b.t===0){note(AG[S.age[0]].n+' reached!');rumble(500,.7,.7);{const tc0=S.bs.find(x=>x.t===0&&x.k==='tc');if(tc0)emit('spark',tc0.x+1.5,tc0.y+1.5,40,{s:4,vz:5,l:1.2,c:'#f2c14e',r:2.4})}if(b.t===0)sfx('age')}}else{const T0=S.tech[b.t],e=TE[k];T0[k]=1;if(['coll','plow','crop'].includes(k)){const add=k==='coll'?75:k==='plow'?125:175;for(const n of S.nodes)if(n.k==='f'&&n.fm&&n.t===b.t&&S.nd[n.y*W+n.x]===n)n.amt+=add}if(e.hpb){T0.hpb=T0.hpb||{};for(const q in e.hpb){T0.hpb[q]=(T0.hpb[q]||0)+e.hpb[q];for(const x of S.us)if(x.t===b.t&&x.k===q&&x.hp>0)x.hp+=e.hpb[q]}}if(e.atkb){T0.atkb=T0.atkb||{};for(const q in e.atkb)T0.atkb[q]=(T0.atkb[q]||0)+e.atkb[q]}if(k==='mas')for(const x of S.bs)if(x.t===b.t){x.mh=Math.round((x.mh||B[x.k].hp)*1.4);x.hp=Math.min(x.mh,Math.round(x.hp*1.4))}if(k==='fw')for(const x of S.bs)if(x.t===b.t&&(x.k==='wall'||x.k==='gate')){x.mh=Math.round((x.mh||B[x.k].hp)*1.8);x.hp=Math.min(x.mh,Math.round(x.hp*1.8))}if(e.fx)e.fx(b.t);if(b.t===0){note(e.n+' researched');sfx('tech')}}}}
if(!b.q.length)return;const q=b.q[0];if(!q||!U[q.k]||!Number.isFinite(q.t)){b.q.shift();return}if(!Number.isFinite(dt)||dt<=0)return;q.t-=dt*trainRate(b,q.k);if(q.t<=0){if(livePopulation(b.t)>=capOf(b.t)){q.t=0;return}const p=spawnPos(b);if(!p){q.t=0;return}b.q.shift();if(b.t===0)sfx('train',b.x+b.s/2,b.y+b.s/2);const nu=addU(b.t,q.k,p[0],p[1]);if(q.k==='cart'||q.k==='cog')nu.tradeFromKey=[b.t,b.k,b.x,b.y].join(':');const ry=b.rally;if(ry){if(q.k==='vil')nu.autoWorker=0;nu.o='i';nu.p=[];nu.tg=null;nu.ct=null;nu.ret=0;if(ry.t&&ry.t.amt>0&&q.k==='vil'){nu.o='g';nu.tg=ry.t;nu.ct=ry.t.k}else{const rp=path(nu,gp(ry.x,ry.y,1.5));if(rp){nu.o='m';nu.p=rp}}}if(b.t===0){S.pl.tr++;note(unitName(q.k,b.t)+' trained')}}}
function queuedPopulation(t){return S.bs.reduce((n,b)=>n+(b&&b.t===t&&b.hp>0&&Array.isArray(b.q)?b.q.length:0),0)}
function train(b,k){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!B[b.k]||!Array.isArray(B[b.k].tr)||!trOf(b).includes(k)||!U[k]||!Array.isArray(b.q)||b.rs)return false;const t=b.t,d=U[k];if(d.age>S.age[t]){if(!t)note('Requires '+AG[d.age].n);return false}if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}
if(popOf(t)>=capOf(t)){if(!t)note('Population cap reached - build houses');return false}if(b.q.length>=5)return false;pay(t,d.cost);b.q.push({k,t:k==='skirm'&&S.tech[t]?.elsk?22:d.t});return true}
function cancelQ(b){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!Array.isArray(b.q)||!b.q.length)return false;const q=b.q[b.q.length-1];if(!q||!U[q.k]){b.q.pop();return false}b.q.pop();pay(b.t,U[q.k].cost,1);note('Cancelled - full refund');return true}
function okPlace(t,k,x,y){if(!S||!B[k]||!Number.isInteger(t)||!S.tech[t]||!Number.isInteger(x)||!Number.isInteger(y))return false;if(vm===6&&k==='tc')return false;const s=B[k].s;if(x<1||y<1||x+s>W-1||y+s>H-1)return false;
for(let j=0;j<s;j++)for(let i=0;i<s;i++){const n=(y+j)*W+x+i;if(S.g[n]||S.wt[n]||(t===0&&!S.ex[n]))return false}if(B[k].wat){let w=0;for(let j=-1;j<=s;j++)for(let i=-1;i<=s;i++){const X2=x+i,Y2=y+j;if((i<0||j<0||i>=s||j>=s)&&X2>=0&&Y2>=0&&X2<W&&Y2<H&&S.wt[Y2*W+X2]&&!S.nd[Y2*W+X2])w++}if(!w)return false}return true}
/* Enemy strategy and composition-aware decisions are implemented in js/ai.js. */
/* ===== SIMULATION STEP ===== */
const mv=(u,dx,dy)=>{const x=u.x+dx,y=u.y+dy;if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return;const i=(y|0)*W+(x|0);if(u.sh?S.wt[i]&&!S.nd[i]:(!S.g[i]||S.gt[i]===u.t+1)&&S.wt[i]!==1){u.x=x;u.y=y}};
/* Local spatial grid for unit separation. The old all-pairs pass compared every unit with every other unit (O(n²)); units only need checking against nearby cells. The separation radius and displacement remain unchanged. */
const SEP_GRID=new Map(),SEP_BUCKET_POOL=[];
function sep(){const us=S.us;if(us.length<=64){for(let i=0;i<us.length;i++){const a=us[i];if(a.hp<=0)continue;for(let j=i+1;j<us.length;j++){const b=us[j];if(a.ld||b.ld||a.hp<=0||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const ds=dx*dx+dy*dy;if(ds<.25){const dist=Math.sqrt(ds)||.01,p=(.5-dist)*.25;dx/=dist;dy/=dist;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}return}const grid=SEP_GRID;for(const bucket of grid.values()){bucket.length=0;SEP_BUCKET_POOL.push(bucket)}grid.clear();const gw=W*2+4,key=(x,y)=>y*gw+x;/* Return used buckets to a pool, then reuse their arrays to avoid per-tick garbage. */for(let i=0;i<us.length;i++){const a=us[i];if(a.ld||a.hp<=0)continue;if(!Number.isFinite(a.x)||!Number.isFinite(a.y))continue;const gx=Math.floor(a.x*2),gy=Math.floor(a.y*2);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;for(const j of bucket){const b=us[j];if(b.ld||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const ds=dx*dx+dy*dy;if(ds<.25){const dist=Math.sqrt(ds)||.01,p=(.5-dist)*.25;dx/=dist;dy/=dist;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}const k=key(gx,gy),bucket=grid.get(k);if(bucket)bucket.push(i);else{const next=SEP_BUCKET_POOL.pop()||[];next.push(i);grid.set(k,next)}}}

function WL(dt){for(const n of S.nodes)if(n.an&&(n.w=(n.w||0)-dt)<=0){n.w=3+S.r()*4;const[dx,dy]=D8[(S.r()*4)|0],x=n.x+dx,y=n.y+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]){S.g[n.y*W+n.x]=0;S.nd[n.y*W+n.x]=null;n.x=x;n.y=y;S.g[y*W+x]=1;S.nd[y*W+x]=n}}}
function stopSel(){for(const u of S.sel)if(!u.q){u.o='i';u.p=[];u.tg=null;u.pt=null;u.autoWorker=0;u.guardTarget=null;if(u.k==='cart'||u.k==='cog'){u.tradePaused=true;u.manualTradeMove=false;}}note('Stopped')}
function regroup(){const us=S.sel.filter(u=>!u.q);if(!us.length)return;orderSel(null,us.reduce((a,u)=>a+u.x,0)/us.length,us.reduce((a,u)=>a+u.y,0)/us.length);note('Regrouping')}
function orderGuardFollow(wx,wy,kind){
 const target=pick(wx,wy),ship=!!(target&&U[target.k]&&U[target.k].sh);
 if(!target||(!U[target.k]&&!target.q)||target.hp<=0||(target.q&&!target.done)||(target.t!==0&&diplomacyRelation(0,target.t)!=='ally')){
  note('Choose a living friendly unit or completed building');return false;
 }
 const units=S.sel.filter(u=>!u.q&&u.t===0&&u.hp>0&&!u.ld&&u!==target&&u.k!=='vil'&&u.k!=='cart'&&u.k!=='cog'&&!!(U[u.k]&&U[u.k].sh)===ship);
 if(!units.length){note(ship?'Select ships to guard/follow a friendly ship':'Select military units to guard/follow a friendly unit or building');return false}
 for(const u of units){u.o=kind;u.tg=target;u.guardTarget=null;u.p=[];u.pt=null;u.as=0;u.autoWorker=0;u.rp=0}
 note((kind==='F'?'Following ':'Guarding ')+(U[target.k]?.n||B[target.k]?.n||'target')+' with '+units.length+' unit'+(units.length===1?'':'s'));
 return true;
}
function patrol(wx,wy,once){let n=0;for(const u of S.sel)if(!u.q&&u.hp>0&&!u.ld&&u.k!=='vil'&&u.k!=='fish'&&u.k!=='cart'&&u.k!=='cog'&&u.k!=='trn'&&u.k!=='mon'){u.pt={a:[u.x,u.y],b:[wx,wy],to:1,once};u.o='p';u.tg=null;u.p=[];u.rp=0;n++}if(n)note('Patrolling with '+n+' unit'+(n===1?'':'s'));else note('Select living, ungarrisoned military units or warships to patrol');return n>0}
function subg(d){const fresh=!(S.all&&S.sel.length&&S.sel.every(u=>S.all.includes(u))),base=fresh?S.sel.filter(u=>!u.q):S.all.filter(u=>u.hp>0),ks=[...new Set(base.map(u=>u.k))];if(ks.length<2)return false;if(fresh)S.si=0;S.all=base;S.si=((S.si||0)+d+ks.length+1)%(ks.length+1);S.sel=S.si?base.filter(u=>u.k===ks[S.si-1]):base;note('Group: '+(S.si?U[ks[S.si-1]].n+' x'+S.sel.length:'all '+base.length));return true}
function setStance(v){for(const u of S.sel)if(!u.q&&u.k!=='vil'){u.st=v;if(v===4&&(u.o==='a'||u.o==='v')){u.o='i';u.tg=null;u.p=[]}}note(['Aggressive','Defensive','Stand ground','Passive','No Attack'][v]+' stance');menu=null}
function unload(b){
 if(!S||!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S.tech[b.t]||!B[b.k]||!Array.isArray(b.cg)||!GAR[b.k]){note('Select a living, completed garrison with units inside');return false}
 const cg=b.cg.filter(c=>c&&c.hp>0&&c.ld===b&&c.t===b.t&&U[c.k]&&!U[c.k].sh);
 if(!cg.length){b.cg=[];note('No living passengers in this garrison');return false}
 const size=Number.isInteger(b.s)&&b.s>0?b.s:1,spots=[];
 /* Only units near the garrison can occupy one of its possible unload tiles. */
 const occupied=new Set(),left=b.x-6,right=b.x+size+6,top=b.y-6,bottom=b.y+size+6;
 for(const u of S.us)if(u&&u.hp>0&&!u.ld&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=left&&u.x<right&&u.y>=top&&u.y<bottom)occupied.add((u.y|0)*W+(u.x|0));
 for(let r=1;r<=6;r++){
  for(let dy=-r;dy<size+r;dy++)for(let dx=-r;dx<size+r;dx++){
   if(dx>=0&&dy>=0&&dx<size&&dy<size)continue;
   if(dx!==-r&&dy!==-r&&dx!==size+r-1&&dy!==size+r-1)continue;
   const x=b.x+dx,y=b.y+dy;
   if(x<=0||y<=0||x>=W-1||y>=H-1)continue;
   const idx=y*W+x;
   if(S.g[idx]||S.wt[idx]===1||S.nd[idx]||occupied.has(idx))continue;
   const gapX=Math.max(0,-dx,dx-size+1),gapY=Math.max(0,-dy,dy-size+1);
   spots.push({x,y,idx,score:gapX*gapX+gapY*gapY});
  }
  if(spots.length>=cg.length)break;
 }
 spots.sort((a,b)=>a.score-b.score);
 let released=0;
 for(const c of cg){
  const sp=spots[released];if(!sp)break;
  c.x=sp.x+.5;c.y=sp.y+.5;c.ld=null;c.o='i';c.tg=null;c.ut=null;c.pt=null;c.as=0;c.p=[];c.rp=0;released++;
 }
 b.cg=cg.filter(c=>c.ld===b);
 note(released?(b.cg.length?'Garrison partially unloaded: '+released+' units':'Garrison unloaded: '+released+' units'):'No clear space to unload this garrison');
 return released>0;
}
function townBell(t){
 const workers=S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld);
 const shelters=S.bs.filter(b=>b.t===t&&b.done&&b.hp>0&&GAR[b.k]);
 const occupancy=new Map(),living=new Set(S.us);
 for(const b of shelters){
  const residents=new Set();
  for(const passenger of (Array.isArray(b.cg)?b.cg:[]))
   if(passenger&&living.has(passenger)&&passenger.hp>0&&passenger.t===t&&passenger.ld===b)residents.add(passenger);
  occupancy.set(b,residents.size);
 }
 for(const v of S.us)if(v.hp>0&&v.t===t&&v.o==='B'&&occupancy.has(v.tg))occupancy.set(v.tg,occupancy.get(v.tg)+1);
 let sent=0;
 for(const u of workers){
  let shelter=null,best=Infinity;
  for(const b of shelters){
   const ownReservation=u.o==='B'&&u.tg===b?1:0;
   if((occupancy.get(b)||0)-ownReservation>=GAR[b.k])continue;
   const sz=b.s||0,dx=Math.max(b.x-u.x,0,u.x-(b.x+sz)),dy=Math.max(b.y-u.y,0,u.y-(b.y+sz)),distanceSq=dx*dx+dy*dy;
   if(distanceSq<best){best=distanceSq;shelter=b}
  }
  if(!shelter)continue;
  if(u.o==='B'&&occupancy.has(u.tg))occupancy.set(u.tg,Math.max(0,occupancy.get(u.tg)-1));
  u.p=[];u.pt=null;u.as=0;u.o='B';u.tg=shelter;u.ut=null;
  occupancy.set(shelter,(occupancy.get(shelter)||0)+1);sent++;
 }
 if(t===0)note(sent?'Town Bell: '+sent+' villagers sent to shelter':'No available shelter space for villagers');
 return sent;
}
function gm(u,tg){const t=S.tech[u.t];let m=t.gath?1.25:1;const k=tg.k;if(k==='w'){m*=1+.2*!!t.axe+.2*!!t.saw;if(t.wd)m*=1.15}else if(k==='g')m*=1+.15*!!t.gmine+.15*!!t.mn;else if(k==='s')m*=1+.15*!!t.smine+.15*!!t.mn;else if(k==='f'&&tg.fm)m*=1+.15*!!t.fa;return m}
const mhp=u=>U[u.k].hp+(S.tech[u.t].hpb&&S.tech[u.t].hpb[u.k]||0);
/* AoE-style farm capacity upgrades add food, rather than incorrectly increasing the harvest rate. */
function farmFood(t){const q=S.tech[t]||{};return 175+(q.coll?75:0)+(q.plow?125:0)+(q.crop?175:0)}
/* Victory rules: the chosen mode (vm) is authoritative. Town Centre loss ends a skirmish only in vm 0; campaign keeps its own rules (player TC loss = defeat, enemy TC only with sc.tcw).
   Every match end goes through endGame(): defeat takes precedence over a victory recorded in the same step, and S.why names the cause for the end screen. */
function tcEnds(t){return cmp?(t.t===0||!!CAMP[cmp.i].tcw):(vm===0||vm===6)}
function endGame(res,why){if(S.over==='lose')return;if(S.over&&res==='win')return;S.over=res;S.why=why;mode='end';if(cmp&&res==='win')campMark(cmp.i);sting(res==='win');rumble(700,1,.6)}
function elim(){if(cmp)return;if(vm===0){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');return}if(vm===6){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell in Sudden Death');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death');return}const alive=t=>S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0);if(!alive(0)){endGame('lose','Your kingdom has been defeated');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&alive(i+1)).some(Boolean))endGame('win','All hostile kingdoms have been defeated')}
function kingdomAlive(t){return S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)}
function kingdomScore(t){
 const res=S.res[t]||{};let resources=0;for(const n of Object.values(res))resources+=Math.max(0,Number(n)||0);resources/=10;
 let units=0;for(const u of S.us)if(u.t===t&&u.hp>0){const d=U[u.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;units+=Math.max(0,cost/8)*Math.max(0,Math.min(1,u.hp/Math.max(1,d.hp||u.hp||1)))}
 let buildings=0;for(const b of S.bs)if(b.t===t&&b.hp>0){const d=B[b.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;buildings+=Math.max(0,cost/8)*Math.max(0,Math.min(1,b.hp/Math.max(1,b.mh||d.hp||b.hp||1)))}
 let techCount=0;for(const k in(S.tech[t]||{}))if(S.tech[t][k]===1&&k!=='hpb'&&k!=='atkb')techCount++;
 const techs=techCount*30,age=(S.age[t]||0)*150;let relicCount=0;for(const r of S.rel)if(r.m&&r.m.t===t)relicCount++;const relics=relicCount*250;
 return Math.round(resources+units+buildings+techs+age+relics);
}
function kingHillControl(dt){
 const presence=Array(S.teamN).fill(0);
 for(const u of S.us)if(u.hp>0&&!u.ld&&u.k!=='vil'&&u.k!=='cart'&&u.k!=='cog'&&!(U[u.k]&&U[u.k].sh)&&Math.hypot(u.x-W/2,u.y-H/2)<=5.2&&(u.t===0||diplomacyRelation(0,u.t)!=='neutral')){
  const faction=u.t===0||diplomacyRelation(0,u.t)==='ally'?0:u.t;presence[faction]++;
 }
 const holders=presence.flatMap((n,t)=>n>0?[t]:[]),progress=S.kh||(S.kh=Array(S.teamN).fill(0));
 if(holders.length!==1){progress.fill(0);return}
 const holder=holders[0];
 for(let t=0;t<progress.length;t++)progress[t]=t===holder?Math.min(300,(progress[t]||0)+dt):0;
 if(progress[holder]>=300)endGame(holder===0?'win':'lose',holder===0?'Your kingdom held the central hill for 5 minutes':CIV[S.civ[holder]].n+' held the central hill for 5 minutes');
}
function vict(dt){if(vm===5){kingHillControl(dt);return}if(vm===3){if(!S.us.some(u=>u.t===0&&u.k==='king')){endGame('lose','Your King has fallen');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&S.us.some(u=>u.t===i+1&&u.k==='king')).some(Boolean))endGame('win','All hostile Kings have fallen');return}if(vm===4){const limit=scoreLimit;if(S.t<limit)return;if(!kingdomAlive(0)){endGame('lose','Your kingdom was eliminated before the score limit');return}const ranked=Array.from({length:S.teamN},(_,t)=>({t,score:kingdomScore(t)})).filter(q=>q.t===0||(isHostile(0,q.t)&&kingdomAlive(q.t))).sort((a,b)=>b.score-a.score);if(!ranked.length){endGame('lose','No kingdom survived the time limit');return}const leaders=ranked.filter(q=>q.score===ranked[0].score);if(leaders.length>1){endGame('draw','Draw at the '+Math.round(scoreLimit/60)+'-minute score limit: '+leaders.map(q=>CIV[S.civ[q.t]].n).join(' and ')+' tied on '+leaders[0].score+' points');return}const winner=ranked[0];endGame(winner.t===0?'win':'lose',CIV[S.civ[winner.t]].n+' wins on score at the '+Math.round(scoreLimit/60)+'-minute time limit ('+winner.score+' points)');return}const v=S.vc||(S.vc=Array(S.teamN).fill(0));for(let t=0;t<S.teamN;t++){if(t>0&&!isHostile(0,t)){v[t]=0;continue}let ok=false;if(vm===1)ok=S.bs.some(b=>b.t===t&&b.k==='wonder'&&b.done);else if(vm===2)ok=S.rel.length>0&&S.rel.every(r=>r.m&&r.m.t===t&&r.m.done);v[t]=ok?v[t]+dt:0;if(v[t]>=(vm===1?300:240)){endGame(t===0?'win':'lose',(t===0?'You':'A hostile kingdom')+(vm===1?' held a Wonder for 5 minutes':' held every relic for 4 minutes'));return}}}

function step(dt){foeGridDirty=true;S.t+=dt;for(const n of S.nodes)if(n&&n.fm&&n.amt<=0&&Number.isInteger(n.t)&&S.res[n.t]&&S.res[n.t].w>=60){S.res[n.t].w-=60;n.amt=farmFood(n.t);if(n.t===0)note('Farm reseeded (-60 wood)')}for(const u of S.us)upU(u,dt);sep();WL(dt);if(cmp)cmpTick(dt);if(vm)vict(dt);if(!cmp&&S.vt%30===0)elim();if(S.vt%150===0){for(const q of S.px)for(const k in q)q[k]+=q[k]<100?1:q[k]>100?-1:0;if(menu&&menu.items)for(const r of menu.items)if(r.up)r.up()}for(const q of S.rel){if(q.c){if(q.c.hp<=0)q.c=null;else{q.x=q.c.x;q.y=q.c.y}}if(q.m&&q.m.hp<=0){q.x=q.m.x+1;q.y=q.m.y+1;q.m=null}}
for(const s of S.us)if(s.cg&&s.cg.length){if(s.hp<=0)s.cg.forEach(c=>c.hp=0);else s.cg.forEach(c=>{c.x=s.x;c.y=s.y})}for(const b of S.bs)upB(b,dt);pjs(dt);if(!(cmp&&CAMP[cmp.i].noai))ai(dt);
for(const f of fx)f.l-=dt;compactPositive(fx,'l');compactPositive(S.us,'hp');compactPositive(S.bs,'hp');compactPositive(S.sel,'hp');
if(++S.vt%30===0)S.scoreCache=Array.from({length:S.teamN},(_,t)=>kingdomScore(t));if(S.vt%6===0){fog();if(S.vt%(W*H>20000?24:W*H>9000?12:6)===0)mmUp()}}


