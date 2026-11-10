const DIPLOMACY_STATES=['enemy','neutral','ally'];
function createDiplomacy(n,source=null){
 const d=Array.from({length:n},(_,a)=>Array.from({length:n},(_,b)=>a===b?'self':'enemy'));
 if(Array.isArray(source))for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
  const ab=source[a]&&source[a][b],ba=source[b]&&source[b][a];
  const rel=DIPLOMACY_STATES.includes(ab)?ab:DIPLOMACY_STATES.includes(ba)?ba:'enemy';
  d[a][b]=d[b][a]=rel;
 }
 return d;
}
function diplomacyRelation(a,b){if(a===b)return 'self';return S&&S.dip&&S.dip[a]&&S.dip[a][b]||'enemy'}
function isHostile(a,b){return a!==b&&diplomacyRelation(a,b)==='enemy'}
function relationLabel(r){return r==='ally'?'Ally':r==='neutral'?'Neutral':r==='self'?'Self':'Enemy'}
function setDiplomacy(a,b,rel){
 if(!S||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=S.teamN||b>=S.teamN||a===b||!DIPLOMACY_STATES.includes(rel))return false;
 S.dip[a][b]=S.dip[b][a]=rel;
 if(rel!=='enemy')for(const u of S.us)if((u.o==='a'||u.o==='v')&&u.tg&&Number.isInteger(u.tg.t)&&((u.t===a&&u.tg.t===b)||(u.t===b&&u.tg.t===a))){const guard=u.guardTarget&&u.guardTarget.hp>0?u.guardTarget:null;u.o=guard?'G':'i';u.tg=guard;u.guardTarget=null;u.p=[]}
 if(a===0||b===0)note('Diplomacy: Kingdom '+((a===0?b:a)+1)+' is now '+relationLabel(rel)+(rel==='ally'?' — shared vision enabled':rel==='neutral'?' — shared vision ended':' — shared vision ended'));
 return true;
}
function rotateDiplomacy(a,b,dir){
 const i=DIPLOMACY_STATES.indexOf(diplomacyRelation(a,b)),step=dir<0?2:1;
 return setDiplomacy(a,b,DIPLOMACY_STATES[(Math.max(0,i)+step)%DIPLOMACY_STATES.length]);
}
function diplomacyMenuItems(){
 if(!S||cmp)return [];
 const items=[];
 for(let t=1;t<S.teamN;t++)if(S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0))
  items.push({n:'Diplomacy: Kingdom '+(t+1),v:()=>relationLabel(diplomacyRelation(0,t)),l:()=>rotateDiplomacy(0,t,-1),r:()=>rotateDiplomacy(0,t,1),a:()=>rotateDiplomacy(0,t,1)});
 return items;
}
const TRIBUTE_RESOURCES=[{k:'f',n:'Food'},{k:'w',n:'Wood'},{k:'g',n:'Gold'},{k:'s',n:'Stone'}];
const TRIBUTE_AMOUNT_STEP=50,TRIBUTE_AMOUNT_MAX=5000;
let tributeResource=0,tributeAmount=100;
function sendTribute(from,to,resourceIndex,amount=100){
 if(!S||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=S.teamN||to>=S.teamN||from===to)return false;
 const resource=TRIBUTE_RESOURCES[resourceIndex];
 if(!resource||!Number.isInteger(amount)||amount<=0)return false;
 if(diplomacyRelation(from,to)!=='ally'){if(from===0)note('Tribute requires an alliance');return false}
 if(!S.res[from]||!S.res[to]||S.res[from][resource.k]<amount){if(from===0)note('Not enough '+resource.n+' for tribute');return false}
 S.res[from][resource.k]-=amount;S.res[to][resource.k]+=amount;
 if(from===0)note('Sent '+amount+' '+resource.n+' to Kingdom '+(to+1));
 return true;
}
function tributeMenuItems(){
 if(!S||cmp)return [];
 const allies=[];
 for(let t=1;t<S.teamN;t++)if(diplomacyRelation(0,t)==='ally'&&(S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)))allies.push(t);
 if(!allies.length)return [];
 const items=[
  {n:'Tribute resource',v:()=>TRIBUTE_RESOURCES[tributeResource].n,l:()=>{tributeResource=(tributeResource+TRIBUTE_RESOURCES.length-1)%TRIBUTE_RESOURCES.length},r:()=>{tributeResource=(tributeResource+1)%TRIBUTE_RESOURCES.length},a:()=>{tributeResource=(tributeResource+1)%TRIBUTE_RESOURCES.length}},
  {n:'Tribute amount',v:()=>tributeAmount,l:()=>{tributeAmount=Math.max(TRIBUTE_AMOUNT_STEP,tributeAmount-TRIBUTE_AMOUNT_STEP)},r:()=>{tributeAmount=Math.min(TRIBUTE_AMOUNT_MAX,tributeAmount+TRIBUTE_AMOUNT_STEP)},a:()=>{tributeAmount=Math.min(TRIBUTE_AMOUNT_MAX,tributeAmount+TRIBUTE_AMOUNT_STEP)}}
 ];
 for(const t of allies)items.push({n:'Send tribute: Kingdom '+(t+1),v:()=>TRIBUTE_RESOURCES[tributeResource].n+' / '+tributeAmount,a:()=>sendTribute(0,t,tributeResource,tributeAmount)});
 return items;
}

function createVillagerPriority(source=null){
 const p={enabled:true,autoFarms:false,f:2,w:2,g:1,s:0};
 if(source&&typeof source==='object'){
  if(typeof source.enabled==='boolean')p.enabled=source.enabled;
  if(typeof source.autoFarms==='boolean')p.autoFarms=source.autoFarms;
  for(const k of['f','w','g','s']){if(source[k]===null||source[k]===undefined||source[k]==='')continue;const n=Number(source[k]);if(Number.isFinite(n))p[k]=Math.max(0,Math.min(40,Math.round(n)))}
 }
 return p;
}
const WORKER_TARGETS=[{k:'f',n:'Food'},{k:'w',n:'Wood'},{k:'g',n:'Gold'},{k:'s',n:'Stone'}];
// Seven Xbox console preset ratios as transcribed from Age of Empires Series Wiki;
// hardware labels/sector order remain subject to in-console verification.
const VILLAGER_PRIORITY_PRESETS=Object.freeze([
 Object.freeze({name:'Food and Wood',weights:Object.freeze([3,1,0,0])}),
 Object.freeze({name:'Basic',weights:Object.freeze([4,3,2,1])}),
 Object.freeze({name:'Militia Rush',weights:Object.freeze([6,3,1,0])}),
 Object.freeze({name:'Balanced',weights:Object.freeze([4,4,1,1])}),
 Object.freeze({name:'Economic',weights:Object.freeze([13,4,2,1])}),
 Object.freeze({name:'Defensive',weights:Object.freeze([3,6,3,8])}),
 Object.freeze({name:'Naval',weights:Object.freeze([2,4,3,1])}),
]);
/* Explicit opt-in to automated farm plots; safe default for all old saves. */
function toggleAutomaticFarms(){
 if(!S)return false;
 const p=S.vp||(S.vp=createVillagerPriority());
 p.autoFarms=!p.autoFarms;note('Automatic farms '+(p.autoFarms?'enabled':'disabled'));
 return p.autoFarms;
}
function applyVillagerPriorityPreset(index){
 if(!S||!Number.isInteger(index)||index<0||index>=VILLAGER_PRIORITY_PRESETS.length)return false;
 const preset=VILLAGER_PRIORITY_PRESETS[index],p=S.vp||(S.vp=createVillagerPriority());
 for(let i=0;i<WORKER_TARGETS.length;i++)p[WORKER_TARGETS[i].k]=preset.weights[i];
 p.enabled=true;rebalanceVillagerPriorities(0);
 note('Villager priorities: '+preset.name);return true;
}

function villagerAssignedCount(t,k){return S?S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld&&!u.retreating&&u.o==='g'&&u.ct===k&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H).length:0}
function autoNodeKey(n){return n.k+':'+n.x+':'+n.y}

/* Xbox priorities are resource ratios, not absolute worker counts. Largest
 * remainders fill the workforce; ties use fixed resource order, never RNG. */
function villagerRatioTargets(priority,total){
 const weights=WORKER_TARGETS.map(r=>Math.max(0,Math.min(40,Number(priority?.[r.k])||0)));
 const result=Object.fromEntries(WORKER_TARGETS.map(r=>[r.k,0]));
 const sum=weights.reduce((a,b)=>a+b,0),n=Math.max(0,Math.floor(Number.isFinite(total)?total:0));
 if(!sum||!n)return result;
 const raw=weights.map(w=>w*n/sum),parts=raw.map(v=>Math.floor(v));
 const left=n-parts.reduce((a,b)=>a+b,0);
 const order=parts.map((_,i)=>i).sort((a,b)=>(raw[b]-parts[b])-(raw[a]-parts[a])||a-b);
 for(let i=0;i<left;i++)parts[order[i]]++;
 WORKER_TARGETS.forEach((r,i)=>{result[r.k]=parts[i]});
 return result;
}
function villagerPriorityTargets(team=0,priority=S?.vp){
 const count=Array.isArray(S?.us)?S.us.filter(u=>u&&u.t===team&&u.k==='vil'&&u.hp>0&&!u.ld&&!u.retreating).length:1;
 return villagerRatioTargets(priority,count);
}

// Temporarily avoid unreachable nodes, but retry after terrain or buildings change.
function skipAutoNode(u,n){
 if(!u||!n)return;
 const key=autoNodeKey(n),until=(Number.isFinite(S?.t)?S.t:0)+30;
 if(!Array.isArray(u.autoSkipNodes))u.autoSkipNodes=[];
 u.autoSkipNodes=u.autoSkipNodes.filter(e=>e&&typeof e==='object'&&e.key!==key&&Number.isFinite(e.until)&&e.until>(Number.isFinite(S?.t)?S.t:0));
 u.autoSkipNodes.push({key,until});
 if(u.autoSkipNodes.length>64)u.autoSkipNodes=u.autoSkipNodes.slice(-64);
}
function findReachableAutoNode(u,k,r=18){
 if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=W||u.y>=H||!WORKER_TARGETS.some(t=>t.k===k))return null;
 const now=Number.isFinite(S.t)?S.t:0;
 const all=[],live=new Set();
 for(const n of S.nodes){
  if(!n||n.amt<=0||n.an||n.fi||!Number.isInteger(n.x)||!Number.isInteger(n.y)||n.x<0||n.y<0||n.x>=W||n.y>=H||S.wt[n.y*W+n.x]===1)continue;
  if(!WORKER_TARGETS.some(target=>target.k===n.k))continue;
  live.add(autoNodeKey(n));
  if(n.k===k&&knownResource(u,n)&&resourceHasWorksite(u,n))all.push(n);
 }
 u.autoSkipNodes=(Array.isArray(u.autoSkipNodes)?u.autoSkipNodes:[]).filter(e=>e&&typeof e==='object'&&typeof e.key==='string'&&Number.isFinite(e.until)&&e.until>now&&live.has(e.key)).slice(-64);
 const skipped=new Set(u.autoSkipNodes.map(e=>e.key));
 const candidates=all.filter(n=>Math.hypot(n.x-u.x,n.y-u.y)<r&&!skipped.has(autoNodeKey(n))).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
 let failed=0;
 for(const n of candidates){
  const route=path(u,goalNear(n,1));
  if(route&&route.length){u.autoSkipNodes=u.autoSkipNodes.filter(e=>e.key!==autoNodeKey(n));return {n,route}}
  skipAutoNode(u,n);
  if(++failed>=12)break;
 }
 return null;
}
/* Optional, solo-only Xbox-style assisted farm creation. Never executes in
 * authenticated peer simulation. This reuses normal placement/path checks and
 * charges only after addN succeeds, so a failed attempt is free. */
function automaticFarmAllowed(){
 return !!(S?.vp?.enabled&&S.vp.autoFarms)&&
  !(typeof window!=='undefined'&&window.CK_NET?.isRunning?.());
}
function tryAutomaticFarm(u){
 if(!automaticFarmAllowed()||!u||u.t!==0||u.k!=='vil'||u.hp<=0||u.ld||u.retreating)return false;
 const centres=(S.bs||[]).filter(b=>b&&b.t===0&&b.done&&b.hp>0&&(b.k==='tc'||b.k==='mill')&&
  Math.hypot(b.x+b.s/2-u.x,b.y+b.s/2-u.y)<=24)
  .sort((a,b)=>Math.hypot(a.x+a.s/2-u.x,a.y+a.s/2-u.y)-
   Math.hypot(b.x+b.s/2-u.x,b.y+b.s/2-u.y)||a.x-b.x||a.y-b.y);
 if(!centres.length)return false;
 if(!can(0,B.farm.cost)){
  let wood=findReachableAutoNode(u,'w',18);
  if(!wood)wood=findReachableAutoNode(u,'w',30);
  if(!wood)return false;
  u.o='g';u.tg=wood.n;u.ct='w';u.p=wood.route;u.pt=null;u.rp=1;u.ret=0;
  u.autoWorker=1;u.autoFarmWaiting=1;return true;
 }
 for(const b of centres){
  const cx=Math.floor(b.x+b.s/2),cy=Math.floor(b.y+b.s/2);
  // Fixed nearest-ring order: deterministic without consuming simulation RNG.
  for(let d=2;d<=6;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;
   const x=cx+dx,y=cy+dy;
   if(!okPlace(0,'farm',x,y))continue;
   const route=path(u,gp(x+.5,y+.5,1.5));
   if(!route||!route.length)continue;
   const farm=addN('f',x,y,farmFood(0),1);
   if(!farm)continue;
   farm.t=0;pay(0,B.farm.cost);
   u.o='g';u.tg=farm;u.ct='f';u.p=route;u.pt=null;u.rp=1;u.ret=0;
   u.autoWorker=1;u.autoFarmWaiting=0;
   note('Automatic farm built (-'+B.farm.cost.w+' wood)');
   return true;
  }
 }
 return false;
}
function retryAutomaticFarmWorkers(){
 if(!automaticFarmAllowed()||!S.res?.[0]||!can(0,B.farm.cost))return false;
 for(const u of S.us)if(u&&u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld&&!u.retreating&&
  u.autoFarmWaiting&&u.autoWorker&&u.o==='g'&&u.ct==='w'&&!(u.car>0)){
  u.autoFarmWaiting=0;
  // Keep the existing assignment unless a fresh farm placement actually works.
  const order=u.o,target=u.tg,route=u.p;
  if(tryAutomaticFarm(u))return true;
  u.o=order;u.tg=target;u.p=route;u.autoFarmWaiting=1;
  return false;
 }
 return false;
}

function assignAutoVillager(u,force=false){
 if(!S||!u||u.t!==0||u.k!=='vil'||u.hp<=0||u.ld)return false;
 const p=S.vp||(S.vp=createVillagerPriority());
 if(!p.enabled||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=W||u.y>=H)return false;
 const keys=WORKER_TARGETS.filter(r=>p[r.k]>0).map(r=>r.k);
 if(!keys.length)return false;
 const counts=Object.fromEntries(keys.map(k=>[k,villagerAssignedCount(u.t,k)]));
 const targets=villagerPriorityTargets(u.t,p);
 const needs=keys.filter(k=>counts[k]<targets[k]).sort((a,b)=>(targets[b]-counts[b])-(targets[a]-counts[a]));
 const rest=keys.filter(k=>!needs.includes(k)).sort((a,b)=>(counts[a]/p[a])-(counts[b]/p[b])||counts[a]-counts[b]);
 for(const k of needs.concat(rest)){
  let found=findReachableAutoNode(u,k,18);
  if(!found)found=findReachableAutoNode(u,k,30);
  if(!found&&k==='f'&&tryAutomaticFarm(u))return true;
  if(!found)continue;
  u.o='g';u.tg=found.n;u.ct=k;u.p=found.route;u.pt=null;u.ret=0;u.rp=1;u.autoWorker=1;u.autoFarmWaiting=0;return true;
 }
 return false;
}
function applyVillagerPriorities(t=0){
 if(!S||t!==0||S.vp&&!S.vp.enabled)return 0;
 let assigned=0;
 for(const u of S.us)if(u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld&&u.o==='i'){u.autoTry=0;if(assignAutoVillager(u,true))assigned++}
 if(t===0)note('Priority applied to '+assigned+' idle villagers');
 return assigned;
}
function rebalanceVillagerPriorities(t=0){
 if(!S)return 0;
 const p=S.vp||(S.vp=createVillagerPriority());
 if(!p.enabled)return 0;
 const targets=villagerPriorityTargets(t,p);
 for(const {k} of WORKER_TARGETS){
  let excess=villagerAssignedCount(t,k)-(targets[k]||0);
  if(excess<=0)continue;
  const auto=S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld&&u.autoWorker&&u.o==='g'&&u.ct===k).reverse();
  for(const u of auto){if(excess<=0)break;u.o='i';u.tg=null;u.p=[];u.pt=null;u.autoTry=0;u.autoWorker=0;excess--}
 }
 return p.enabled?applyVillagerPriorities(t):0;
}
function changeVillagerTarget(k,dir){
 if(!S||!WORKER_TARGETS.some(r=>r.k===k))return false;
 const p=S.vp||(S.vp=createVillagerPriority());
 const current=Number.isFinite(p[k])?p[k]:0,step=Number.isFinite(dir)?Math.sign(dir):0;
 p[k]=Math.max(0,Math.min(40,Math.round(current+step)));
 if(p.enabled)rebalanceVillagerPriorities(0);
 const name=WORKER_TARGETS.find(r=>r.k===k).n;
 note(name+' priority weight: '+p[k]);
 return true;
}
function toggleVillagerAutomation(){
 if(!S)return;
 const p=S.vp||(S.vp=createVillagerPriority());
 p.enabled=!p.enabled;
 if(p.enabled)rebalanceVillagerPriorities(0);
 else for(const u of S.us)if(u.t===0&&u.k==='vil'&&u.hp>0){u.autoTry=0}
 note('Villager automation '+(p.enabled?'on':'off'));
}
function villagerPriorityMenuItems(){
 if(!S)return [];
 const p=S.vp||(S.vp=createVillagerPriority());
 return [
  {n:'Villager automation',v:()=>p.enabled?'On':'Off',l:toggleVillagerAutomation,r:toggleVillagerAutomation,a:toggleVillagerAutomation},
  ...WORKER_TARGETS.map(r=>({n:'Worker target: '+r.n,v:()=>p[r.k]+' weight / '+villagerPriorityTargets(0,p)[r.k]+' target / '+villagerAssignedCount(0,r.k)+' assigned',l:()=>changeVillagerTarget(r.k,-1),r:()=>changeVillagerTarget(r.k,1),a:()=>applyVillagerPriorities(0)}))
 ];
}

/* Civilization stat modifiers and regional production are kingdom rules,
 * not responsibilities of the engine frame dispatcher. */
const hpbF=(t,k,v)=>{const T0=S.tech[t];T0.hpb=T0.hpb||{};T0.hpb[k]=(T0.hpb[k]||0)+v},atkbF=(t,k,v)=>{const T0=S.tech[t];T0.atkb=T0.atkb||{};T0.atkb[k]=(T0.atkb[k]||0)+v};
/* One trainability boundary for solo, authenticated peer commands and AI. */
function regionalTrainables(kind,civId){
 const available=(B[kind]?.tr||[]).filter(unit=>{
  const rule=REGIONAL_UNIT_ACCESS.find(r=>r.unit===unit);
  return !rule||(rule.buildings.includes(kind)&&rule.civilizations.includes(civId));
 });
 for(const rule of REGIONAL_UNIT_ACCESS){
  if(rule.buildings.includes(kind)&&rule.civilizations.includes(civId)&&U[rule.unit]&&!available.includes(rule.unit))available.push(rule.unit);
 }
 return available;
}
const trOf=(b,civs=S?.civ,techs=S?.tech)=>{
 const l=regionalTrainables(b.k,civs?.[b.t]),c=b.k==='castle'&&Number.isInteger(civs?.[b.t])&&CIV[civs[b.t]];
 const civ=Number.isInteger(civs?.[b.t])?CIV[civs[b.t]]:null,core=civ&&CIV_CORE_MILITARY[civ.n];
 const eligible=core==null?l:l.filter(k=>!CORE_MILITARY_UNIT_KEYS[k]||core.includes(CORE_MILITARY_UNIT_KEYS[k]));
 // AoE2 Archery Range recruits Archer until the Crossbowman tech replaces it.
 // Do not expose the legacy standalone Crossbowman before it is researched.
 if(b.k==='rng')return eligible.filter(k=>k!=='arc'&&k!=='xbow').concat(S?.tech?.[b.t]?.xbow?'xbow':'arc');
 // Anarchy unlocks the real Huskarl production option in Gothic Barracks.
 // This same trainability policy is shared by AI, solo and network validation.
 if(b.k==='bar'&&civ?.n==='Goths'&&techs?.[b.t]?.ut18)return [...new Set([...eligible,civ.uu])];
 // Castles cannot independently create foot Crossbowmen; scripted units may still exist.
 if(b.k==='castle')return c?[...new Set([...eligible.filter(k=>k!=='xbow'),c.uu])]:eligible.filter(k=>k!=='xbow');
 // Chemistry is a real training prerequisite, also for authenticated peers.
 if(b.k==='dock')return eligible.filter(k=>k!=='cgal'||!!techs?.[b.t]?.chem);
 return eligible;
};

/* Civilization technology availability and the canonical research selection.
 * Source-backed flags and predicate bodies are relocated without rule changes.
 * These closures resolve the engine's CIV roster only when used after startup. */
/* Archer research availability for our 26 civilizations, source-pinned to
 * SiegeEngineers/aoe2techtree data/data.json @ 3bb43b1439eef88dfe7fe892d7f7dc41ac9dd76f
 * x: Crossbowman unit ID 24; a: Arbalester unit ID 492; t: Thumb Ring tech ID 437.
 * Our historical "Indians" label uses the source Hindustanis tech tree.
 * This controls only these three verified techs; other faction parity is open. */
const CIV_ARCHERY_RESEARCH=Object.freeze({
 'Franks':'x',
 'Britons':'xa',
 'Mongols':'xat',
 'Byzantines':'xat',
 'Persians':'xt',
 'Teutons':'x',
 'Celts':'x',
 'Vikings':'xa',
 'Saracens':'xat',
 'Turks':'xt',
 'Chinese':'xat',
 'Japanese':'xat',
 'Khmer':'xa',
 'Indians':'xt',
 'Spanish':'t',
 'Italians':'xat',
 'Slavs':'x',
 'Huns':'xt',
 'Goths':'x',
 'Aztecs':'xa',
 'Mayans':'xat',
 'Incas':'xat',
 'Ethiopians':'xat',
 'Malians':'xat',
 'Koreans':'xat',
 'Magyars':'xat'
});
/* Source-backed standard military lines for the 26 implemented factions.
 * SiegeEngineers/aoe2techtree data/data.json inspected 24 October 2026.
 * Research unit IDs: Man-at-Arms 75, Long Swordsman 77, Two-Handed 473,
 * Champion 567, Pikeman 358, Halberdier 359, Light Cavalry 546,
 * Cavalier 283, Elite Skirmisher 6; trained Scout Cavalry 448, Knight 38.
 * "Indians" maps to Hindustanis. Incas have a different new regional
 * infantry line; preserve C&K's legacy Militia progression until the
 * regional replacement is implemented so campaigns/saves remain playable.
 * This matrix does not cover all cavalry/unique-unit/tech exceptions. */
// Paladin d: unit 569 / upgrade 265, aoe2techtree e56728e76b7d08301fba7b18d5f16bc8554c109a.
// Hussar u: unit 441 / upgrade 428 in the same pinned source.
// Persians use Savar in that source; the replacement remains unimplemented.
const CIV_CORE_MILITARY=Object.freeze({
 'Franks':'mltcphvaeskd',
 'Britons':'mltcphvaesk',
 'Mongols':'mltcpvaesku',
 'Byzantines':'mltcphvaeskdu',
 'Persians':'mlphvaesku',
 'Teutons':'mltcphaeskd',
 'Celts':'mltcphvaeskdu',
 'Vikings':'mltcpvaesk',
 'Saracens':'mltcpvesku',
 'Turks':'mltcvasku',
 'Chinese':'mltcphvaesk',
 'Japanese':'mltcphvaesk',
 'Khmer':'mltphvaesku',
 'Indians':'mltcpvesu',
 'Spanish':'mltcphvaeskdu',
 'Italians':'mltcpvaesku',
 'Slavs':'mltcphvaesku',
 'Huns':'mltphvaeskdu',
 'Goths':'mltcphvaesku',
 'Aztecs':'mltcpe',
 'Mayans':'mltphe',
 'Incas':'mltcphe',
 'Ethiopians':'mltphvaesku',
 'Malians':'mltcpvaesk',
 'Koreans':'mltcphvaesku',
 'Magyars':'mltcphvaeskdu'
});
/* Bracer / Bloodlines / Husbandry verified from
 * SiegeEngineers/aoe2techtree data/data.json @ c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * Tech IDs: Bracer 201, Bloodlines 435, Husbandry 39.
 * r = Bracer, b = Bloodlines, h = Husbandry. All represented civs have
 * Fletching, Bodkin Arrow and Ballistics in the source snapshot.
 * "Indians" maps to Hindustanis. Existing queued research in old saves
 * completes; newly requested forbidden research is rejected.
 */
const CIV_FIELD_RESEARCH=Object.freeze({
 'Franks':'h','Britons':'rh','Mongols':'rbh','Byzantines':'rh',
 'Persians':'bh','Teutons':'b','Celts':'h','Vikings':'r',
 'Saracens':'rbh','Turks':'rbh','Chinese':'rbh','Japanese':'rbh',
 'Khmer':'rbh','Indians':'rbh','Spanish':'rbh','Italians':'rbh',
 'Slavs':'bh','Huns':'rbh','Goths':'rbh','Aztecs':'r',
 'Mayans':'r','Incas':'r','Ethiopians':'rh','Malians':'bh',
 'Koreans':'rh','Magyars':'rbh'
});
const FIELD_RESEARCH_KEYS=Object.freeze({atkR2:'r',blood:'b',husb:'h'});
/* Version-pinned AoE2:DE monastery tech eligibility for our 26 civilizations.
 * SiegeEngineers/aoe2techtree data/data.json blob
 * c4f7da961e82a8231b1ba49459949c4d6e479bc8 (build 185872).
 * Tech IDs: Devotion 46, Faith 45, Heresy 439, Redemption 316,
 * Atonement 319, Sanctity 231, Fervor 252, Block Printing 230,
 * Illumination 233, Theocracy 438, Herbal Medicine 441.
 * Historical 'Indians' game key maps to modern Hindustanis.
 * Only new research is filtered; legacy in-flight work remains loadable.
 */
const CIV_MONASTERY_RESEARCH=Object.freeze({
 'Franks':'dfhsvbitm',
 'Britons':'dfsvbitm',
 'Mongols':'dfhavm',
 'Byzantines':'dfhrasvbit',
 'Persians':'dfvbtm',
 'Teutons':'dfhrasvbitm',
 'Celts':'dfhsvm',
 'Vikings':'dfhavb',
 'Saracens':'dfhrasvbitm',
 'Turks':'dfhrasvt',
 'Chinese':'dfasvbitm',
 'Japanese':'dfrasvbitm',
 'Khmer':'dfrsvitm',
 'Indians':'dfrsvbitm',
 'Spanish':'dfhrasvbitm',
 'Italians':'dfrasvbitm',
 'Slavs':'dfrasbitm',
 'Huns':'dfhasvi',
 'Goths':'dfsvitm',
 'Aztecs':'dfhrasvbitm',
 'Mayans':'dfhasvbtm',
 'Incas':'dfhrsbitm',
 'Ethiopians':'dfhasvitm',
 'Malians':'dfhrasvbtm',
 'Koreans':'dfsvbtm',
 'Magyars':'dhsvbitm'
});
const MONASTERY_RESEARCH_KEYS=Object.freeze({devotion:'d',faith:'f',heresy:'h',redemption:'r',atonement:'a',sanctity:'s',fervor:'v',blockPrinting:'b',illumination:'i',theocracy:'t',herbalMedicine:'m'});
/* AoE2:DE update 185872 source-pinned University technology access.
 * SiegeEngineers/aoe2techtree data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * IDs: Masonry 50, Arrowslits 608, Guard Tower 140, Keep 63,
 * Fortified Wall 194, Chemistry 47, Ballistics 93, Murder Holes 322.
 * Historical 'Indians' maps to the Hindustanis base technology tree.
 * Treadmill Crane is intentionally NOT in this mask: its reference metadata
 * needs an independent verification before changing legacy saved research.
 */
const CIV_UNIVERSITY_RESEARCH=Object.freeze({
 'Franks':'msgfcbh',
 'Britons':'msgkfcbh',
 'Mongols':'mgfcbh',
 'Byzantines':'sgkfcbh',
 'Persians':'mgcbh',
 'Teutons':'msgkfcbh',
 'Celts':'msgkfcbh',
 'Vikings':'msgfcbh',
 'Saracens':'msgkfcbh',
 'Turks':'msgkfcbh',
 'Chinese':'msgkfcbh',
 'Japanese':'msgkfcbh',
 'Khmer':'mgkfcbh',
 'Indians':'mgfcbh',
 'Spanish':'msgkfcbh',
 'Italians':'msgkfcbh',
 'Slavs':'mgfcbh',
 'Huns':'mcbh',
 'Goths':'mcbh',
 'Aztecs':'sgfcbh',
 'Mayans':'mgkfcbh',
 'Incas':'msgkfcbh',
 'Ethiopians':'mgkfcbh',
 'Malians':'mgkfcbh',
 'Koreans':'msgkfcbh',
 'Magyars':'mgcbh'
});
const UNIVERSITY_RESEARCH_KEYS=Object.freeze({mas:'m',slit:'s',gtow:'g',keep:'k',fw:'f',chem:'c',ballistics:'b',murderHoles:'h'});
/* DE build 185872, SiegeEngineers tech tree blob
 * c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * First infantry, archer and cavalry armor tier availability, respectively
 * Scale Mail 74 (i), Padded Archer 211 (r), Scale Barding 81 (c).
 * The three American civs have no cavalry armor. Melee attack research is
 * separately modeled by CIV_MELEE_RESEARCH below.
 */
const CIV_BLACKSMITH_RESEARCH=Object.freeze({
 'Franks':'irc',
 'Britons':'irc',
 'Mongols':'irc',
 'Byzantines':'irc',
 'Persians':'irc',
 'Teutons':'irc',
 'Celts':'irc',
 'Vikings':'irc',
 'Saracens':'irc',
 'Turks':'irc',
 'Chinese':'irc',
 'Japanese':'irc',
 'Khmer':'irc',
 'Indians':'irc',
 'Spanish':'irc',
 'Italians':'irc',
 'Slavs':'irc',
 'Huns':'irc',
 'Goths':'irc',
 'Aztecs':'ir',
 'Mayans':'ir',
 'Incas':'ir',
 'Ethiopians':'irc',
 'Malians':'irc',
 'Koreans':'irc',
 'Magyars':'irc'
});
const BLACKSMITH_RESEARCH_KEYS=Object.freeze({armI:'i',armR:'r',armC:'c'});
/* Infantry armour Tier II/III: SiegeEngineers aoe2techtree build 185872,
 * data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * Chain Mail 76 (c), Plate Mail 77 (p). Each represented civ has Chain,
 * but Khmer, Hindustanis, Huns, Goths and Magyars lack Plate Mail.
 * This is independent of existing Scale Mail 74 in CIV_BLACKSMITH_RESEARCH.
 * Keep old paid/finished saves loadable; only new requests are gated.
 */
const CIV_INFANTRY_ARMOR_RESEARCH=Object.freeze({
 'Franks':'cp',
 'Britons':'cp',
 'Mongols':'cp',
 'Byzantines':'cp',
 'Persians':'cp',
 'Teutons':'cp',
 'Celts':'cp',
 'Vikings':'cp',
 'Saracens':'cp',
 'Turks':'cp',
 'Chinese':'cp',
 'Japanese':'cp',
 'Khmer':'c',
 'Indians':'c',
 'Spanish':'cp',
 'Italians':'cp',
 'Slavs':'cp',
 'Huns':'c',
 'Goths':'c',
 'Aztecs':'cp',
 'Mayans':'cp',
 'Incas':'cp',
 'Ethiopians':'cp',
 'Malians':'cp',
 'Koreans':'cp',
 'Magyars':'c'
});
const INFANTRY_ARMOR_RESEARCH_KEYS=Object.freeze({armI2:'c',armI3:'p'});
/* Ranged armour Tier II/III: AoE2 DE build 185872, SiegeEngineers
 * data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * Leather Archer Armor 212 (l), Ring Archer Armor 219 (r).
 * All represented civilizations have Leather. Franks, Mongols, Huns and
 * Aztecs lack Ring. Padded Archer Armor 211 is already in BLACKSMITH.
 * 'Indians' maps to source Hindustanis, which HAS Ring in this snapshot.
 * Only new purchases are gated; old queued saves remain loadable.
 */
const CIV_ARCHER_ARMOR_RESEARCH=Object.freeze({
 'Franks':'l',
 'Britons':'lr',
 'Mongols':'l',
 'Byzantines':'lr',
 'Persians':'lr',
 'Teutons':'lr',
 'Celts':'lr',
 'Vikings':'lr',
 'Saracens':'lr',
 'Turks':'lr',
 'Chinese':'lr',
 'Japanese':'lr',
 'Khmer':'lr',
 'Indians':'lr',
 'Spanish':'lr',
 'Italians':'lr',
 'Slavs':'lr',
 'Huns':'l',
 'Goths':'lr',
 'Aztecs':'l',
 'Mayans':'lr',
 'Incas':'lr',
 'Ethiopians':'lr',
 'Malians':'lr',
 'Koreans':'lr',
 'Magyars':'lr'
});
const ARCHER_ARMOR_RESEARCH_KEYS=Object.freeze({armR2:'l',armR3:'r'});
/* Cavalry armour Tier II/III: AoE2 DE build 185872, SiegeEngineers
 * data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
 * Chain Barding Armor 82 (c), Plate Barding Armor 80 (p).
 * Chain is unavailable to Aztecs, Mayans and Incas (no cavalry tech line).
 * Plate is additionally absent for Mongols, Celts, Vikings, Japanese,
 * Goths, Ethiopians and Koreans. Existing Scale Barding Armor 81
 * remains covered by CIV_BLACKSMITH_RESEARCH (armC).
 * 'Indians' maps to historical Hindustanis; paid old saves remain valid.
 */
const CIV_CAVALRY_ARMOR_RESEARCH=Object.freeze({
 'Franks':'cp',
 'Britons':'cp',
 'Mongols':'c',
 'Byzantines':'cp',
 'Persians':'cp',
 'Teutons':'cp',
 'Celts':'c',
 'Vikings':'c',
 'Saracens':'cp',
 'Turks':'cp',
 'Chinese':'cp',
 'Japanese':'c',
 'Khmer':'cp',
 'Indians':'cp',
 'Spanish':'cp',
 'Italians':'cp',
 'Slavs':'cp',
 'Huns':'cp',
 'Goths':'c',
 'Aztecs':'',
 'Mayans':'',
 'Incas':'',
 'Ethiopians':'c',
 'Malians':'cp',
 'Koreans':'c',
 'Magyars':'cp'
});
const CAVALRY_ARMOR_RESEARCH_KEYS=Object.freeze({armC2:'c',armC3:'p'});
/* AoE2 DE 185872, SiegeEngineers tech tree blob c4f7da9.
 * Forging 67 (f), Iron Casting 68 (i), Blast Furnace 75 (b).
 * Byzantines, Malians and Koreans lack Blast Furnace.
 * Historic 'Indians' maps to Hindustanis.
 */
const CIV_MELEE_RESEARCH=Object.freeze({
 'Franks':'fib',
 'Britons':'fib',
 'Mongols':'fib',
 'Byzantines':'fi',
 'Persians':'fib',
 'Teutons':'fib',
 'Celts':'fib',
 'Vikings':'fib',
 'Saracens':'fib',
 'Turks':'fib',
 'Chinese':'fib',
 'Japanese':'fib',
 'Khmer':'fib',
 'Indians':'fib',
 'Spanish':'fib',
 'Italians':'fib',
 'Slavs':'fib',
 'Huns':'fib',
 'Goths':'fib',
 'Aztecs':'fib',
 'Mayans':'fib',
 'Incas':'fib',
 'Ethiopians':'fib',
 'Malians':'fi',
 'Koreans':'fi',
 'Magyars':'fib'
});
const MELEE_RESEARCH_KEYS=Object.freeze({forging:'f',ironCasting:'i',blastFurnace:'b'});
const CORE_MILITARY_RESEARCH_KEYS=Object.freeze({man:'m',longs:'l',twohand:'t',champ:'c',pike:'p',halb:'h',lcav:'v',cavl:'a',pala:'d',huss:'u',elsk:'e'});
const CORE_MILITARY_UNIT_KEYS=Object.freeze({scout:'s',knight:'k'});
const ARCHERY_RESEARCH_KEYS=new Set(['xbow','arb','thumb']);
const rsOf=(b,civs=S?.civ)=>{
 const l=B[b.k]?.rs||[],index=civs?.[b.t],c=Number.isInteger(index)?CIV[index]:null;
 const allowed=c&&CIV_ARCHERY_RESEARCH[c.n];
 const available=b.k==='rng'&&allowed!==undefined
  ?l.filter(k=>!ARCHERY_RESEARCH_KEYS.has(k)||allowed.includes(k==='xbow'?'x':k==='arb'?'a':'t'))
  :l;
 const core=c&&CIV_CORE_MILITARY[c.n];
 const researched=core==null?available:available.filter(k=>!CORE_MILITARY_RESEARCH_KEYS[k]||core.includes(CORE_MILITARY_RESEARCH_KEYS[k]));
 const field=c&&CIV_FIELD_RESEARCH[c.n];
 const permitted=field==null?researched:researched.filter(k=>!FIELD_RESEARCH_KEYS[k]||field.includes(FIELD_RESEARCH_KEYS[k]));
 const monastery=c&&CIV_MONASTERY_RESEARCH[c.n];
 const monastic=monastery==null?permitted:permitted.filter(k=>!MONASTERY_RESEARCH_KEYS[k]||monastery.includes(MONASTERY_RESEARCH_KEYS[k]));
 const university=b.k==='univ'&&c&&CIV_UNIVERSITY_RESEARCH[c.n];
 const academic=university==null?monastic:monastic.filter(k=>!UNIVERSITY_RESEARCH_KEYS[k]||university.includes(UNIVERSITY_RESEARCH_KEYS[k]));
 const blacksmith=b.k==='smith'&&c&&CIV_BLACKSMITH_RESEARCH[c.n];
 const forged=blacksmith==null?academic:academic.filter(k=>!BLACKSMITH_RESEARCH_KEYS[k]||blacksmith.includes(BLACKSMITH_RESEARCH_KEYS[k]));
 const infantry=b.k==='smith'&&c&&CIV_INFANTRY_ARMOR_RESEARCH[c.n];
 const armored=infantry==null?forged:forged.filter(k=>!INFANTRY_ARMOR_RESEARCH_KEYS[k]||infantry.includes(INFANTRY_ARMOR_RESEARCH_KEYS[k]));
 const archers=b.k==='smith'&&c&&CIV_ARCHER_ARMOR_RESEARCH[c.n];
 const armoredArchers=archers==null?armored:armored.filter(k=>!ARCHER_ARMOR_RESEARCH_KEYS[k]||archers.includes(ARCHER_ARMOR_RESEARCH_KEYS[k]));
 const cavalry=b.k==='smith'&&c&&CIV_CAVALRY_ARMOR_RESEARCH[c.n];
 const barded=cavalry==null?armoredArchers:armoredArchers.filter(k=>!CAVALRY_ARMOR_RESEARCH_KEYS[k]||cavalry.includes(CAVALRY_ARMOR_RESEARCH_KEYS[k]));
 const melee=b.k==='smith'&&c&&CIV_MELEE_RESEARCH[c.n];
 const finalList=melee==null?barded:barded.filter(k=>!MELEE_RESEARCH_KEYS[k]||melee.includes(MELEE_RESEARCH_KEYS[k]));
 // Use the same regional unit catalogue as Stable training and authenticated orders.
 const regional=finalList.filter(k=>k!=='hcamel'||REGIONAL_UNIT_ACCESS.some(rule=>
  rule.unit==='camel'&&rule.buildings.includes(b.k)&&rule.civilizations.includes(index)));
 return b.k==='castle'&&c?[...new Set([...regional,c.ut.k,...(c.ut2?[c.ut2.k]:[]),...(c.elite?[c.elite.k]:[])])]:regional;
};
