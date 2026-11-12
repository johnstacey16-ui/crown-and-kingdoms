/* Crown & Kingdoms — villager economic balancing, allies' resource support,
 * repair assignments and idle-worker farm/construction routing. Loaded after
 * ai-policy.js and before defensive/maritime/offensive AI modules.
 */
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
   const near=nodes.filter(n=>resourceHasWorksite(w,n)&&Math.hypot(n.x-w.x,n.y-w.y)<=36)
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
 // Fund Castle and Imperial advancement with sufficient food gatherers. Only
 // one reachable, empty-handed worker changes jobs per AI decision tick.
 if((S.age[t]===1||S.age[t]===2)&&nv>=(S.age[t]===1?22:24)&&ageRequirements(t).ready&&R.f<AG[S.age[t]+1].cost.f&&assigned.f<Math.ceil(nv*.55)){
  if(move('f',['g','w']))return;
 }
 if(R.w>800){
  if(R.f<400&&assigned.f<nv*.45){if(!move('f',['w','g'])&&S.age[t]>=1&&R.s<300&&assigned.s<Math.max(3,nv*.12|0))move('s',['w'])}
  else if(R.s<300&&S.age[t]>=1&&assigned.s<Math.max(3,nv*.12|0)){if(!move('s',['w'])&&R.g<300&&assigned.g<nv*.3)move('g',['w'])}
  else if(R.g<300&&assigned.g<nv*.3)move('g',['w']);
 }
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

/* Assign repair workers to damaged owned or allied buildings, retaining the
 * current threat, priority, cooldown and reachable-villager constraints. */
function aiRepairImportantBuildings(t,A,bl,vil){
/* Repair important damaged buildings with a small number of idle villagers when construction is not already waiting. */
if(!bl.some(b=>!b.done&&b.hp>0)&&S.t-(A.lastBuildingRepair??-99)>=4){
 const priority={tc:10,castle:9,tower:8,gate:7,palisade:6,wall:6,monastery:5,market:5,lumber:4,mine:4,mill:4,folwark:4,dock:4,bar:3,rng:3,stable:3,siege:3,house:2};
 const repairSites=bl.concat(S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.done&&b.hp>0&&['tc','castle','tower','market','mill','folwark','lumber','mine','dock','palisade','wall','gate'].includes(b.k))),target=repairSites.filter(b=>b.done&&b.hp>0&&b.hp<b.mh*.65&&!vil.some(v=>v.o==='b'&&v.tg===b)&&!S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&!e.ld&&U[e.k]?.dmg>3&&Math.hypot(e.x-(b.x+b.s/2),e.y-(b.y+b.s/2))<8))
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
if(k==='f'&&(typeof buildingUnlock!=='function'||buildingUnlock('farm',t,S).state==='available')&&can(t,B.farm.cost)&&R.w>=B.farm.cost.w+((S.age[t]>=1&&cnt('bar')&&arm.length<6)?50:0)&&(!n||S.nodes.filter(m=>m.fm&&m.amt>0&&Math.hypot(m.x-tc.x,m.y-tc.y)<12).length<Math.max(4,nv*.25|0)))for(let i=0,pf=0;i<20&&!pf;i++){const x=(tc.x+1+(S.r()-.5)*14)|0,y=(tc.y+1+(S.r()-.5)*14)|0;if(Math.hypot(x-tc.x,y-tc.y)>3&&!cor(tc,x,y)&&okPlace(t,'farm',x,y)&&path(v,gp(x+.5,y+.5,1.5))){const farm=addN('f',x,y,farmFood(t),1);if(!farm)continue;pay(t,B.farm.cost);farm.t=t;if(typeof grantFolwarkFarmFood==='function')grantFolwarkFarmFood(farm,t);n=farm;pf=1}}
if(!n){for(const fallback of ['w','f','g','s']){if(fallback===k)continue;const candidate=findNode(v,fallback,30);if(candidate){k=fallback;n=candidate;break}}}if(n){let route=path(v,goalNear(n,1));if(!route){const alternatives=S.nodes.filter(alternative=>alternative&&alternative!==n&&alternative.amt>0&&!alternative.an&&!alternative.fi&&['f','w','g','s'].includes(alternative.k)&&Number.isInteger(alternative.x)&&Number.isInteger(alternative.y)&&alternative.x>=0&&alternative.y>=0&&alternative.x<W&&alternative.y<H&&S.wt[alternative.y*W+alternative.x]!==1&&resourceHasWorksite(v,alternative)&&Math.hypot(alternative.x-v.x,alternative.y-v.y)<=36).sort((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)-Math.hypot(b.x-v.x,b.y-v.y));for(const alternative of alternatives.slice(0,12)){const candidate=path(v,goalNear(alternative,1));if(candidate){n=alternative;route=candidate;break}}}if(route){v.o='g';v.tg=n;v.ct=n.k;v.p=route;v.rp=1;v.ret=0}}}
}

/* Preserve resource buy/sell order and fifteen-second market throttle. */
function aiManageMarketTrade(t,A,bl,R){
if(bl.some(b=>b.k==='market'&&b.done&&b.hp>0)&&S.t-(A.lastMarketTrade??-99)>=15){for(const k of ['f','w','s']){if(R[k]>1100&&R.g<400){if(trade(t,k,'sell')){A.lastMarketTrade=S.t;break}}else if(R[k]<80&&R.g>600&&k!=='s'){if(trade(t,k,'buy')){A.lastMarketTrade=S.t;break}}}}
}
