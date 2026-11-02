/* Crown & Kingdoms — merchant escort, fishing and naval tactical policies.
 * Loaded after shared ai-policy.js, before ai-offence.js and ai.js.
 */
// Keep land and sea merchant escort decisions together, outside the main AI
// loop. The existing route, threat, guard selection and expiry rules are unchanged.
function aiTradeEscorts(A,my,arm,galleys,hostileFleet,humanArmy){
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
}

// Fishing AI: flee nearby warships, then select reachable fishing grounds or
// deploy a trap. Retains the original path scoring, resource and cooldown rules.
function aiManageFishingShips(fish,hostileFleet,R){
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
}

/* Assign an idle, healthy warship to repair a damaged fleet member.
 * Combat vessels take precedence over fishing/transport/trade ships;
 * avoid beginning repairs under hostile naval fire or duplicating an
 * existing repair order. Original fleet thresholds and selection retained. */
function aiManageFleetRepairs(t,my){
const damagedFleet=my.filter(u=>u.sh&&!u.ld&&u.hp>0&&u.hp<mhp(u)*.55&&u.o!=='rep').sort((a,b)=>(['fish','cog','trn'].includes(a.k)?1:0)-(['fish','cog','trn'].includes(b.k)?1:0)||a.hp/mhp(a)-b.hp/mhp(b));
if(damagedFleet.length&&!my.some(u=>u.sh&&u.o==='rep')){
 const target=damagedFleet[0],underFire=S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&U[e.k]?.sh&&Math.hypot(e.x-target.x,e.y-target.y)<10);
 if(!underFire){
  const repairer=my.find(u=>u!==target&&u.sh&&!u.ld&&u.hp>mhp(u)*.7&&u.o==='i'&&!['fish','trn','cog'].includes(u.k));
  if(repairer){repairer.o='rep';repairer.tg=target;repairer.p=[]}
 }
}
}

/* Preserve the existing combat-warship-only escape policy: below 32% health,
 * threatened within 18 tiles, reachable open water and 20-second fallback cooldown.
 * Fishing, trade and transport ship escape remains handled by their own policies. */
function aiDisengageDamagedWarships(my,hostileFleet){
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
}


/* Assign coordinated naval combat targets and patrol fallback without changing
 * reachability scoring, enemy priority, focus fire, or target/patrol cooldowns.
 * The main AI owns enemy roster filtering; this policy owns tactical orders. */
function aiAssignWarshipTargets(t,tc,galleys,hostileShips){
const ptc=S.bs.filter(b=>isHostile(t,b.t)&&b.k==='tc'&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y))[0],focusCounts=new Map();for(const u of galleys)if(u.o==='a'&&u.tg)focusCounts.set(u.tg,(focusCounts.get(u.tg)||0)+1);for(const ship of galleys.filter(u=>(u.o==='i'||(u.o==='m'&&!u.tg)||(u.o==='a'&&(!u.tg||u.tg.hp<=0||u.tg.ld||!isHostile(t,u.tg.t))))&&(u.hp/mhp(u)>=.32||S.t>=(u.navalFallbackUntil||0)))){const navalTargetScore=e=>Math.hypot(e.x-ship.x,e.y-ship.y)-(e.k==='gal'?6:0)+(U[e.k].dmg>=4?0:10)-Math.min(3,focusCounts.get(e)||0)*4;let enemy=null;const navalCandidates=S.t>=(ship.nextNavalTargetAt||0)?hostileShips.filter(e=>Math.hypot(e.x-ship.x,e.y-ship.y)<28).sort((a,b)=>navalTargetScore(a)-navalTargetScore(b)):[];for(const candidate of navalCandidates.slice(0,6))if(path(ship,goalNear(candidate,Math.max(1,attackRange(ship))))){enemy=candidate;break}if(!enemy&&navalCandidates.length)ship.nextNavalTargetAt=S.t+8;if(enemy){ship.o='a';ship.tg=enemy;ship.p=[];focusCounts.set(enemy,(focusCounts.get(enemy)||0)+1);continue}if(!ptc)continue;const cx=ptc.x+ptc.s/2,cy=ptc.y+ptc.s/2;if(Math.hypot(ship.x-cx,ship.y-cy)<17)continue;if(S.t<(ship.nextNavalPatrol||0))continue;ship.nextNavalPatrol=S.t+12;const p=path(ship,gp(cx,cy,17));if(p&&p.length>1){ship.o='m';ship.p=p;ship.rp=1}}}
