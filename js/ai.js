/* Crown & Kingdoms — economic, defensive, and naval AI. Loaded after simulation.js. */
/* ===== ENEMY AI (same rules as player; no resource or damage bonuses) ===== */
function ai(dt){if(!Number.isFinite(dt)||dt<=0)return;for(let t=1;t<S.teamN;t++)if(!Array.isArray(S.humanTeams)||!S.humanTeams.includes(t))aiTeam(t,dt)}
function aiTeam(t,dt){if(!S||!Number.isInteger(t)||t<=0||t>=S.teamN||!Number.isFinite(dt)||dt<=0||!S.res?.[t])return;const A=S.ai[t]||(S.ai[t]={cd:1,wave:0,nx:0,kn:new Set()});A.cd-=dt;if(A.cd>0)return;A.cd=([4.5,3.2,2.4,1.8,1.35,1.05][diff])*(1+(t-1)*.05);const R=S.res[t],my=[],vil=[],arm=[],fish=[],scouts=[],galleys=[],bl=[];let tc=null;for(const u of S.us)if(u&&u.t===t&&u.hp>0&&U[u.k]){my.push(u);if(u.k==='vil'&&!u.ld)vil.push(u);else if(!u.ld&&!U[u.k].sh&&u.k!=='scout'&&u.k!=='king'&&u.k!=='cart'&&!u.retreating)arm.push(u);if(u.k==='fish'&&!u.ld)fish.push(u);if(u.k==='scout'&&!u.ld)scouts.push(u);if(u.k==='gal'&&!u.ld)galleys.push(u)}for(const b of S.bs)if(b&&b.t===t&&b.hp>0){bl.push(b);if(b.k==='tc'&&b.hp>0&&(!tc||(!tc.done&&b.done)))tc=b}if(!tc)return;
const hostileFleet=[],hostileShips=[],humanArmy=[],humanShips=[];let navalThreatCount=0;for(const e of S.us){if(!e||!Number.isInteger(e.t)||!isHostile(t,e.t)||e.hp<=0||!U[e.k])continue;if(!e.ld&&!U[e.k].sh)humanArmy.push(e);if(U[e.k].sh){if(!e.ld&&e.k!=='fish')hostileShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4)humanShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4){navalThreatCount++;hostileFleet.push(e)}}}
aiShareResources(t,A,R);
aiRetreat(t,my,tc,bl);
// Return merchant escorts to the army after danger has passed.
for(const guard of my.filter(u=>u.o==='G'&&u.tg&&(u.tg.k==='cart'||u.tg.k==='cog'))){
 const merchant=guard.tg,hostiles=merchant.k==='cog'?hostileFleet:humanArmy;
 if(guard.hp<=0||guard.ld||guard.retreating||merchant.hp<=0||merchant.ld||(S.t>=(guard.tradeEscortUntil||0)&&!hostiles.some(e=>e.hp>0&&!e.ld&&U[e.k]?.dmg>0&&Math.hypot(e.x-merchant.x,e.y-merchant.y)<18))){guard.o='i';guard.tg=null;guard.p=[];guard.rp=0;guard.tradeEscortUntil=0}
}
// Protect exposed trade carts with available infantry or cavalry.
for(const merchant of my.filter(u=>u.k==='cart'&&!u.ld&&u.hp>0)){
 if(!humanArmy.some(e=>e.hp>0&&!e.ld&&U[e.k]?.dmg>0&&Math.hypot(e.x-merchant.x,e.y-merchant.y)<11))continue;
 if(arm.some(g=>g.o==='G'&&g.tg===merchant&&g.hp>0&&!g.ld&&!g.retreating))continue;
 const guards=arm.filter(g=>g.hp>mhp(g)*.5&&!g.ld&&!g.retreating&&!(A.wu||[]).includes(g)&&g.k!=='mon'&&!['ram','mang','scor','treb','bomb'].includes(g.k)&&(g.o==='i'||g.o==='m'&&!g.tg)&&Math.hypot(g.x-merchant.x,g.y-merchant.y)<15).sort((a,b)=>Math.hypot(a.x-merchant.x,a.y-merchant.y)-Math.hypot(b.x-merchant.x,b.y-merchant.y));
 for(const guard of guards.slice(0,5)){const route=path(guard,goalNear(merchant,2));if(!route)continue;guard.o='G';guard.tg=merchant;guard.p=route;guard.rp=1;guard.tradeEscortUntil=S.t+20;break}
}
// Assign nearby idle warships to protect merchant cogs threatened by enemy fleets.
for(const merchant of my.filter(u=>u.k==='cog'&&!u.ld&&u.hp>0)){
 if(!hostileFleet.some(e=>e.hp>0&&!e.ld&&Math.hypot(e.x-merchant.x,e.y-merchant.y)<13))continue;
 if(galleys.some(g=>g.o==='G'&&g.tg===merchant&&g.hp>0&&!g.ld&&!g.retreating))continue;
 const escorts=galleys.filter(g=>g.hp>mhp(g)*.45&&!g.ld&&!g.retreating&&!(A.wu||[]).includes(g)&&(g.o==='i'||g.o==='m'&&!g.tg)&&Math.hypot(g.x-merchant.x,g.y-merchant.y)<20).sort((a,b)=>Math.hypot(a.x-merchant.x,a.y-merchant.y)-Math.hypot(b.x-merchant.x,b.y-merchant.y));
 for(const escort of escorts.slice(0,3)){const route=path(escort,goalNear(merchant,2));if(!route)continue;escort.o='G';escort.tg=merchant;escort.p=route;escort.rp=1;escort.tradeEscortUntil=S.t+20;break}
}
const damagedFleet=my.filter(u=>u.sh&&!u.ld&&u.hp>0&&u.hp<mhp(u)*.55&&u.o!=='rep').sort((a,b)=>(['fish','cog','trn'].includes(a.k)?1:0)-(['fish','cog','trn'].includes(b.k)?1:0)||a.hp/mhp(a)-b.hp/mhp(b));
if(damagedFleet.length&&!my.some(u=>u.sh&&u.o==='rep')){
 const target=damagedFleet[0],underFire=S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&U[e.k]?.sh&&Math.hypot(e.x-target.x,e.y-target.y)<10);
 if(!underFire){
  const repairer=my.find(u=>u!==target&&u.sh&&!u.ld&&u.hp>mhp(u)*.7&&u.o==='i'&&!['fish','trn','cog'].includes(u.k));
  if(repairer){repairer.o='rep';repairer.tg=target;repairer.p=[]}
 }
}
const cnt=k=>bl.filter(b=>b.k===k&&b.hp>0).length;
if(popOf(t)+5>capOf(t)&&bl.filter(b=>b.k==='house'&&b.hp>0&&!b.done).length<1+(vil.length>=18)+(vil.length>=28))aiBuild(vil,'house',t);
if(tc.done&&!tc.rs&&Array.isArray(tc.q)&&!aiTownTechReady(t,tc,vil.length)&&vil.length+tc.q.filter(q=>q&&q.k==='vil').length<([12,18,26,32,38,44][diff]*PERS[aip].v|0)&&tc.q.length<2&&!aiSavingAgeFood(t,vil.length))train(tc,'vil');
if(S.age[t]>=1&&vil.length>=6&&!cnt('bar'))aiBuild(vil,'bar',t);

if(S.age[t]>=1&&!cnt('market')&&vil.length>=14&&arm.length>=6)aiBuild(vil,'market',t);
if(S.age[t]>=1&&vil.length>=12&&bl.filter(b=>b.k==='wall'&&b.hp>0).length<PERS[aip].wl&&(cnt('tower')>=Math.min(PERS[aip].tw,2)||R.s>=130))aiWall(vil,tc,t);
if(S.age[t]>=1&&vil.length>=9&&!cnt('dock')&&(arm.length>=6||navalThreatCount>0)&&(navalThreatCount>0||S.nodes.some(n=>n.fi&&Math.hypot(n.x-tc.x,n.y-tc.y)<24)))aiDock(vil,tc,t);
/* Fishing ships break off and seek open water when hostile combat ships close in; they resume fishing after the threat passes. */
for(const s of fish.filter(u=>u.hp>0)){
 let threat=null;for(const e of hostileFleet){const d=Math.hypot(e.x-s.x,e.y-s.y);if(!threat||d<threat.d)threat={e,d}}
 if((!threat||threat.d>14)&&s.fleeUntil)s.fleeUntil=0;
 if(threat&&threat.d<10&&S.t>=(s.fleeUntil||0)){
  const dx=s.x-threat.e.x,dy=s.y-threat.e.y,angle=Math.atan2(dy,dx),spots=[];
  for(let r=7;r<=15;r+=2)for(let a=0;a<16;a++){
   const ang=angle+(a/16)*Math.PI*2,x=Math.round(s.x+Math.cos(ang)*r),y=Math.round(s.y+Math.sin(ang)*r);
   if(x<1||y<1||x>=W-1||y>=H-1)continue;
   const ix=y*W+x;
   if(S.wt[ix]!==1||S.nd[ix])continue;
   let danger=30;for(const e of hostileFleet)danger=Math.min(danger,Math.hypot(e.x-(x+.5),e.y-(y+.5)));
   spots.push({x,y,score:danger-Math.hypot(x-s.x,y-s.y)*.18+(S.ex[ix]?0.15:0)});
  }
  spots.sort((a,b)=>b.score-a.score);
  let route=null;for(const spot of spots.slice(0,8)){route=path(s,gp(spot.x+.5,spot.y+.5,1.2));if(route&&route.length)break;route=null}
  if(route){s.o='m';s.tg=null;s.p=route;s.fleeUntil=S.t+10}
 }
}
for(const s of fish.filter(u=>u.o==='i'&&S.t>=Math.max(u.fleeUntil||0,u.nextFishingRoute||0))){s.nextFishingRoute=S.t+8;let target=null,route=null;const candidates=S.nodes.filter(n=>n.k==='f'&&n.fi&&n.amt>0&&(!n.trap||n.t===s.t)&&Math.hypot(n.x-s.x,n.y-s.y)<32).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));for(const n of candidates.slice(0,12)){const p=path(s,goalNear(n,1));if(p){target=n;route=p;break}}if(!target&&R.w>=100&&S.t>=(s.nextFishTrapAt||0)){s.nextFishTrapAt=S.t+45;deployFishTrap([s]);for(const n of S.nodes.filter(n=>n.k==='f'&&n.fi&&n.amt>0&&(!n.trap||n.t===s.t)&&Math.hypot(n.x-s.x,n.y-s.y)<32).slice(-8)){const p=path(s,goalNear(n,1));if(p){target=n;route=p;break}}}if(target){s.o='g';s.tg=target;s.ct='f';s.p=route;s.rp=1;s.ret=0}}
for(const s of scouts.filter(u=>u.o==='i'&&S.t>=(u.nextScoutRoute||0))){s.nextScoutRoute=S.t+8;for(let attempt=0;attempt<4;attempt++){const x=2+S.r()*(W-4),y=2+S.r()*(H-4);if(Math.hypot(x-s.x,y-s.y)<10||Math.hypot(x-(s.lastScoutX??s.x),y-(s.lastScoutY??s.y))<12)continue;const p=path(s,gp(x,y,2.5));if(p){s.o='m';s.p=p;s.rp=1;s.lastScoutX=x;s.lastScoutY=y;break}}}
{
/* Wounded warships disengage to reachable open water instead of fighting to destruction. */
for(const ship of my.filter(u=>u&&U[u.k]?.sh&&!['fish','trn','cog'].includes(u.k)&&U[u.k].dmg>=4&&!u.ld&&u.hp>0&&u.hp/mhp(u)<.32&&(u.o==='a'||u.o==='i'||(u.o==='m'&&u.tg)))){
 if(S.t<(ship.navalFallbackUntil||0))continue;
 let threat=null;for(const e of hostileFleet){const d=Math.hypot(e.x-ship.x,e.y-ship.y);if(!threat||d<threat.d)threat={e,d}}
 if(!threat||threat.d>18)continue;
 const dx=ship.x-threat.e.x,dy=ship.y-threat.e.y,angle=Math.atan2(dy,dx),spots=[];
 for(let r=8;r<=16;r+=2)for(let a=0;a<12;a++){
  const ang=angle+(a/12)*Math.PI*2,x=Math.round(ship.x+Math.cos(ang)*r),y=Math.round(ship.y+Math.sin(ang)*r);
  if(x<1||y<1||x>=W-1||y>=H-1)continue;
  const ix=y*W+x;if(S.wt[ix]!==1||S.nd[ix])continue;
  let clearance=30;for(const e of hostileFleet)clearance=Math.min(clearance,Math.hypot(e.x-(x+.5),e.y-(y+.5)));
  spots.push({x,y,score:clearance-Math.hypot(x-ship.x,y-ship.y)*.12});
 }
 spots.sort((a,b)=>b.score-a.score);
 let escape=null;for(const spot of spots.slice(0,6)){escape=path(ship,gp(spot.x+.5,spot.y+.5,1.2));if(escape&&escape.length)break;escape=null}
 if(escape){ship.o='m';ship.tg=null;ship.p=escape;ship.rp=1;ship.navalFallbackUntil=S.t+20}
}
const ptc=S.bs.filter(b=>isHostile(t,b.t)&&b.k==='tc'&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y))[0],focusCounts=new Map();for(const u of galleys)if(u.o==='a'&&u.tg)focusCounts.set(u.tg,(focusCounts.get(u.tg)||0)+1);for(const ship of galleys.filter(u=>(u.o==='i'||(u.o==='m'&&!u.tg)||(u.o==='a'&&(!u.tg||u.tg.hp<=0||u.tg.ld||!isHostile(t,u.tg.t))))&&(u.hp/mhp(u)>=.32||S.t>=(u.navalFallbackUntil||0)))){const navalTargetScore=e=>Math.hypot(e.x-ship.x,e.y-ship.y)-(e.k==='gal'?6:0)+(U[e.k].dmg>=4?0:10)-Math.min(3,focusCounts.get(e)||0)*4;let enemy=null;const navalCandidates=S.t>=(ship.nextNavalTargetAt||0)?hostileShips.filter(e=>Math.hypot(e.x-ship.x,e.y-ship.y)<28).sort((a,b)=>navalTargetScore(a)-navalTargetScore(b)):[];for(const candidate of navalCandidates.slice(0,6))if(path(ship,goalNear(candidate,Math.max(1,attackRange(ship))))){enemy=candidate;break}if(!enemy&&navalCandidates.length)ship.nextNavalTargetAt=S.t+8;if(enemy){ship.o='a';ship.tg=enemy;ship.p=[];focusCounts.set(enemy,(focusCounts.get(enemy)||0)+1);continue}if(!ptc)continue;const cx=ptc.x+ptc.s/2,cy=ptc.y+ptc.s/2;if(Math.hypot(ship.x-cx,ship.y-cy)<17)continue;if(S.t<(ship.nextNavalPatrol||0))continue;ship.nextNavalPatrol=S.t+12;const p=path(ship,gp(cx,cy,17));if(p&&p.length>1){ship.o='m';ship.p=p;ship.rp=1}}}
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
const humanCav=humanArmy.filter(u=>CAVARM.has(u.k)).length,humanRanged=humanArmy.filter(u=>['arc','xbow','lbow','skirm','mgd','genoa','jan','hcan','conq'].includes(u.k)).length,humanSiege=humanArmy.filter(u=>['ram','mang','scor','treb','bomb','cata'].includes(u.k)).length,humanInf=humanArmy.filter(u=>['mil','spear','woad','bers','huskarl','jaguar','saml','tk','axe','gbeto'].includes(u.k)).length;
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
const techPriority=k=>{
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
};
const nextAge=AG[S.age[t]+1],agePrereqs=nextAge&&ageRequirements(t).ready;
const savingForAge=!!(nextAge&&agePrereqs&&vil.length>=10&&!tc.rs&&S.age[t]<3);
for(const b of bl)if(b.done&&b.hp>0&&rsOf(b).length&&!b.rs&&(!Array.isArray(b.q)||!b.q.length)){
 const choices=rsOf(b).filter(k=>{const e=TE[k];if(!e||S.tech[t][k]||bl.some(other=>other.rs&&other.rs.k===k)||e.age>S.age[t]||(e.pre&&!S.tech[t][e.pre])||!can(t,researchCost(b,k)))return false;
 if(savingForAge&&k!=='loom'&&k!=='gath'&&k!=='wheel'&&k!=='axe'&&k!=='saw'){return aiCanResearchWhileSaving(R,researchCost(b,k),nextAge.cost)}
 return true});
 choices.sort((a,b)=>techPriority(b)-techPriority(a));
 if(choices.length)research(b,choices[0])
}
const wk=k=>vil.filter(u=>u.o==='g'&&u.ct===k&&!u.aiEvac&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H).length;
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
for(const v of vil)if(v.o==='i'&&v.hp>0&&!v.ld&&!v.aiEvac&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.y>=0&&v.x<W&&v.y<H){let buildRoute=null,buildChecks=0;const ub=bl.find(b=>{if(b.done||b.hp<=0||vil.some(u=>u.o==='b'&&u.tg===b))return false;if(++buildChecks>8)return false;buildRoute=path(v,goalNear(b,1));return !!buildRoute});if(ub){v.o='b';v.tg=ub;v.p=buildRoute;v.rp=1;continue}const nv=vil.length;let k=wk('f')<(S.age[t]>=1&&arm.length<6?Math.max(8,nv*.45|0):Math.max(5,nv*.32|0))?'f':wk('w')<Math.max(6,nv*.3|0)?'w':wk('g')<Math.max(3,nv*.2|0)?'g':wk('s')<Math.max(2,nv*.1|0)&&S.age[t]>=1?'s':'f',n=findNode(v,k,36);
if(k==='f'&&can(t,B.farm.cost)&&R.w>=B.farm.cost.w+((S.age[t]>=1&&cnt('bar')&&arm.length<6)?50:0)&&(!n||S.nodes.filter(m=>m.fm&&m.amt>0&&Math.hypot(m.x-tc.x,m.y-tc.y)<12).length<Math.max(4,nv*.25|0)))for(let i=0,pf=0;i<20&&!pf;i++){const x=(tc.x+1+(S.r()-.5)*14)|0,y=(tc.y+1+(S.r()-.5)*14)|0;if(Math.hypot(x-tc.x,y-tc.y)>3&&!cor(tc,x,y)&&okPlace(t,'farm',x,y)&&path(v,gp(x+.5,y+.5,1.5))){const farm=addN('f',x,y,farmFood(t),1);if(!farm)continue;pay(t,B.farm.cost);farm.t=t;n=farm;pf=1}}
if(!n){for(const fallback of ['w','f','g','s']){if(fallback===k)continue;const candidate=findNode(v,fallback,30);if(candidate){k=fallback;n=candidate;break}}}if(n){let route=path(v,goalNear(n,1));if(!route){const alternatives=S.nodes.filter(alternative=>alternative&&alternative!==n&&alternative.amt>0&&!alternative.an&&!alternative.fi&&['f','w','g','s'].includes(alternative.k)&&Number.isInteger(alternative.x)&&Number.isInteger(alternative.y)&&alternative.x>=0&&alternative.y>=0&&alternative.x<W&&alternative.y<H&&S.wt[alternative.y*W+alternative.x]!==1&&Math.hypot(alternative.x-v.x,alternative.y-v.y)<=36).sort((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)-Math.hypot(b.x-v.x,b.y-v.y));for(const alternative of alternatives.slice(0,12)){const candidate=path(v,goalNear(alternative,1));if(candidate){n=alternative;route=candidate;break}}}if(route){v.o='g';v.tg=n;v.ct=n.k;v.p=route;v.rp=1;v.ret=0}}}
/* Reuse a single live hostile threat roster for villager evacuation, base defence and allied relief. */
const nearbyRaiders=S.us.filter(e=>e&&e.hp>0&&!e.ld&&Number.isInteger(e.t)&&isHostile(t,e.t)&&U[e.k]?.dmg>3&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<W&&e.y<H);
/* Villagers evacuate from nearby raiders, then resume their previous work once they reach safety. */
for(const v of vil){
 if(v.hp<=0||v.ld||v.o==='B'||!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<0||v.y<0||v.x>=W||v.y>=H)continue;
 /* Single-pass nearest-raider scan avoids filter/map/sort allocations for every villager. */
 let threat=null;
 for(const e of nearbyRaiders){const d=Math.hypot(e.x-v.x,e.y-v.y);if(!threat||d<threat.d)threat={e,d}}
 if(v.aiEvac){
  const ev=v.aiEvac,near=threat&&threat.d<7,safe=ev.shelter&&ev.shelter.hp>0&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))<3;
  if(!near&&(safe||S.t>=ev.until||ev.shelter&&ev.shelter.hp<=0)){
   const target=ev.tg,valid=target&&(target.s?target.hp>0:target.amt>0);
   v.o=valid?ev.o:'i';v.tg=valid?target:null;v.ct=ev.ct||v.ct;v.p=[];v.rp=0;v.aiEvac=null;if(valid&&(v.o==='g'||v.o==='b'||v.o==='rep')){const route=path(v,goalNear(target,1));if(route){v.p=route;v.rp=1}else{v.o='i';v.tg=null}}
  }else if(near&&ev.shelter&&ev.shelter.hp>0&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))>3&&(!v.p||!v.p.length)){
   const route=path(v,goalNear(ev.shelter,1));if(route){v.o='m';v.tg=ev.shelter;v.p=route;v.rp=1}
  }
  continue;
 }
 if(!threat||threat.d>5.5||v.o==='B')continue;
 const shelters=bl.filter(b=>b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle'))
  .sort((a,b)=>Math.hypot(v.x-(a.x+a.s/2),v.y-(a.y+a.s/2))-Math.hypot(v.x-(b.x+b.s/2),v.y-(b.y+b.s/2)));
 let shelter=null,route=null;
 for(const b of shelters){const p=path(v,goalNear(b,1));if(p){shelter=b;route=p;break}}
 if(!shelter){
  const dx=v.x-threat.e.x,dy=v.y-threat.e.y,len=Math.max(.01,Math.hypot(dx,dy)),x=Math.max(1,Math.min(W-2,Math.round(v.x+dx/len*7))),y=Math.max(1,Math.min(H-2,Math.round(v.y+dy/len*7)));
  route=path(v,gp(x,y,1.2));if(route){v.aiEvac={o:v.o,tg:v.tg,ct:v.ct,shelter:null,until:S.t+8};v.o='m';v.tg=null;v.p=route;v.rp=1}
  continue;
 }
 v.aiEvac={o:v.o,tg:v.tg,ct:v.ct,shelter,until:S.t+18};v.o='m';v.tg=shelter;v.p=route;v.rp=1;
}
aiRebal(vil,R,t);{let thr=false,intr=null,best=Infinity;for(const e of nearbyRaiders){const d=Math.hypot(e.x-tc.x,e.y-tc.y);if(d<12)thr=true;if(d<13){const score=d-(['ram','mang','scor','treb','bomb'].includes(e.k)?8:0);if(score<best){best=score;intr=e}}}if(thr){if(intr)for(const d of arm)if(d.o==='i'&&U[d.k]?.dmg>0&&Math.hypot(d.x-tc.x,d.y-tc.y)<18){d.o='a';d.tg=intr;d.p=[]}for(const v of vil.concat(my.filter(u=>u.k==='king')))if(v.o!=='B'&&!v.ld&&Math.hypot(v.x-tc.x,v.y-tc.y)<16&&(tc.cg||[]).length<15){v.o='B';v.tg=tc;v.p=[]}A.gu=S.t}else if(tc.cg&&tc.cg.length&&S.t-(A.gu||0)>15)unload(tc)}
/* Allied AI kingdoms now send a limited relief detachment to threatened allied Town Centres and Castles. */
const alliedBases=S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.hp>0&&b.done&&['tc','castle','tower','market','mill','lumber','mine','dock'].includes(b.k));
let distress=null;
for(const base of alliedBases){
 const intruder=aiBaseDefenceThreat(nearbyRaiders,base);
 if(intruder){distress={base,enemy:intruder};break}
}
if(distress&&S.t-(A.lastAllyHelp??-99)>=6){
 const responders=arm.filter(u=>u.o==='i'&&!u.retreating&&!u.ld&&U[u.k]?.dmg>0&&u.k!=='mon'&&Math.hypot(u.x-(distress.base.x+distress.base.s/2),u.y-(distress.base.y+distress.base.s/2))<32)
  .sort((a,b)=>Math.hypot(a.x-distress.base.x,a.y-distress.base.y)-Math.hypot(b.x-distress.base.x,b.y-distress.base.y)).slice(0,8);
 for(const u of responders){u.o='a';u.tg=distress.enemy;u.p=[]}
 if(responders.length)A.lastAllyHelp=S.t;
}
/* Local anti-raid response: defend remote economic sites without pulling the entire army off its main plan. */
const economicSites=bl.filter(b=>b.done&&b.hp>0&&['lumber','mine','mill','market','house','tc','castle','tower','gate','palisade','wall','dock'].includes(b.k))
 .concat(S.nodes.filter(n=>n.fm&&n.t===t&&n.amt>0));
let raid=null;
for(const site of economicSites){
 let intruder=null;const sx=site.x+(site.s||0)/2,sy=site.y+(site.s||0)/2;
 for(const e of nearbyRaiders){const d=Math.hypot(e.x-sx,e.y-sy);if(d<8.5&&(!intruder||d<intruder.d))intruder={e,d}}
 if(intruder){raid={site,e:intruder.e};break}
}
if(raid&&S.t-(A.lastRaidDefense??-99)>=8){
 const defenders=arm.filter(u=>u.o==='i'&&!u.retreating&&!u.ld&&U[u.k]?.dmg>0&&Math.hypot(u.x-raid.site.x,u.y-raid.site.y)<21)
  .sort((a,b)=>Math.hypot(a.x-raid.site.x,a.y-raid.site.y)-Math.hypot(b.x-raid.site.x,b.y-raid.site.y)).slice(0,4);
 for(const u of defenders){u.o='a';u.tg=raid.e;u.p=[]}
 if(defenders.length)A.lastRaidDefense=S.t;
}
if(bl.some(b=>b.k==='market'&&b.done&&b.hp>0)&&S.t-(A.lastMarketTrade??-99)>=15){for(const k of ['f','w','s']){if(R[k]>1100&&R.g<400){if(trade(t,k,'sell')){A.lastMarketTrade=S.t;break}}else if(R[k]<80&&R.g>600&&k!=='s'){if(trade(t,k,'buy')){A.lastMarketTrade=S.t;break}}}}
if(A.stg){const wu=(A.wu||[]).filter(u=>u.hp>0&&!u.ld&&u.k!=='mon'&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if((!A.stg.tg||A.stg.tg.hp<=0)&&wu.length){const next=S.bs.filter(b=>b.hp>0&&isHostile(t,b.t)).sort((a,b)=>d2(tc.x,tc.y,a)-d2(tc.x,tc.y,b)).slice(0,16).find(b=>wu.slice(0,3).some(u=>path(u,goalNear(b,2))));if(next){A.stg.tg=next;A.stg.siegeT=next}else{for(const u of wu)if(u.o==='m'||u.o==='i'){u.o='i';u.tg=null;u.p=[];u.rp=0}A.on=0;A.nx=S.t+90}}if(!A.on||!A.stg.tg||A.stg.tg.hp<=0||!wu.length){A.stg=null}else if(wu.every(u=>u.o!=='m')||S.t-A.stg.t>50){for(const u of wu)if(u.o==='m'||u.o==='i'){u.o='a';u.tg=['ram','mang','scor','treb','bomb'].includes(u.k)&&A.stg.siegeT&&A.stg.siegeT.hp>0?A.stg.siegeT:A.stg.tg;u.p=[]}A.stg=null}}
{A.kn=A.kn||new Set();for(const known of A.kn)if(!known||known.hp<=0||!isHostile(t,known.t))A.kn.delete(known);for(const b of S.bs)if(isHostile(t,b.t)&&b.hp>0&&!A.kn.has(b)&&my.some(u=>Math.hypot(u.x-b.x,u.y-b.y)<9))A.kn.add(b);
aiResumeIdleWave(t,A);
 if(A.on){A.wu=(A.wu||[]).filter(u=>u.hp>0&&!u.ld&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if(!A.wu.length||A.wu.length<A.ws*.4){A.on=0;A.stg=null;for(const u of A.wu){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.rp=1;u.tg=null}}A.nx=S.t+[320,260,210,170,135,110][diff];note('The enemy army is retreating!')}else if(A.wu.length&&A.wu.every(u=>u.o==='i')){A.on=0;A.stg=null}}
if(A.rd){A.rd.u=A.rd.u.filter(u=>u.hp>0&&!u.ld&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if(A.rd.u.length<2||S.t-A.rd.t>150||!A.rd.u.some(u=>u.tg&&u.tg.hp>0&&isHostile(t,u.tg.t))){for(const u of A.rd.u){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.rp=1;u.tg=null}}A.rd=null}}
else if(!A.on&&!A.stg&&S.t>Math.max(A.rn||420*PERS[aip].r,[780,570,420,330,260,210][diff])&&S.age[t]>=1){const pt=arm.filter(u=>u.o==='i'&&u.hp>0&&!u.ld&&!u.retreating&&U[u.k]?.dmg>0&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&['knight','camel','mgd','cata','arc','xbow','skirm','lbow','spear','ram','mang','scor','treb','bomb','ele','tk','jan','hcan'].includes(u.k)).slice(0,10),tg2=[...A.kn].filter(b=>b.hp>0&&isHostile(t,b.t)&&['lumber','mine','mill','house','market','dock'].includes(b.k)).sort((a,b)=>Math.hypot(a.x-tc.x,a.y-tc.y)-Math.hypot(b.x-tc.x,b.y-tc.y))[0];if(pt.length>=4&&tg2){let raidTarget=tg2,reachable=pt.filter(u=>path(u,goalNear(tg2,2)));if(reachable.length<4){for(const candidate of [...A.kn].filter(b=>b!==tg2&&b.hp>0&&isHostile(t,b.t)&&['lumber','mine','mill','house','market','dock'].includes(b.k)).slice(0,6)){const group=pt.filter(u=>path(u,goalNear(candidate,2)));if(group.length>=4){raidTarget=candidate;reachable=group;break}}}if(reachable.length<4){A.rn=S.t+45}else{A.rd={u:reachable,t:S.t};A.rn=S.t+[450,330,260,210,170,140][diff]*PERS[aip].r;for(const u of reachable){u.o='a';u.tg=raidTarget;u.p=[]}}}}}
const enemyBs=S.bs.filter(b=>isHostile(t,b.t)&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y)),need=Math.min(60,Math.round(([12,14,18,22,26,30][diff]+Math.min(A.wave,8)*[2,3,3,4,5,5][diff])*PERS[aip].n));
const waveReady=arm.filter(u=>u.hp>0&&!u.ld&&!u.retreating&&U[u.k]?.dmg>0&&u.o!=='b'&&u.o!=='B'&&u.o!=='G'&&u.o!=='F'&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&(!A.rd||!A.rd.u.includes(u)));const launchReady=!A.on&&!A.stg&&waveReady.length>=aiOpeningWaveNeed(need,S.age[t],A.wave)&&waveReady.filter(u=>u.k!=='mon').length>=4&&S.t>=[720,540,360,260,190,150][diff]&&S.t>=(A.nx||0)&&S.t>=(A.targetRetryAt||0);let tgt=null;if(launchReady){if(vm===5)tgt={x:W/2,y:H/2,t:-1,k:'hill',hp:1};else{const preferred=vm===1?enemyBs.filter(b=>b.k==='wonder'&&b.done):[];const candidates=[...preferred,...enemyBs.filter(b=>b.k==='tc'),...enemyBs.filter(b=>b.done),...enemyBs];const leader=waveReady.find(u=>u.k!=='mon'&&!u.sh)||waveReady.find(u=>u.k!=='mon')||waveReady[0];const checked=new Set();for(const candidate of candidates){if(checked.has(candidate))continue;checked.add(candidate);if(path(leader,goalNear(candidate,2))){tgt=candidate;break}if(checked.size>=16)break}}if(!tgt)A.targetRetryAt=S.t+15}if(launchReady&&tgt){A.wave++;A.nx=S.t+(vm===5?[240,200,170,145,125,105][diff]:[420,340,280,230,190,155][diff])*PERS[aip].g;A.wu=waveReady;A.ws=A.wu.length;A.on=1;const sx=vm===5?W/2:tc.x+(tgt.x-tc.x)*.35,sy=vm===5?H/2:tc.y+(tgt.y-tc.y)*.35,sol=A.wu.filter(u=>u.k!=='mon'),slots=formationSlots(sol,sx,sy,1+((S.r()*3)|0)%3);sol.forEach((u,i)=>{const fo=vm===5?[(i%5-2),((Math.floor(i/5)%5)-2)]:slots(i),p=path(u,gp(sx+fo[0],sy+fo[1],1.2));if(p){u.o='m';u.p=p;u.rp=1}else{u.o='a';u.tg=tgt;u.p=[]}});const siegeLeader=sol.find(u=>['ram','mang','scor','treb','bomb'].includes(u.k));const siegeT=aiSiegeTarget(siegeLeader,enemyBs,tgt);A.stg={t:S.t,tg:tgt,siegeT};for(const u of A.wu)if(u.k==='mon'){const p=path(u,goalNear(tgt,7));if(p){u.o='m';u.p=p}}}}


