/* Crown & Kingdoms — economic, defensive, and naval AI. Loaded after simulation.js. */
/* ===== ENEMY AI (same rules as player; no resource or damage bonuses) ===== */
function ai(dt){if(!Number.isFinite(dt)||dt<=0)return;for(let t=1;t<S.teamN;t++)if(!Array.isArray(S.humanTeams)||!S.humanTeams.includes(t))aiTeam(t,dt)}
// Build the strategic roster once per AI decision. Keep garrisoned units in
// total ownership counts, but exclude them from active worker/army/fleet groups.
// A completed, living Town Centre takes priority over an unfinished fallback.
function aiTeamRoster(t){
 const my=[],vil=[],arm=[],fish=[],scouts=[],galleys=[],bl=[];let tc=null;
 for(const u of S.us)if(u&&u.t===t&&u.hp>0&&U[u.k]){
  my.push(u);
  if(u.k==='vil'&&!u.ld)vil.push(u);
  else if(!u.ld&&!U[u.k].sh&&u.k!=='scout'&&u.k!=='king'&&u.k!=='cart'&&!u.retreating)arm.push(u);
  if(u.k==='fish'&&!u.ld)fish.push(u);
  if(u.k==='scout'&&!u.ld)scouts.push(u);
  if(u.k==='gal'&&!u.ld)galleys.push(u)
 }
 for(const b of S.bs)if(b&&b.t===t&&b.hp>0){
  bl.push(b);
  if(b.k==='tc'&&b.hp>0&&(!tc||(!tc.done&&b.done)))tc=b
 }
 return {my,vil,arm,fish,scouts,galleys,bl,tc}
}
// Counts deliberately use the same live hostile roster supplied by ai-policy;
// classification thresholds are kept unchanged for formation counters.
function aiHostileComposition(humanArmy){
 return {
  humanCav:humanArmy.filter(u=>CAVARM.has(u.k)).length,
  humanRanged:humanArmy.filter(u=>['arc','xbow','lbow','skirm','mgd','genoa','jan','hcan','conq'].includes(u.k)).length,
  humanSiege:humanArmy.filter(u=>['ram','mang','scor','treb','bomb','cata'].includes(u.k)).length,
  humanInf:humanArmy.filter(u=>['mil','spear','woad','bers','huskarl','jaguar','saml','tk','axe','gbeto'].includes(u.k)).length
 }
}

// The strategic coordinator invokes production after constructing/advancing
// its economy. Keep all queue caps, age-saving and counter-choice decisions
// together; this helper does not own the tick cadence or the entity roster.
function aiPlanMilitaryTraining(t,{my,vil,arm,bl,tc,R,humanArmy,humanShips,navalThreatCount,composition}){
 const {humanCav,humanRanged,humanSiege,humanInf}=composition;
const queuedUnits=k=>aiQueuedUnits(bl,k);
// Feudal→Castle advancement needs 800 food / 200 gold; otherwise
// constant paid soldier training can indefinitely consume the age-up budget.
// Keep normal defense/production while enemies are at the home Town Centre.
const savingCastleAge=S.age[t]===1&&vil.length>=22&&arm.length>=8&&ageRequirements(t).ready&&
 !humanArmy.some(u=>d2(u.x,u.y,tc)<15);
const affordableWhileSaving=k=>!savingCastleAge||
 ((U[k].cost.f||0)===0&&(U[k].cost.g||0)===0)||
 (R.f-(U[k].cost.f||0)>=AG[2].cost.f&&R.g-(U[k].cost.g||0)>=AG[2].cost.g);
for(const b of bl)if(b.done&&b.hp>0&&B[b.k]?.tr&&b.k!=='tc'&&!b.rs&&Array.isArray(b.q)&&b.q.length<2){const o=trOf(b).filter(k=>U[k]&&can(t,U[k].cost)&&affordableWhileSaving(k)&&U[k].age<=S.age[t]&&(k!=='mil'||S.age[t]>0||my.filter(u=>u.k==='mil').length+queuedUnits('mil')<3)&&k!=='trn'&&(k!=='fish'||my.filter(u=>u.k==='fish').length+queuedUnits('fish')<3)&&(k!=='gal'||my.filter(u=>u.k==='gal').length+queuedUnits('gal')<Math.min(12,Math.max(4,2+2*navalThreatCount)))&&(k!=='scout'||my.filter(u=>u.k==='scout').length+queuedUnits('scout')<2)&&(k!=='cart'||(my.filter(u=>u.k==='cart').length+queuedUnits('cart')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='market'&&b2.done&&b2.hp>0&&!isHostile(t,b2.t)&&Math.hypot(b2.x-b.x,b2.y-b.y)>=10)))&&(k!=='cog'||(my.filter(u=>u.k==='cog').length+queuedUnits('cog')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='dock'&&b2.done&&b2.hp>0&&!isHostile(t,b2.t)&&Math.hypot(b2.x-b.x,b2.y-b.y)>=10))));if(o.length){const isDock=b.k==='dock',enemyShips=humanShips.length,counterPlans=isDock?(enemyShips?[{threat:enemyShips,units:['gal']}]:[]):[{threat:humanCav,minimum:2,units:['spear','camel'],own:['spear','camel']},{threat:humanRanged,minimum:3,units:['skirm','knight','cata'],own:['skirm','knight','cata']},{threat:humanSiege,minimum:1,units:['knight','mil','scout'],own:['knight','mil','scout']},{threat:humanInf,minimum:4,units:['mang','scor','arc'],own:['mang','scor','arc']}].filter(p=>p.threat>=p.minimum).map(p=>({...p,score:p.threat-my.filter(u=>p.own.includes(u.k)).length*2})).sort((a,b)=>b.score-a.score);const counterChoices=counterPlans.flatMap(p=>p.units.map(k=>({k,score:p.score,owned:my.filter(u=>u.k===k).length}))).filter(q=>o.includes(q.k)).sort((a,b)=>(b.score-a.score)+(a.owned-b.owned)*4);train(b,counterChoices[0]?.k||pickW(o))}}
}
// Research remains a separate, ordered phase after military queues.
// Preserve the original age-saving gates and technology score comparator.
function aiPlanResearch(t,{my,vil,arm,bl,tc,R,humanShips,composition}){
 const {humanCav,humanRanged,humanSiege,humanInf}=composition;
const techContext={arm,vil,bl,my,humanCav,humanRanged,humanSiege,humanInf,humanShips};
const techPriority=k=>aiTechnologyPriority(k,techContext);
const nextAge=AG[S.age[t]+1],agePrereqs=nextAge&&ageRequirements(t).ready;
const savingForAge=!!(nextAge&&agePrereqs&&vil.length>=10&&!tc.rs&&S.age[t]<3);
for(const b of bl)if(b.done&&b.hp>0&&rsOf(b).length&&!b.rs&&(!Array.isArray(b.q)||!b.q.length)){
 const choices=rsOf(b).filter(k=>{const e=TE[k];if(!e||S.tech[t][k]||bl.some(other=>other.rs&&other.rs.k===k)||e.age>S.age[t]||(e.pre&&!S.tech[t][e.pre])||!can(t,researchCost(b,k)))return false;
 if(savingForAge&&k!=='loom'&&k!=='gath'&&k!=='wheel'&&k!=='axe'&&k!=='saw'){return aiCanResearchWhileSaving(R,researchCost(b,k),nextAge.cost)}
 return true});
 choices.sort((a,b)=>techPriority(b)-techPriority(a));
 if(choices.length)research(b,choices[0])
}
}
function aiTeam(t,dt){if(!S||!Number.isInteger(t)||t<=0||t>=S.teamN||!Number.isFinite(dt)||dt<=0||!S.res?.[t])return;const A=S.ai[t]||(S.ai[t]={cd:1,wave:0,nx:0,kn:new Set()});A.cd-=dt;if(A.cd>0)return;A.cd=([4.5,3.2,2.4,1.8,1.35,1.05][diff])*(1+(t-1)*.05);const R=S.res[t],{my,vil,arm,fish,scouts,galleys,bl,tc}=aiTeamRoster(t);if(!tc)return;
const {hostileFleet,hostileShips,humanArmy,humanShips,navalThreatCount}=aiClassifyHostileForces(t);
aiShareResources(t,A,R);
aiRetreat(t,my,tc,bl);
aiTradeEscorts(A,my,arm,galleys,hostileFleet,humanArmy);
aiManageFleetRepairs(t,my);
const cnt=k=>bl.filter(b=>b.k===k&&b.hp>0).length;
if(popOf(t)+5>capOf(t)&&bl.filter(b=>b.k==='house'&&b.hp>0&&!b.done).length<1+(vil.length>=18)+(vil.length>=28))aiBuild(vil,'house',t);
if(tc.done&&!tc.rs&&Array.isArray(tc.q)&&!aiTownTechReady(t,tc,vil.length)&&vil.length+tc.q.filter(q=>q&&q.k==='vil').length<([12,18,26,32,38,44][diff]*PERS[aip].v|0)&&tc.q.length<2&&!aiSavingAgeFood(t,vil.length))train(tc,'vil');
if(S.age[t]>=1&&vil.length>=6&&!cnt('bar'))aiBuild(vil,'bar',t);

if(S.age[t]>=1&&!cnt('market')&&vil.length>=14&&arm.length>=6)aiBuild(vil,'market',t);
if(S.age[t]>=1&&vil.length>=12&&bl.filter(b=>b.k==='wall'&&b.hp>0).length<PERS[aip].wl&&(cnt('tower')>=Math.min(PERS[aip].tw,2)||R.s>=130))aiWall(vil,tc,t);
if(S.age[t]>=1&&vil.length>=9&&!cnt('dock')&&(arm.length>=6||navalThreatCount>0)&&(navalThreatCount>0||S.nodes.some(n=>n.fi&&Math.hypot(n.x-tc.x,n.y-tc.y)<24)))aiDock(vil,tc,t);
aiManageFishingShips(fish,hostileFleet,R);
aiScoutIdleUnits(scouts);
aiDisengageDamagedWarships(my,hostileFleet);
aiAssignWarshipTargets(t,tc,galleys,hostileShips);
if(vil.length>=7&&S.bs.filter(b=>b.t===t&&b.k==='bar'&&b.hp>0).length<1+(arm.length>=8)+(arm.length>=16))aiBuild(vil,'bar',t);else if(cnt('bar')&&vil.length>=10&&cnt('rng')<1+(arm.length>=12)&&(arm.length>=4))aiBuild(vil,'rng',t);if(vil.length>=6&&cnt('lumber')<1+(S.t>600)+(S.t>1200)+(S.t>1800))aiNear(vil,'lumber',['w'],t);else if(vil.length>=8&&cnt('mill')<1+(S.t>900)+(S.t>1800))aiNear(vil,'mill',['f'],t);else if(vil.length>=11&&cnt('mine')<1+(S.t>600)+(S.t>1200)+(S.t>1800))aiNear(vil,'mine',['g','s'],t);
else if(cnt('rng')&&S.age[t]>=1&&vil.length>=12&&!cnt('stable')&&(arm.length>=4))aiBuild(vil,'stable',t);else if(cnt('bar')&&S.age[t]>=1&&vil.length>=12&&!cnt('smith')&&(arm.length>=4))aiBuild(vil,'smith',t);else if(S.age[t]>=1&&cnt('tower')<PERS[aip].tw&&vil.length>=12)aiBuild(vil,'tower',t);else if(S.age[t]>=2&&!cnt('castle')&&vil.length>=14)aiBuild(vil,'castle',t);else if(S.age[t]>=2&&!cnt('monastery')&&vil.length>=14)aiBuild(vil,'monastery',t);else if(S.age[t]>=2&&!cnt('siege')&&vil.length>=16)aiBuild(vil,'siege',t);else if(S.age[t]>=2&&!cnt('univ')&&cnt('smith')&&vil.length>=18)aiBuild(vil,'univ',t);else if(vm===1&&S.age[t]>=3&&!cnt('wonder')&&vil.length>=20)aiBuild(vil,'wonder',t);else if(S.age[t]>=1&&!cnt('market')&&vil.length>=14)aiBuild(vil,'market',t);
if(S.age[t]>=1&&S.t>420&&vil.length>=12&&cnt('tower')<PERS[aip].tw&&can(t,B.tower.cost))aiBuild(vil,'tower',t);
if(PERS[aip].cv&&S.age[t]>=1&&cnt('bar')&&!cnt('stable')&&vil.length>=10&&(arm.length>=4||R.w>=B.stable.cost.w+100)&&can(t,B.stable.cost))aiBuild(vil,'stable',t);
if(PERS[aip].rg&&cnt('bar')&&cnt('rng')<2&&vil.length>=10&&(arm.length>=4||R.w>=B.rng.cost.w+100)&&can(t,B.rng.cost))aiBuild(vil,'rng',t);
{const g=AG[S.age[t]+1];if(g&&!tc.rs&&vil.length>=8){
 const gate=ageRequirements(t);
 if(gate.ready){if(can(t,g.cost))research(tc,'age')}
 else if(vil.length>=10&&!bl.some(x=>!x.done&&x.hp>0&&g.needs.includes(x.k))){
  // Finish the two distinct current-age buildings needed for advancement.
  // Do not keep adding duplicates while a prerequisite is under construction.
  const options=[...new Set(g.needs)].filter(k=>B[k]&&(B[k].age||0)===S.age[t]&&!bl.some(x=>x.k===k&&x.hp>0)&&can(t,B[k].cost)).sort((a,b)=>Object.values(B[a].cost).reduce((n,v)=>n+v,0)-Object.values(B[b].cost).reduce((n,v)=>n+v,0));
  if(options.length)aiBuild(vil,options[0],t)
 }
}}
const composition=aiHostileComposition(humanArmy);
aiPlanMilitaryTraining(t,{my,vil,arm,bl,tc,R,humanArmy,humanShips,navalThreatCount,composition});
aiPlanResearch(t,{my,vil,arm,bl,tc,R,humanShips,composition});
aiRepairImportantBuildings(t,A,bl,vil);
aiAssignIdleVillagers(t,vil,bl,arm,tc,R,cnt);
/* Reuse a single live hostile threat roster for villager evacuation, base defence and allied relief. */
const nearbyRaiders=S.us.filter(e=>e&&e.hp>0&&!e.ld&&Number.isInteger(e.t)&&isHostile(t,e.t)&&U[e.k]?.dmg>3&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<W&&e.y<H);
aiEvacuateVillagers(vil,bl,nearbyRaiders);
aiRebal(vil,R,t);
aiDefendTownCentre(A,tc,arm,vil,my,nearbyRaiders);
aiRelieveAlliedBases(t,A,arm,nearbyRaiders);
aiDefendEconomicSites(t,A,arm,bl,nearbyRaiders);
aiManageMarketTrade(t,A,bl,R);
aiAdvanceStagedWave(t,A,tc);
aiRememberEnemySites(t,A,my);
aiResumeIdleWave(t,A);
aiMaintainAttackWave(A,tc,diff);
aiManageEconomicRaids(t,A,arm,tc,diff,aip);
aiLaunchOffensiveWave(t,A,arm,tc,diff,aip,vm);
}
