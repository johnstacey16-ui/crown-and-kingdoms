/* Shared AI threat, economy, siege and builder-selection policies. Loaded before ai.js; global function declarations retained. */
// Siege should neutralise reachable fortifications before ordinary town centres.
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

// Allied-resource transfer policy. Preserve its original reserve and cooldown rules.
function aiShareResources(t,A,R){
if(S.t-(A.lastTributeAt??-90)>=90){
 const allies=[];
 for(let ally=0;ally<S.teamN;ally++)if(ally!==t&&diplomacyRelation(t,ally)==='ally'&&(S.bs.some(b=>b.t===ally&&b.hp>0)||S.us.some(u=>u.t===ally&&u.hp>0)))allies.push(ally);
 const reserves={f:900,w:800,g:650,s:500};
 const needs={f:250,w:250,g:200,s:150};
 let transfer=null;
 for(const ally of allies){
  const shortage=['f','w','g','s'].map(k=>({k,deficit:needs[k]-(S.res[ally]?.[k]||0)})).filter(q=>q.deficit>0).sort((a,b)=>b.deficit-a.deficit);
  for(const q of shortage){const amount=Math.min(250,Math.floor(q.deficit/100)*100);if(amount>=100&&R[q.k]>=reserves[q.k]+amount){transfer={ally,k:q.k,amount};break}}
  if(transfer)break;
 }
 if(transfer&&Number.isSafeInteger(R[transfer.k])&&Number.isSafeInteger(S.res[transfer.ally]?.[transfer.k])&&Number.isSafeInteger(S.res[transfer.ally][transfer.k]+transfer.amount)&&R[transfer.k]>=transfer.amount&&diplomacyRelation(t,transfer.ally)==='ally'){R[transfer.k]-=transfer.amount;S.res[transfer.ally][transfer.k]+=transfer.amount;A.lastTributeAt=S.t}
}
}

/* Preserve the scouting cadence and randomized waypoint selection from the AI
 * loop: at most four attempts, eight seconds between attempts and avoidance
 * of the current position and last destination. */
function aiScoutIdleUnits(scouts){
for(const s of scouts.filter(u=>u.o==='i'&&S.t>=(u.nextScoutRoute||0))){s.nextScoutRoute=S.t+8;for(let attempt=0;attempt<4;attempt++){const x=2+S.r()*(W-4),y=2+S.r()*(H-4);if(Math.hypot(x-s.x,y-s.y)<10||Math.hypot(x-(s.lastScoutX??s.x),y-(s.lastScoutY??s.y))<12)continue;const p=path(s,gp(x,y,2.5));if(p){s.o='m';s.p=p;s.rp=1;s.lastScoutX=x;s.lastScoutY=y;break}}}
}

/* Build tactical and economic threat rosters with one guarded pass. Diplomacy,
 * hitpoints, garrison status, and the separate fishing/trade/combat restrictions
 * match the prior aiTeam inline scan exactly. */
function aiClassifyHostileForces(t){
const hostileFleet=[],hostileShips=[],humanArmy=[],humanShips=[];let navalThreatCount=0;for(const e of S.us){if(!e||!Number.isInteger(e.t)||!isHostile(t,e.t)||e.hp<=0||!U[e.k])continue;if(!e.ld&&!U[e.k].sh)humanArmy.push(e);if(U[e.k].sh){if(!e.ld&&e.k!=='fish')hostileShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4)humanShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4){navalThreatCount++;hostileFleet.push(e)}}}
return {hostileFleet,hostileShips,humanArmy,humanShips,navalThreatCount};
}

/* Composition-sensitive research scoring. Receives current live rosters rather
 * than closing over aiTeam so production and focused policy checks use one owner.
 * Existing research weights, prerequisites and sorting remain unchanged. */
function aiTechnologyPriority(k,{arm,vil,bl,my,humanCav,humanRanged,humanSiege,humanInf,humanShips}){
 const base={loom:76,wheel:79,handcart:75,gath:86,axe:82,saw:78,gmine:74,smine:66,coll:75,plow:70,crop:60,carry:58,forging:62,ironCasting:69,blastFurnace:72,atkR:62,atkR2:72,bodkin:69,ballistics:73,thumb:67,armI:60,armI2:64,armI3:66,armR:60,armR2:64,armR3:66,armC:60,armC2:64,armC3:66,man:65,longs:66,twohand:65,champ:64,cons:62,pike:63,halb:66,husb:64,blood:68,squires:64,arson:56,xbow:70,arb:65,elsk:64,lcav:62,cavl:65,siegeup:54,crane:50,mas:52,slit:45,fw:35,gtow:40,keep:36,navalAtk:55,navalHull:57,devotion:40,faith:30,heresy:25,redemption:45,atonement:40,sanctity:55,fervor:48,blockPrinting:60,illumination:50,theocracy:42,herbalMedicine:36,murderHoles:38};
 let score=base[k]||20;
 if(k==='pike'&&humanCav>=2)score+=90;
 if(k==='halb'&&humanCav>=2)score+=85;
 const ownInf=arm.filter(u=>INFARM.has(u.k)).length,ownRanged=arm.filter(u=>ARCHARM.has(u.k)).length,ownCav=arm.filter(u=>CAVARM.has(u.k)).length;
 if(k==='husb'&&ownCav>=3)score+=22;
 if(k==='blood'&&ownCav>=3)score+=26;
 if(k==='squires'&&ownInf>=3)score+=22;
 if(k==='arson'&&ownInf>=4)score+=18;
 if(k==='elsk'&&humanRanged>=4)score+=60;
  if(k==='thumb'&&arm.some(u=>['arc','xbow','skirm','mgd','chuko','genoa','plumed','lbow'].includes(u.k)))score+=25;
  if((k==='xbow'||k==='arb')&&ownRanged>=4)score+=26;
 /* Avoid spending scarce resources on upgrades for unit classes not yet fielded. */
 if(k==='husb'&&ownCav<2)score-=24;
 if(k==='blood'&&ownCav<2)score-=26;
 if(k==='squires'&&ownInf<2)score-=24;
 if(k==='arson'&&ownInf<3)score-=24;
 if(k==='armR'&&ownRanged<2)score-=28;
 if((k==='armR2'||k==='armR3')&&ownRanged<2)score-=28;
 if(k==='armI'&&ownInf<2)score-=28;
 if((k==='armI2'||k==='armI3')&&ownInf<2)score-=28;
 if(k==='armC'&&ownCav<2)score-=28;
 if((k==='armC2'||k==='armC3')&&ownCav<2)score-=28;
 if(['forging','ironCasting'].includes(k)&&ownInf+ownCav<2)score-=20;
 if(k==='blastFurnace'&&ownInf+ownCav<2)score-=28;
 if(['atkR','bodkin','atkR2','ballistics','thumb'].includes(k)&&ownRanged<2)score-=20;
 if(k==='atkR2'&&ownRanged<2)score-=28;
 /* Armour research should protect the army we actually field, not just react to the enemy's composition. */
 if(k==='armR'&&ownRanged>=3)score+=32;
 if((k==='armR2'||k==='armR3')&&ownRanged>=3)score+=32;
 if(k==='armI'&&ownInf>=3)score+=30;
 if((k==='armI2'||k==='armI3')&&ownInf>=3)score+=30;
 if(k==='armC'&&ownCav>=3)score+=32;
 if((k==='armC2'||k==='armC3')&&ownCav>=3)score+=32;
 if(k==='armI'&&humanRanged>=3)score+=12;
 if((k==='armI2'||k==='armI3')&&humanRanged>=3)score+=12;
 if(k==='armR'&&humanInf>=4)score+=10;
 if((k==='armR2'||k==='armR3')&&humanInf>=4)score+=10;
 if((k==='twohand'||k==='champ')&&humanInf>=3)score+=22;
 if(k==='cons'&&arm.length>=8)score+=24;
 if(['forging','ironCasting','blastFurnace'].includes(k)&&ownInf+ownCav>=4)score+=24;
 if(k==='atkR'&&ownRanged>=4)score+=24;
 if(k==='siegeup'&&humanSiege>=1)score+=42;
 if(k==='navalHull'&&humanShips.length)score+=95;
 if(k==='navalAtk'&&humanShips.length)score+=105;
 if(k==='atkR'&&humanRanged>=4)score+=18;
 if(k==='loom'&&vil.length>=5)score+=16;
 if(k==='wheel'&&vil.length>=8)score+=18;
 if(k==='handcart'&&vil.length>=12)score+=20;
 if(k==='gath'&&vil.length>=8)score+=15;
 if(k==='axe'&&vil.length>=4)score+=12;
 if(k==='carry'&&vil.length>=12)score+=12;
 if(k==='mas'&&bl.some(b=>b.k==='tc'&&b.hp<b.mh*.8))score+=15;
 if(['sanctity','fervor','redemption','atonement','blockPrinting','illumination','theocracy'].includes(k)&&my.filter(u=>u.k==='mon').length<2)score-=35;
 if(k==='murderHoles'&&!bl.some(b=>b.k==='tower'||b.k==='castle'))score-=35;
 return score
}

/* Assign repair workers to damaged owned or allied buildings, retaining the
 * current threat, priority, cooldown and reachable-villager constraints. */
function aiRepairImportantBuildings(t,A,bl,vil){
/* Repair important damaged buildings with a small number of idle villagers when construction is not already waiting. */
if(!bl.some(b=>!b.done&&b.hp>0)&&S.t-(A.lastBuildingRepair??-99)>=4){
 const priority={tc:10,castle:9,tower:8,gate:7,palisade:6,wall:6,monastery:5,market:5,lumber:4,mine:4,mill:4,dock:4,bar:3,rng:3,stable:3,siege:3,house:2};
 const repairSites=bl.concat(S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.done&&b.hp>0&&['tc','castle','tower','market','mill','lumber','mine','dock','palisade','wall','gate'].includes(b.k))),target=repairSites.filter(b=>b.done&&b.hp>0&&b.hp<b.mh*.65&&!vil.some(v=>v.o==='b'&&v.tg===b)&&!S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&!e.ld&&U[e.k]?.dmg>3&&Math.hypot(e.x-(b.x+b.s/2),e.y-(b.y+b.s/2))<8))
  .sort((a,b)=>((priority[b.k]||1)+(1-b.hp/b.mh)*3)-((priority[a.k]||1)+(1-a.hp/a.mh)*3))[0];
 if(target){
  const builders=vil.filter(v=>v.o==='i'&&!v.ld&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.y>=0&&v.x<W&&v.y<H).sort((a,b)=>Math.hypot(a.x-(target.x+target.s/2),a.y-(target.y+target.s/2))-Math.hypot(b.x-(target.x+target.s/2),b.y-(target.y+target.s/2)));
  let assigned=0;for(const v of builders){if(Math.hypot(v.x-(target.x+target.s/2),v.y-(target.y+target.s/2))>26)continue;const route=path(v,goalNear(target,1));if(!route)continue;v.o='b';v.tg=target;v.p=route;v.rp=1;assigned++;if(assigned>=2)break}
  if(assigned)A.lastBuildingRepair=S.t
 }
}
}

/* Assign idle villagers to outstanding construction, economy nodes and farm
 * placement without changing existing resource ratios, safe-path fallback,
 * bounded node searches or the farm payment/order sequence. */
function aiAssignIdleVillagers(t,vil,bl,arm,tc,R,cnt){
const wk=k=>vil.filter(u=>u.o==='g'&&u.ct===k&&!u.aiEvac&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H).length;

for(const v of vil)if(v.o==='i'&&v.hp>0&&!v.ld&&!v.aiEvac&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.y>=0&&v.x<W&&v.y<H){let buildRoute=null,buildChecks=0;const ub=bl.find(b=>{if(b.done||b.hp<=0||vil.some(u=>u.o==='b'&&u.tg===b))return false;if(++buildChecks>8)return false;buildRoute=path(v,goalNear(b,1));return !!buildRoute});if(ub){v.o='b';v.tg=ub;v.p=buildRoute;v.rp=1;continue}const nv=vil.length;let k=wk('f')<(S.age[t]>=1&&arm.length<6?Math.max(8,nv*.45|0):Math.max(5,nv*.32|0))?'f':wk('w')<Math.max(6,nv*.3|0)?'w':wk('g')<Math.max(3,nv*.2|0)?'g':wk('s')<Math.max(2,nv*.1|0)&&S.age[t]>=1?'s':'f',n=findNode(v,k,36);
if(k==='f'&&can(t,B.farm.cost)&&R.w>=B.farm.cost.w+((S.age[t]>=1&&cnt('bar')&&arm.length<6)?50:0)&&(!n||S.nodes.filter(m=>m.fm&&m.amt>0&&Math.hypot(m.x-tc.x,m.y-tc.y)<12).length<Math.max(4,nv*.25|0)))for(let i=0,pf=0;i<20&&!pf;i++){const x=(tc.x+1+(S.r()-.5)*14)|0,y=(tc.y+1+(S.r()-.5)*14)|0;if(Math.hypot(x-tc.x,y-tc.y)>3&&!cor(tc,x,y)&&okPlace(t,'farm',x,y)&&path(v,gp(x+.5,y+.5,1.5))){const farm=addN('f',x,y,farmFood(t),1);if(!farm)continue;pay(t,B.farm.cost);farm.t=t;n=farm;pf=1}}
if(!n){for(const fallback of ['w','f','g','s']){if(fallback===k)continue;const candidate=findNode(v,fallback,30);if(candidate){k=fallback;n=candidate;break}}}if(n){let route=path(v,goalNear(n,1));if(!route){const alternatives=S.nodes.filter(alternative=>alternative&&alternative!==n&&alternative.amt>0&&!alternative.an&&!alternative.fi&&['f','w','g','s'].includes(alternative.k)&&Number.isInteger(alternative.x)&&Number.isInteger(alternative.y)&&alternative.x>=0&&alternative.y>=0&&alternative.x<W&&alternative.y<H&&S.wt[alternative.y*W+alternative.x]!==1&&Math.hypot(alternative.x-v.x,alternative.y-v.y)<=36).sort((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)-Math.hypot(b.x-v.x,b.y-v.y));for(const alternative of alternatives.slice(0,12)){const candidate=path(v,goalNear(alternative,1));if(candidate){n=alternative;route=candidate;break}}}if(route){v.o='g';v.tg=n;v.ct=n.k;v.p=route;v.rp=1;v.ret=0}}}
}

