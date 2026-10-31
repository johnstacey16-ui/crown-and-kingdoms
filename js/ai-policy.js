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
