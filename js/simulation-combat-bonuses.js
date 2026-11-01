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
