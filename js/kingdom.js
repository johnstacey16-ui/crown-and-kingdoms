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
 const p={enabled:true,f:2,w:2,g:1,s:0};
 if(source&&typeof source==='object'){
  if(typeof source.enabled==='boolean')p.enabled=source.enabled;
  for(const k of['f','w','g','s']){if(source[k]===null||source[k]===undefined||source[k]==='')continue;const n=Number(source[k]);if(Number.isFinite(n))p[k]=Math.max(0,Math.min(40,Math.round(n)))}
 }
 return p;
}
const WORKER_TARGETS=[{k:'f',n:'Food'},{k:'w',n:'Wood'},{k:'g',n:'Gold'},{k:'s',n:'Stone'}];
function villagerAssignedCount(t,k){return S?S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld&&u.o==='g'&&u.ct===k).length:0}
function autoNodeKey(n){return n.k+':'+n.x+':'+n.y}
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
 if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y))return null;
 const now=Number.isFinite(S.t)?S.t:0;
 const all=S.nodes.filter(n=>n&&n.amt>0&&!n.an&&!n.fi&&WORKER_TARGETS.some(t=>t.k===n.k)&&Number.isFinite(n.x)&&Number.isFinite(n.y));
 const live=new Set(all.map(autoNodeKey));
 // Legacy save files stored plain keys; discard those permanent exclusions.
 u.autoSkipNodes=(Array.isArray(u.autoSkipNodes)?u.autoSkipNodes:[]).filter(e=>e&&typeof e==='object'&&typeof e.key==='string'&&Number.isFinite(e.until)&&e.until>now&&live.has(e.key)).slice(-64);
 const skipped=new Set(u.autoSkipNodes.map(e=>e.key));
 const candidates=all.filter(n=>n.k===k&&Math.hypot(n.x-u.x,n.y-u.y)<r&&!skipped.has(autoNodeKey(n))).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
 let failed=0;
 for(const n of candidates){
  const route=path(u,goalNear(n,1));
  if(route&&route.length)return {n,route};
  skipAutoNode(u,n);
  if(++failed>=8)break;
 }
 return null;
}
function assignAutoVillager(u,force=false){
 if(!S||!u||u.t!==0||u.k!=='vil'||u.hp<=0||u.ld)return false;
 const p=S.vp||(S.vp=createVillagerPriority());
 if(!force&&!p.enabled)return false;
 const keys=WORKER_TARGETS.filter(r=>p[r.k]>0).map(r=>r.k);
 if(!keys.length)return false;
 const counts=Object.fromEntries(keys.map(k=>[k,villagerAssignedCount(u.t,k)]));
 const needs=keys.filter(k=>counts[k]<p[k]).sort((a,b)=>(p[b]-counts[b])-(p[a]-counts[a]));
 const rest=keys.filter(k=>!needs.includes(k)).sort((a,b)=>(counts[a]/p[a])-(counts[b]/p[b])||counts[a]-counts[b]);
 for(const k of needs.concat(rest)){
  const found=findReachableAutoNode(u,k,18);
  if(!found)continue;
  u.o='g';u.tg=found.n;u.ct=k;u.p=found.route;u.pt=null;u.ret=0;u.rp=1;u.autoWorker=1;return true;
 }
 return false;
}
function applyVillagerPriorities(t=0){
 if(!S||t===0&&S.vp&&!S.vp.enabled)return 0;
 let assigned=0;
 for(const u of S.us)if(u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld&&u.o==='i'){u.autoTry=0;if(assignAutoVillager(u,true))assigned++}
 if(t===0)note('Priority applied to '+assigned+' idle villagers');
 return assigned;
}
function rebalanceVillagerPriorities(t=0){
 if(!S)return 0;
 const p=S.vp||(S.vp=createVillagerPriority());
 if(!p.enabled)return 0;
 for(const {k} of WORKER_TARGETS){
  let excess=villagerAssignedCount(t,k)-(p[k]||0);
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
 note(name+' target: '+p[k]);
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
  ...WORKER_TARGETS.map(r=>({n:'Worker target: '+r.n,v:()=>p[r.k]+' target / '+villagerAssignedCount(0,r.k)+' assigned',l:()=>changeVillagerTarget(r.k,-1),r:()=>changeVillagerTarget(r.k,1),a:()=>applyVillagerPriorities(0)}))
 ];
}
