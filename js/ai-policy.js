/* Shared AI threat, economy, siege and builder-selection policies. Loaded before ai.js; global function declarations retained. */
// Siege should neutralise reachable fortifications before ordinary town centres.
/* Select a siege-weighted threat from the already filtered shared hostile roster.
 * Keep selection pure so real prioritisation is regression-tested independently. */
function aiBaseDefenceThreat(nearbyRaiders,base){
 if(!base||!Array.isArray(nearbyRaiders))return null;
 let intruder=null,best=Infinity;
 const bx=base.x+base.s/2,by=base.y+base.s/2;
 for(const e of nearbyRaiders){
  if(!e||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
  const d=Math.hypot(e.x-bx,e.y-by);
  if(d>=13)continue;
  const score=d-(['ram','mang','scor','treb','bomb'].includes(e.k)?7:0);
  if(score<best){best=score;intruder=e}
 }
 return intruder;
}
/* Protect the complete next-age budget when deciding on optional research. */
function aiCanResearchWhileSaving(resources,researchCost,ageCost){
 return Object.keys(ageCost).every(res=>(resources[res]||0)-(researchCost[res]||0)>=ageCost[res]);
}
/* Count only valid orders in living production buildings; all AI unit caps use this. */
function aiQueuedUnits(buildings,k){
 if(!Array.isArray(buildings))return 0;
 return buildings.reduce((count,b)=>count+(b&&b.hp>0&&Array.isArray(b.q)?
   b.q.filter(q=>q&&q.k===k).length:0),0);
}
function aiSiegeTarget(leader,buildings,fallback){
 if(!leader)return fallback;
 const priority={castle:0,tower:1,tc:2};
 const choices=buildings.filter(b=>b&&b.done&&b.hp>0&&isHostile(leader.t,b.t)&&Object.prototype.hasOwnProperty.call(priority,b.k))
  .map(b=>{const dx=b.x+b.s/2-leader.x,dy=b.y+b.s/2-leader.y;return {b,d:dx*dx+dy*dy}})
  .sort((a,b)=>priority[a.b.k]-priority[b.b.k]||a.d-b.d);
 for(let i=0;i<Math.min(12,choices.length);i++)if(path(leader,goalNear(choices[i].b,2)))return choices[i].b;
 return fallback;
}
function aiAvailableBuilder(u){return u&&u.k==='vil'&&u.hp>0&&!u.ld&&!u.aiEvac&&!u.retreating&&!['b','B','a','m','rep'].includes(u.o)}
function aiBuilderCandidates(vs){return vs.filter(u=>aiAvailableBuilder(u)&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H).sort((a,b)=>(a.o==='i'?0:a.o==='g'?1:2)-(b.o==='i'?0:b.o==='g'?1:2))}
function aiReachableBuilder(vs,target){
 if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y)||target.x<0||target.y<0||target.x>=W||target.y>=H)return null;
 const candidates=vs.filter(u=>aiAvailableBuilder(u)&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);
 if(!candidates.length)return null;
 const priority=u=>u.o==='i'?0:u.o==='g'?5:12;
 /* Cache candidate scores once; building assignment should not repeatedly compute distances during sorting. */
 const ranked=candidates.map(u=>{const dx=u.x-target.x,dy=u.y-target.y;return {u,score:Math.sqrt(dx*dx+dy*dy)+priority(u)}}).sort((a,b)=>a.score-b.score);
 candidates.length=0;for(const entry of ranked)candidates.push(entry.u);
 const goal=goalNear(target,1);
 // A blocked group of nearby builders must not prevent a distant reachable worker from building.
 const tried=new Set();
 const attempt=u=>{
  if(!u||tried.has(u)||!S||!S.g)return null;
  tried.add(u);
  const route=path(u,goal);
  return route&&route.length?{builder:u,route}:null;
 };
 for(let i=0,limit=Math.min(12,candidates.length);i<limit;i++){const choice=attempt(candidates[i]);if(choice)return choice}
 /* Retain ranked candidates in place; blocked nearby builders can fall through to distant workers. */
 /* Check several idle and gathering workers, not just one blocked candidate of each kind. */
 for(const order of ['i','g']){
  let checked=0;
  for(let i=12;i<candidates.length;i++){const u=candidates[i];if(u.o!==order)continue;const choice=attempt(u);if(choice)return choice;if(++checked>=6)break}
 }
 // Bounded fallback explores more options without unbounded pathfinding on crowded maps.
 for(let i=12;i<Math.min(36,candidates.length);i++){const choice=attempt(candidates[i]);if(choice)return choice}
 return null;
}

// Stop continuous food spending once a healthy Dark Age economy can save
// for the next age. A food threshold alone is too late: the Town Centre
// otherwise consumes the 50 food that should finish the age-up budget.
function aiSavingAgeFood(t,villagers){
 const next=AG[S.age[t]+1];
 return !!(next&&villagers>=16&&ageRequirements(t).ready);
}
function aiTownTechReady(t,tc,villagers){if(villagers<8||!tc.done||tc.hp<=0||tc.rs||!Array.isArray(tc.q)||!S.tech[t])return false;for(const k of ['loom','wheel','handcart']){const e=TE[k];if(e&&B.tc.rs&&B.tc.rs.includes(k)&&!S.tech[t][k]&&!S.bs.some(other=>other!==tc&&other.t===t&&other.hp>0&&other.rs&&other.rs.k===k)&&e.age<=S.age[t]&&(!e.pre||S.tech[t][e.pre])&&can(t,e.cost))return true}return false}

/* AI strategy selectors are shared by solo and host-authoritative simulations.
 * Code below was relocated verbatim from ai.js; preserve its dependencies. */
function aiDockWaterReach(x,y,minCells=32){
 // A dock needs one usable connected water body, not the sum of isolated ponds.
 const checked=new Set();
 for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++){
  const xx=x+dx,yy=y+dy;
  if(xx<0||yy<0||xx>=W||yy>=H)continue;
  const start=yy*W+xx;
  if(checked.has(start)||S.wt[start]!==1||S.nd[start])continue;
  const queue=[start];checked.add(start);
  for(let n=0;n<queue.length&&queue.length<minCells;n++){
   const i=queue[n],cx=i%W,cy=i/W|0;
   for(const j of [cx>0?i-1:-1,cx<W-1?i+1:-1,cy>0?i-W:-1,cy<H-1?i+W:-1]){
    if(j<0||S.wt[j]!==1||S.nd[j]||checked.has(j))continue;
    checked.add(j);queue.push(j);
   }
  }
  if(queue.length>=minCells)return true;
 }
 return false;
}
// The first Feudal push can be a smaller skirmish. Using the full
// late-game difficulty wave size before the first raid stalls real AI games
// when villagers gather at DE reference speeds. Later waves are unchanged.
function aiOpeningWaveNeed(base,age,wave){return age===1&&wave===0?Math.max(6,Math.ceil(base*.7)):base}
function aiRebal(vil,R,t=1){
 const active=vil.filter(u=>u&&u.k==='vil'&&u.hp>0&&!u.ld&&!u.aiEvac&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);
 const nv=active.length;
 const assigned={f:0,w:0,g:0,s:0};
 for(const u of active)if(u.o==='g'&&Object.prototype.hasOwnProperty.call(assigned,u.ct))assigned[u.ct]++;
 const move=(kind,sources)=>{
  const workers=active.filter(u=>u.o==='g'&&sources.includes(u.ct)&&!u.car&&!u.ret&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H).sort((a,b)=>sources.indexOf(a.ct)-sources.indexOf(b.ct));
  if(!workers.length)return false;
  const nodes=S.nodes.filter(n=>n&&n.k===kind&&n.amt>0&&!n.an&&!n.fi&&Number.isInteger(n.x)&&Number.isInteger(n.y)&&n.x>=0&&n.y>=0&&n.x<W&&n.y<H&&!S.wt[n.y*W+n.x]);
  if(!nodes.length)return false;
  for(const w of workers){
   const near=nodes.filter(n=>farmAvailableTo(w,n)&&Math.hypot(n.x-w.x,n.y-w.y)<=36)
    .sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y));
   for(const n of near.slice(0,12)){
    const route=path(w,goalNear(n,1));
    if(!route||!route.length)continue;
    const old=w.ct;
    w.o='g';w.tg=n;w.ct=kind;w.p=route;w.pt=null;w.rp=1;w.ret=0;
    assigned[old]--;assigned[kind]++;
    return true;
   }
  }
  return false;
 };
 // Rebuild a timber economy after aging: Feudal military buildings cost
 // wood even when the food/gold stockpiles were spent on advancement.
 if(R.w<150&&assigned.w<nv*.4&&(Math.max(R.f,R.g)>250||S.age[t]>=1))move('w',R.f>R.g?['f','g']:['g','f']);
 else if(S.age[t]>=1&&R.s<150&&assigned.s<Math.max(2,nv*.1|0)&&(PERS[aip].tw>0||PERS[aip].wl>0)&&R.f>200&&R.g>100)move('s',R.f>R.g?['f','g']:['g','f']);
 // As the Dark Age closes, redirect excess loggers/miners into food
 // instead of spending the Feudal-age budget on additional villagers.
 // Keep enough workers on other resources to maintain construction.
 if(S.age[t]===0&&nv>=12&&ageRequirements(t).ready&&R.f<AG[1].cost.f&&assigned.f<Math.ceil(nv*.7)){
  if(move('f',['g','w']))return;
 }
 // Sustain a Castle Age saving phase with sufficient food gatherers; only
 // one reachable, empty-handed worker changes jobs per AI decision tick.
 if(S.age[t]===1&&nv>=22&&ageRequirements(t).ready&&R.f<AG[2].cost.f&&assigned.f<Math.ceil(nv*.55)){
  if(move('f',['g','w']))return;
 }
 if(R.w>800){
  if(R.f<400&&assigned.f<nv*.45){if(!move('f',['w','g'])&&S.age[t]>=1&&R.s<300&&assigned.s<Math.max(3,nv*.12|0))move('s',['w'])}
  else if(R.s<300&&S.age[t]>=1&&assigned.s<Math.max(3,nv*.12|0)){if(!move('s',['w'])&&R.g<300&&assigned.g<nv*.3)move('g',['w'])}
  else if(R.g<300&&assigned.g<nv*.3)move('g',['w']);
 }
}

// After an opening attack breaks off to fight enemy villagers, survivors must
// resume attacking a live objective rather than idling with A.on still true.
// One bounded route check per reachable objective and soldier every ten seconds.
function aiResumeIdleWave(t,A){
 if(!A?.on||A.stg||!Array.isArray(A.wu)||S.t<(A.nextWaveObjectiveAt||0))return 0;
 A.nextWaveObjectiveAt=S.t+10;
 const candidates=S.bs.filter(b=>b&&b.hp>0&&isHostile(t,b.t)).sort((a,b)=>Number(b.k==='tc')-Number(a.k==='tc'));
 if(!candidates.length)return 0;
 let retasked=0;
 for(const u of A.wu){
  if(!u||u.hp<=0||u.ld||u.retreating||u.o!=='i'||!U[u.k]||U[u.k].dmg<=0)continue;
  for(const target of candidates.slice(0,3)){
   const route=path(u,goalNear(target,1));
   if(!route||!route.length)continue;
   u.o='a';u.tg=target;u.p=route;u.rp=1;retasked++;break;
  }
 }
 return retasked;
}
