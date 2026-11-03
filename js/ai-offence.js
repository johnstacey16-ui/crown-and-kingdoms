/* Crown & Kingdoms — offensive formation, raid and assault policies.
 * Loaded after ai-policy.js and before ai.js; shares existing global helpers.
 */
// Siege should neutralise reachable fortifications before ordinary town centres.
function aiSiegeTarget(leader,buildings,fallback){
 if(!leader)return fallback;
 const priority={castle:0,tower:1,tc:2};
 const choices=buildings.filter(b=>b&&b.done&&b.hp>0&&isHostile(leader.t,b.t)&&Object.prototype.hasOwnProperty.call(priority,b.k))
  .map(b=>{const dx=b.x+b.s/2-leader.x,dy=b.y+b.s/2-leader.y;return {b,d:dx*dx+dy*dy}})
  .sort((a,b)=>priority[a.b.k]-priority[b.b.k]||a.d-b.d);
 for(let i=0;i<Math.min(12,choices.length);i++)if(path(leader,goalNear(choices[i].b,2)))return choices[i].b;
 return fallback;
}
// The first Feudal push can be a smaller skirmish. Using the full
// late-game difficulty wave size before the first raid stalls real AI games
// when villagers gather at DE reference speeds. Later waves are unchanged.
function aiOpeningWaveNeed(base,age,wave){return age===1&&wave===0?Math.max(6,Math.ceil(base*.7)):base}
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

/* Finish the existing staged-wave march after formation travel, retarget lost
 * structures when reachable, or cancel safely with the original retry delay. */
function aiAdvanceStagedWave(t,A,tc){
if(A.stg){const wu=(A.wu||[]).filter(u=>u.hp>0&&!u.ld&&u.k!=='mon'&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if((!A.stg.tg||A.stg.tg.hp<=0)&&wu.length){const next=S.bs.filter(b=>b.hp>0&&isHostile(t,b.t)).sort((a,b)=>d2(tc.x,tc.y,a)-d2(tc.x,tc.y,b)).slice(0,16).find(b=>wu.slice(0,3).some(u=>path(u,goalNear(b,2))));if(next){A.stg.tg=next;A.stg.siegeT=next}else{for(const u of wu)if(u.o==='m'||u.o==='i'){u.o='i';u.tg=null;u.p=[];u.rp=0}A.on=0;A.nx=S.t+90}}if(!A.on||!A.stg.tg||A.stg.tg.hp<=0||!wu.length){A.stg=null}else if(wu.every(u=>u.o!=='m')||S.t-A.stg.t>50){for(const u of wu)if(u.o==='m'||u.o==='i'){u.o='a';u.tg=['ram','mang','scor','treb','bomb'].includes(u.k)&&A.stg.siegeT&&A.stg.siegeT.hp>0?A.stg.siegeT:A.stg.tg;u.p=[]}A.stg=null}}
}

/* Preserve bounded worker-site raid launches and disengagement, reusing only
 * confirmed enemy buildings and route-verified live military responders. */
function aiManageEconomicRaids(t,A,arm,tc,diff,aip){
if(A.rd){A.rd.u=A.rd.u.filter(u=>u.hp>0&&!u.ld&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if(A.rd.u.length<2||S.t-A.rd.t>150||!A.rd.u.some(u=>u.tg&&u.tg.hp>0&&isHostile(t,u.tg.t))){for(const u of A.rd.u){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.rp=1;u.tg=null}}A.rd=null}}
else if(!A.on&&!A.stg&&S.t>Math.max(A.rn||420*PERS[aip].r,[780,570,420,330,260,210][diff])&&S.age[t]>=1){const pt=arm.filter(u=>u.o==='i'&&u.hp>0&&!u.ld&&!u.retreating&&U[u.k]?.dmg>0&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&['knight','camel','mgd','cata','arc','xbow','skirm','lbow','spear','ram','mang','scor','treb','bomb','ele','tk','jan','hcan'].includes(u.k)).slice(0,10),tg2=[...A.kn].filter(b=>b.hp>0&&isHostile(t,b.t)&&['lumber','mine','mill','house','market','dock'].includes(b.k)).sort((a,b)=>Math.hypot(a.x-tc.x,a.y-tc.y)-Math.hypot(b.x-tc.x,b.y-tc.y))[0];if(pt.length>=4&&tg2){let raidTarget=tg2,reachable=pt.filter(u=>path(u,goalNear(tg2,2)));if(reachable.length<4){for(const candidate of [...A.kn].filter(b=>b!==tg2&&b.hp>0&&isHostile(t,b.t)&&['lumber','mine','mill','house','market','dock'].includes(b.k)).slice(0,6)){const group=pt.filter(u=>path(u,goalNear(candidate,2)));if(group.length>=4){raidTarget=candidate;reachable=group;break}}}if(reachable.length<4){A.rn=S.t+45}else{A.rd={u:reachable,t:S.t};A.rn=S.t+[450,330,260,210,170,140][diff]*PERS[aip].r;for(const u of reachable){u.o='a';u.tg=raidTarget;u.p=[]}}}}
}

/* Main offensive wave formation and launch. Preserve attack gates, 16-candidate
 * route limit, siege objective, monk support and path-blocked fallback. */
function aiLaunchOffensiveWave(t,A,arm,tc,diff,aip,vm){
const enemyBs=S.bs.filter(b=>isHostile(t,b.t)&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y)),need=Math.min(60,Math.round(([12,14,18,22,26,30][diff]+Math.min(A.wave,8)*[2,3,3,4,5,5][diff])*PERS[aip].n));
const waveReady=arm.filter(u=>u.hp>0&&!u.ld&&!u.retreating&&U[u.k]?.dmg>0&&u.o!=='b'&&u.o!=='B'&&u.o!=='G'&&u.o!=='F'&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&(!A.rd||!A.rd.u.includes(u)));const launchReady=!A.on&&!A.stg&&waveReady.length>=aiOpeningWaveNeed(need,S.age[t],A.wave)&&waveReady.filter(u=>u.k!=='mon').length>=4&&S.t>=[720,540,360,260,190,150][diff]&&S.t>=(A.nx||0)&&S.t>=(A.targetRetryAt||0);let tgt=null;if(launchReady){if(vm===5)tgt={x:W/2,y:H/2,t:-1,k:'hill',hp:1};else{const preferred=vm===1?enemyBs.filter(b=>b.k==='wonder'&&b.done):[];const candidates=[...preferred,...enemyBs.filter(b=>b.k==='tc'),...enemyBs.filter(b=>b.done),...enemyBs];const leader=waveReady.find(u=>u.k!=='mon'&&!u.sh)||waveReady.find(u=>u.k!=='mon')||waveReady[0];const checked=new Set();for(const candidate of candidates){if(checked.has(candidate))continue;checked.add(candidate);if(path(leader,goalNear(candidate,2))){tgt=candidate;break}if(checked.size>=16)break}}if(!tgt)A.targetRetryAt=S.t+15}if(launchReady&&tgt){A.wave++;A.nx=S.t+(vm===5?[240,200,170,145,125,105][diff]:[420,340,280,230,190,155][diff])*PERS[aip].g;A.wu=waveReady;A.ws=A.wu.length;A.on=1;const sx=vm===5?W/2:tc.x+(tgt.x-tc.x)*.35,sy=vm===5?H/2:tc.y+(tgt.y-tc.y)*.35,sol=A.wu.filter(u=>u.k!=='mon'),slots=formationSlots(sol,sx,sy,1+((S.r()*3)|0)%3);sol.forEach((u,i)=>{const fo=vm===5?[(i%5-2),((Math.floor(i/5)%5)-2)]:slots(i),p=path(u,gp(sx+fo[0],sy+fo[1],1.2));if(p){u.o='m';u.p=p;u.rp=1}else{u.o='a';u.tg=tgt;u.p=[]}});const siegeLeader=sol.find(u=>['ram','mang','scor','treb','bomb'].includes(u.k));const siegeT=aiSiegeTarget(siegeLeader,enemyBs,tgt);A.stg={t:S.t,tg:tgt,siegeT};A.waveProbeAt=0;A.waveProgressAt=S.t;A.waveBestDistance=-1;A.waveTargetHP=-1;A.waveTargetKey='';A.waveRecoveries=0;for(const u of A.wu)if(u.k==='mon'){const p=path(u,goalNear(tgt,7));if(p){u.o='m';u.p=p}}}
}


/* A marching army can retain a valid attack order even when no route
 * reaches the target. Sample real progress, try a bounded alternative
 * objective, then release the stuck wave rather than retry indefinitely.
 * This never teleports, damages or grants resources to AI units. */
function aiRecoverStalledWave(t,A){
 if(!A?.on||A.stg||!Array.isArray(A.wu)||S.t<(A.waveProbeAt||0))return 0;
 A.waveProbeAt=S.t+12;
 const soldiers=A.wu.filter(u=>u&&u.hp>0&&!u.ld&&!u.retreating&&
  U[u.k]?.dmg>0&&!U[u.k]?.sh&&Number.isFinite(u.x)&&Number.isFinite(u.y));
 if(!soldiers.length)return 0;
 const targets=S.bs.filter(b=>b&&b.hp>0&&b.done&&isHostile(t,b.t));
 if(!targets.length)return 0; // King/Hill modes may have no hostile structure.
 const active=soldiers.find(u=>u.tg&&targets.includes(u.tg));
 const target=active?.tg||targets.find(b=>b.k==='tc')||targets[0];
 const leader=soldiers[0],key=target.netId||'b'+S.bs.indexOf(target);
 const range=target.s||1;
 const distance=Math.min(...soldiers.map(u=>Math.max(0,
  Math.hypot(u.x-(target.x+range/2),u.y-(target.y+range/2))-range/2)));
 if(!Number.isFinite(A.waveProgressAt))A.waveProgressAt=0; // Match the save loader's legacy/unset watchdog default.
 // A retargeted order deliberately resets its distance sample, without
 // granting another retry merely for sampling the new destination.
 if(!Number.isFinite(A.waveBestDistance)||A.waveBestDistance<0){
  // Record the newly issued objective, but do not restart the stall clock:
  // oscillating between structures must never create an endless attack.
  A.waveTargetKey=key;A.waveTargetHP=target.hp;A.waveBestDistance=distance;
  return 0;
 }
 const started=A.waveProgressAt;
 const changedTarget=A.waveTargetKey!==key;
 const damaged=!changedTarget&&target.hp<(Number.isFinite(A.waveTargetHP)?A.waveTargetHP:Infinity)-.01;
 const advanced=!changedTarget&&distance<(Number.isFinite(A.waveBestDistance)&&A.waveBestDistance>=0?A.waveBestDistance:Infinity)-1;
 if(changedTarget){
  // Distances and HP of different structures cannot be compared as progress.
  // Preserve previous timeout and retry count across external retargets.
  A.waveTargetKey=key;A.waveTargetHP=target.hp;A.waveBestDistance=distance;
 }else if(damaged||advanced){
  A.waveTargetHP=target.hp;A.waveBestDistance=distance;
  A.waveProgressAt=S.t;A.waveRecoveries=0;
  return 0;
 }
 if(S.t-started<48)return 0;
 // Prefer a different reachable building, then the current objective
 // if the route exists but the previous attack order was ineffective.
 const alternatives=[...targets.filter(b=>b!==target),target];
 let chosen=null,probes=0;
 for(const candidate of alternatives){
  if(probes++>=16)break;
  const route=path(leader,goalNear(candidate,2));
  if(route&&route.length){chosen=candidate;break}
 }
 if(chosen&&(A.waveRecoveries||0)<3){
  for(const u of soldiers){
   u.o='a';u.tg=chosen;u.p=[];u.rp=0;
  }
  A.waveRecoveries=(A.waveRecoveries||0)+1;
  A.waveTargetKey=chosen.netId||'b'+S.bs.indexOf(chosen);
  A.waveTargetHP=chosen.hp;A.waveBestDistance=-1;
  A.waveProgressAt=S.t;return 1;
 }
 // No path or repeated no-progress attempts: stop this wave and let
 // the existing paid-formation and launch cooldown rules rebuild it.
 for(const u of soldiers)if(u.o==='a'||u.o==='m'){
  u.o='i';u.tg=null;u.p=[];u.rp=0;
 }
 A.on=0;A.stg=null;A.nx=Math.max(A.nx||0,S.t+90);
 A.targetRetryAt=Math.max(A.targetRetryAt||0,S.t+30);
 A.waveProgressAt=S.t;A.waveBestDistance=-1;A.waveRecoveries=0;
 return -1;
}

/* Remember only directly observed live hostile structures and forget lost targets. */
function aiRememberEnemySites(t,A,my){
A.kn=A.kn||new Set();for(const known of A.kn)if(!known||known.hp<=0||!isHostile(t,known.t))A.kn.delete(known);for(const b of S.bs)if(isHostile(t,b.t)&&b.hp>0&&!A.kn.has(b)&&my.some(u=>Math.hypot(u.x-b.x,u.y-b.y)<9))A.kn.add(b);
}

/* Keep the existing forty-percent wave attrition gate, survivors' home route,
 * difficulty-dependent retry and quiet exit when every member has gone idle. */
function aiMaintainAttackWave(A,tc,diff){
if(A.on){A.wu=(A.wu||[]).filter(u=>u.hp>0&&!u.ld&&!u.retreating&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H);if(!A.wu.length||A.wu.length<A.ws*.4){A.on=0;A.stg=null;for(const u of A.wu){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.rp=1;u.tg=null}}A.nx=S.t+[320,260,210,170,135,110][diff];note('The enemy army is retreating!')}else if(A.wu.length&&A.wu.every(u=>u.o==='i')){A.on=0;A.stg=null}}
}
