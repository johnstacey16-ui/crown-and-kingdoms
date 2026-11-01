/* Crown & Kingdoms — military armour-class and research damage bonuses.
 * Loaded after configuration/state and before the live simulation. The
 * original declarations remain global to preserve classic script semantics.
 */

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
// Pinned Camel and Heavy Camel combat bonuses share the existing cavalry classes.
const CAMEL_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon','ele','eled']);
const CAMEL_CLASS=new Set(['camel','mamel']);
function camelLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,heavy=!!S.tech[a.t]?.hcamel;
 if(CAMEL_CLASS.has(key)||CAMEL_CLASS.has(alias))return heavy?9:5;
 if(CAMEL_CAVALRY.has(key)||CAMEL_CAVALRY.has(alias))return heavy?18:9;
 return U.camel.bn?.[key]||U.camel.bn?.[alias]||0;
}
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
// Source-backed Blacksmith melee bonuses: Forging +1, Iron Casting +1,
// Blast Furnace +2. Saved games from the current rules keep these flags.
function meleeResearchAttackBonus(tech){
 return (tech.forging?1:0)+(tech.ironCasting?1:0)+(tech.blastFurnace?2:0);
}

// Conversion helpers shared by solo input, AI and authenticated orders.
// Unchanged source relocated from simulation.js; retain classic global names.
function resetConversion(u){u.cv=0;u.cvNext=0;u.cvTargetId=null;u.cvTeam=null}
function conversionRange(u,target){return target?.s||['ram','treb'].includes(target?.k)?1:9+(S.tech[u.t]?.blockPrinting?3:0)}
function unitSight(u){return u.k==='vil'?4:u.k==='mon'?11+(S.tech[u.t]?.blockPrinting?3:0):8+arrowSightBonus(u)}
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

/* Classic combat projectiles, ranged upgrades and deterministic hit resolution.
 * Function bodies are relocated unchanged from simulation.js. */
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
  const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy),travel=(U[p.a.k].ps||14)*dt;
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

/* Combat target index and defensive/siege targeting. Original classic-script
 * bodies extracted from simulation.js; step() still invalidates this index. */
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
// Defensive fire and combat-target selection shared by buildings, AI and simulation.
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
