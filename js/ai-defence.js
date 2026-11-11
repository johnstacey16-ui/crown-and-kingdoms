/* Crown & Kingdoms — shared threat, military retreat, villager evacuation,
 * Town Centre garrison and local/allied defensive policy. Global declarations
 * loaded after ai-policy.js and before maritime and offensive modules.
 */
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

// Defensive retreat decision and shelter/path selection, shared by all AI teams.
function aiRetreat(t,my,tc,bl){if(!tc||!tc.done)return;const shelters=bl.filter(b=>b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle'));for(const u of my){if(u.k==='vil'||u.k==='mon'||u.k==='king'||u.k==='cart'||u.k==='cog'||u.sh||u.hp<=0||u.ld)continue;const ratio=u.hp/Math.max(1,mhp(u));if(u.retreating){const safe=u.retreatTarget;if(ratio>=.65||!safe||safe.hp<=0||!safe.done){u.retreating=false;u.retreatTarget=null;if(u.tg===safe){u.o='i';u.tg=null;u.p=[];u.rp=0}}else{if(d2(u.x,u.y,safe)<=1.3){continue}if((u.o!=='m'||!u.p||!u.p.length)&&d2(u.x,u.y,safe)>1.3&&S.t>=(u.retreatRepathAt||0)){u.retreatRepathAt=S.t+4;const route=path(u,goalNear(safe,1));if(route){u.o='m';u.tg=safe;u.p=route;u.rp=1}else{u.retreating=false;u.retreatTarget=null;u.o='i';u.tg=null;u.retreatRepathAt=S.t+8}}continue}}if(ratio<=.22&&S.t>=(u.retreatRepathAt||0)&&S.t>=(u.retreatCooldownUntil||0)){u.retreatRepathAt=S.t+8;const threats=S.us.filter(enemy=>enemy&&enemy.hp>0&&!enemy.ld&&isHostile(u.t,enemy.t)&&U[enemy.k]?.dmg>0&&!U[enemy.k].sh);const rankedShelters=shelters.map(safe=>{const sz=safe.s||0,dx=Math.max(safe.x-u.x,0,u.x-(safe.x+sz)),dy=Math.max(safe.y-u.y,0,u.y-(safe.y+sz));let danger=0;const cx=safe.x+sz/2,cy=safe.y+sz/2;for(const enemy of threats){const ex=enemy.x-cx,ey=enemy.y-cy;if(ex*ex+ey*ey<100)danger++}return {safe,score:dx*dx+dy*dy+danger*64}}).sort((a,b)=>a.score-b.score);
for(const {safe} of rankedShelters){const p=path(u,goalNear(safe,1));if(!p)continue;u.retreating=true;u.retreatTarget=safe;u.retreatRestUntil=0;u.retreatCooldownUntil=S.t+30;u.o='m';u.tg=safe;u.p=p;u.rp=1;break}}}}


/* Preserve emergency evacuation and return-to-work orders, including shelter
 * choice, eight-second open-field escape, and eighteen-second shelter timeouts. */
function aiVillagerEvacRoute(v,bl,threat){
 const shelters=bl.filter(b=>b&&b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle'))
  .sort((a,b)=>Math.hypot(v.x-(a.x+a.s/2),v.y-(a.y+a.s/2))-Math.hypot(v.x-(b.x+b.s/2),v.y-(b.y+b.s/2)));
 for(const shelter of shelters){const route=path(v,goalNear(shelter,1));if(route)return {shelter,route,seconds:18}}
 const dx=v.x-threat.x,dy=v.y-threat.y,len=Math.max(.01,Math.hypot(dx,dy));
 const x=Math.max(1,Math.min(W-2,Math.round(v.x+dx/len*7)));
 const y=Math.max(1,Math.min(H-2,Math.round(v.y+dy/len*7)));
 const route=path(v,gp(x,y,1.2));
 return route?{shelter:null,route,seconds:8}:null;
}
function aiEvacuateVillagers(vil,bl,nearbyRaiders){
/* Villagers evacuate from nearby raiders, then resume their previous work once they reach safety. */
for(const v of vil){
 if(v.hp<=0||v.ld||v.o==='B'||!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x<0||v.y<0||v.x>=W||v.y>=H)continue;
 /* Single-pass nearest-raider scan avoids filter/map/sort allocations for every villager. */
 let threat=null;
 for(const e of nearbyRaiders){const d=Math.hypot(e.x-v.x,e.y-v.y);if(!threat||d<threat.d)threat={e,d}}
 if(v.aiEvac){
  const ev=v.aiEvac,near=threat&&threat.d<7,safe=ev.shelter&&ev.shelter.hp>0&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))<3;
  // A lost Town Centre/Castle should not trap a villager's evacuation order.
  // Keep the original work target in ev until escape is safe or times out.
  if(near&&ev.shelter&&ev.shelter.hp<=0){
   const next=aiVillagerEvacRoute(v,bl,threat.e);
   ev.shelter=next?.shelter||null;ev.until=S.t+(next?.seconds||8);
   v.o=next?'m':'i';v.tg=next?.shelter||null;v.p=next?.route||[];v.rp=next?1:0;
   continue;
  }
  if(!near&&(safe||S.t>=ev.until||ev.shelter&&ev.shelter.hp<=0)){
   const target=ev.tg,valid=target&&(target.s?target.hp>0:target.amt>0);
   v.o=valid?ev.o:'i';v.tg=valid?target:null;v.ct=ev.ct||v.ct;v.p=[];v.rp=0;v.aiEvac=null;if(valid&&(v.o==='g'||v.o==='b'||v.o==='rep')){const route=path(v,goalNear(target,1));if(route){v.p=route;v.rp=1}else{v.o='i';v.tg=null}}
  }else if(near&&ev.shelter&&ev.shelter.hp>0&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))>3&&(!v.p||!v.p.length)){
   const route=path(v,goalNear(ev.shelter,1));if(route){v.o='m';v.tg=ev.shelter;v.p=route;v.rp=1}
  }
  continue;
 }
 if(!threat||threat.d>5.5||v.o==='B')continue;
 const next=aiVillagerEvacRoute(v,bl,threat.e);
 if(!next)continue;
 v.aiEvac={o:v.o,tg:v.tg,ct:v.ct,shelter:next.shelter,until:S.t+next.seconds};
 v.o='m';v.tg=next.shelter;v.p=next.route;v.rp=1;
}
}

/* Protect the AI Town Centre with siege-weighted targeting, short-range
 * garrison orders and the existing delayed unload policy. */
function aiDefendTownCentre(A,tc,arm,vil,my,nearbyRaiders){let thr=false,intr=null,best=Infinity;for(const e of nearbyRaiders){const d=Math.hypot(e.x-tc.x,e.y-tc.y);if(d<12)thr=true;if(d<13){const score=d-(['ram','mang','scor','treb','bomb'].includes(e.k)?8:0);if(score<best){best=score;intr=e}}}if(thr){if(intr)for(const d of arm)if(d.o==='i'&&U[d.k]?.dmg>0&&Math.hypot(d.x-tc.x,d.y-tc.y)<18){d.o='a';d.tg=intr;d.p=[]}for(const v of vil.concat(my.filter(u=>u.k==='king')))if(v.o!=='B'&&!v.ld&&Math.hypot(v.x-tc.x,v.y-tc.y)<16&&(tc.cg||[]).length<15){v.o='B';v.tg=tc;v.p=[]}A.gu=S.t}else if(tc.cg&&tc.cg.length&&S.t-(A.gu||0)>15)unload(tc)}

/* Limited allied relief force: retain shared threat priorities and six-second
 * response cooldown without pulling committed soldiers from their orders. */
function aiRelieveAlliedBases(t,A,arm,nearbyRaiders){
/* Allied AI kingdoms now send a limited relief detachment to threatened allied Town Centres and Castles. */
const alliedBases=S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.hp>0&&b.done&&['tc','castle','tower','market','mill','folwark','lumber','mine','dock'].includes(b.k));
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

}

/* Local four-defender anti-raid response for buildings and farm sites. */
function aiDefendEconomicSites(t,A,arm,bl,nearbyRaiders){
/* Local anti-raid response: defend remote economic sites without pulling the entire army off its main plan. */
const economicSites=bl.filter(b=>b.done&&b.hp>0&&['lumber','mine','mill','folwark','market','house','tc','castle','tower','gate','palisade','wall','dock'].includes(b.k))
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

}

/* Georgian base reserves favour nearby actual high ground only at peace.
 * Never steal units from a wave, campaign, garrison or emergency response.
 * Bound path probes to 16 every 24 simulation seconds. */
function aiGeorgianRidgeDefence(t,A,arm,tc,nearbyRaiders){
 if(S?.civ?.[t]!==42||!S?.el||S.el.length!==W*H||!tc?.done||
  tc.hp<=0||vm===5||cmp||A?.on||A?.stg||!Number.isFinite(S.t)||
  !Number.isInteger(t)||t<1||t>=S.teamN)return 0;
 if(S.t<(A.georgianRidgeAt||0))return 0;
 A.georgianRidgeAt=S.t+24;
 const cx=tc.x+tc.s/2,cy=tc.y+tc.s/2;
 if((nearbyRaiders||[]).some(e=>e&&e.hp>0&&Number.isFinite(e.x)&&
  Number.isFinite(e.y)&&Math.hypot(e.x-cx,e.y-cy)<24))return 0;
 const reserves=(arm||[]).filter(u=>u&&u.t===t&&u.hp>0&&!u.ld&&
  !u.retreating&&u.o==='i'&&!U[u.k]?.sh&&U[u.k]?.dmg>0&&
  !['ram','mang','scor','treb','bomb','demo','king'].includes(u.k)&&
  Number.isFinite(u.x)&&Number.isFinite(u.y)&&
  u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&
  Math.hypot(u.x-cx,u.y-cy)<=18&&
  !S.el[Math.floor(u.y)*W+Math.floor(u.x)]).slice(0,2);
 if(!reserves.length)return 0;
 const spots=[];
 for(let y=Math.max(1,Math.floor(cy-17));y<Math.min(H-1,Math.ceil(cy+17));y++)
 for(let x=Math.max(1,Math.floor(cx-17));x<Math.min(W-1,Math.ceil(cx+17));x++){
  const i=y*W+x,dist=Math.hypot(x+.5-cx,y+.5-cy);
  if(dist<5||dist>17||S.el[i]!==1||S.wt[i]!==0||S.g[i]||S.nd[i])continue;
  let adjacent=0;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
   if(S.el[(y+dy)*W+x+dx]===1&&S.wt[(y+dy)*W+x+dx]===0)adjacent++;
  if(adjacent<2)continue;
  spots.push({x,y,dist});
 }
 spots.sort((a,b)=>a.dist-b.dist||a.y-b.y||a.x-b.x);
 let posted=0,probes=0;
 for(const soldier of reserves){
  let selected=null;
  for(const spot of spots){
   if(probes>=16)break;
   if(Math.hypot(spot.x+.5-soldier.x,spot.y+.5-soldier.y)>21)continue;
   if(S.us.some(u=>u!==soldier&&u.hp>0&&!u.ld&&u.t===t&&
     Math.hypot(u.x-spot.x-.5,u.y-spot.y-.5)<1.4))continue;
   probes++;
   const route=path(soldier,gp(spot.x+.5,spot.y+.5,.6));
   if(!Array.isArray(route)||!route.length||route.length>44)continue;
   selected={spot,route};break;
  }
  if(!selected)break;
  soldier.o='m';soldier.tg=null;soldier.p=selected.route;soldier.rp=1;
  spots.splice(spots.indexOf(selected.spot),1);posted++;
 }
 return posted;
}
