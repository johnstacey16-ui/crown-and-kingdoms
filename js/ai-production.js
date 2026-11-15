/* AI production: paid units, technology and Town Centre growth.
 * Classic browser script with shared game state. Loaded before ai.js.
 * Behaviour and numeric thresholds are carried verbatim from ai.js.
 */
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
for(const b of bl)if(b.done&&b.hp>0&&B[b.k]?.tr&&b.k!=='tc'&&!b.rs&&Array.isArray(b.q)&&b.q.length<2){const o=trOf(b).filter(k=>U[k]&&can(t,typeof unitTrainingCost==='function'?unitTrainingCost(t,k):U[k].cost)&&unitTrainingUnlock(b,k,S).state==='available'&&affordableWhileSaving(k)&&(typeof unitEffectiveAge==='function'?unitEffectiveAge(t,k):U[k].age)<=S.age[t]&&(k!=='mil'||S.age[t]>0||my.filter(u=>u.k==='mil').length+queuedUnits('mil')<3)&&k!=='trn'&&(k!=='fish'||my.filter(u=>u.k==='fish').length+queuedUnits('fish')<3)&&(k!=='gal'||my.filter(u=>u.k==='gal').length+queuedUnits('gal')<Math.min(12,Math.max(4,2+2*navalThreatCount)))&&(k!=='fire'||my.filter(u=>u.k==='fire').length+queuedUnits('fire')<Math.min(8,Math.max(3,2+navalThreatCount)))&&(k!=='demo'||my.filter(u=>u.k==='demo').length+queuedUnits('demo')<3)&&(k!=='cgal'||my.filter(u=>u.k==='cgal').length+queuedUnits('cgal')<4)&&(k!=='scout'||my.filter(u=>u.k==='scout').length+queuedUnits('scout')<2)&&(k!=='cart'||(my.filter(u=>u.k==='cart').length+queuedUnits('cart')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='market'&&b2.done&&b2.hp>0&&!isHostile(t,b2.t)&&Math.hypot(b2.x-b.x,b2.y-b.y)>=10)))&&(k!=='cog'||(my.filter(u=>u.k==='cog').length+queuedUnits('cog')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='dock'&&b2.done&&b2.hp>0&&!isHostile(t,b2.t)&&Math.hypot(b2.x-b.x,b2.y-b.y)>=10))));if(o.length){const isDock=b.k==='dock',enemyShips=humanShips.length,counterPlans=isDock?(enemyShips?[{threat:enemyShips,units:['gal']}]:[]):[{threat:humanCav,minimum:2,units:['spear','camel'],own:['spear','camel']},{threat:humanRanged,minimum:3,units:['skirm','knight','cata'],own:['skirm','knight','cata']},{threat:humanSiege,minimum:1,units:['knight','mil','scout'],own:['knight','mil','scout']},{threat:humanInf,minimum:4,units:['mang','scor','arc'],own:['mang','scor','arc']}].filter(p=>p.threat>=p.minimum).map(p=>({...p,score:p.threat-my.filter(u=>p.own.includes(u.k)).length*2})).sort((a,b)=>b.score-a.score);const counterChoices=counterPlans.flatMap(p=>p.units.map(k=>({k,score:p.score,owned:my.filter(u=>u.k===k).length}))).filter(q=>o.includes(q.k)).sort((a,b)=>(b.score-a.score)+(a.owned-b.owned)*4);const fireCounter=isDock&&enemyShips>0&&o.includes('fire')&&humanShips.some(u=>u.k==='gal')&&my.filter(u=>u.k==='fire').length+queuedUnits('fire')<Math.min(6,enemyShips*2);const demoCounter=isDock&&enemyShips>=4&&o.includes('demo')&&my.some(u=>u.k==='fire')&&my.filter(u=>u.k==='demo').length+queuedUnits('demo')<2;const cannonPlan=isDock&&S.age[t]>=3&&S.tech[t]?.chem&&o.includes('cgal')&&aiCoastalSiegeTargets(t).length>0&&my.some(u=>u.k==='gal'||u.k==='fire')&&my.filter(u=>u.k==='cgal').length+queuedUnits('cgal')<Math.min(4,1+Math.floor(my.filter(u=>u.k==='gal'||u.k==='fire').length/3));train(b,cannonPlan?'cgal':demoCounter?'demo':fireCounter?'fire':counterChoices[0]?.k||pickW(o))}}
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
 const choices=rsOf(b).filter(k=>{const e=TE[k];if((k==='pala'&&arm.filter(u=>u.k==='knight').length<4)||(k==='huss'&&arm.filter(u=>u.k==='scout').length<4))return false;if(!e||S.tech[t][k]||bl.some(other=>other.rs&&other.rs.k===k)||researchEffectiveAge(b,k,S.civ)>S.age[t]||(e.pre&&!S.tech[t][e.pre])||!can(t,researchCost(b,k)))return false;
 if(savingForAge&&k!=='loom'&&k!=='gath'&&k!=='wheel'&&k!=='axe'&&k!=='saw'){return aiCanResearchWhileSaving(R,researchCost(b,k),nextAge.cost)}
 return true});
 choices.sort((a,b)=>techPriority(b)-techPriority(a));
 if(choices.length)research(b,choices[0])
}
}
// Allow one paid economic expansion in Castle Age and a third in Imperial.
// Town Centres still obey real building costs, available builders and terrain.
function aiTownCentreLimit(age,seconds,workers,mode){
 if(mode===6||age<2||seconds<900||workers<24)return 1;
 return age>=3&&seconds>=1500&&workers>=36?3:2;
}
// Count queued villagers across *all* completed centres before scheduling.
// Secondary centres may grow the economy in parallel while the primary saves
// space for essential Town Centre research and age advancement.
function aiTrainTownVillagers(t,vil,bl,tc){
 if(aiSavingAgeFood(t,vil.length))return 0;
 const centres=bl.filter(b=>b&&b.t===t&&b.k==='tc'&&b.done&&b.hp>0&&Array.isArray(b.q));
 if(!centres.length)return 0;
 const base=([12,18,26,32,38,44][diff]*PERS[aip].v|0);
 const goal=Math.min(60,Math.max(base,S.age[t]>=2?24:0)+
  (centres.length>=2?12:0)+(centres.length>=3?12:0));
 let total=vil.length+centres.reduce((n,b)=>n+b.q.filter(q=>q&&q.k==='vil').length,0);
 let trained=0;
 for(const centre of centres){
  if(total>=goal||!can(t,U.vil.cost))break;
  if(centre.rs||centre.q.length>=2)continue;
  if(centre===tc&&aiTownTechReady(t,tc,vil.length))continue;
  if(train(centre,'vil')){total++;trained++}
 }
 return trained;
}
