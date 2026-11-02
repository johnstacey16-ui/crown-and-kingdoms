/* Crown & Kingdoms — offensive formation, raid and assault policies.
 * Loaded after ai-policy.js and before ai.js; shares existing global helpers.
 */
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
const waveReady=arm.filter(u=>u.hp>0&&!u.ld&&!u.retreating&&U[u.k]?.dmg>0&&u.o!=='b'&&u.o!=='B'&&u.o!=='G'&&u.o!=='F'&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<W&&u.y<H&&(!A.rd||!A.rd.u.includes(u)));const launchReady=!A.on&&!A.stg&&waveReady.length>=aiOpeningWaveNeed(need,S.age[t],A.wave)&&waveReady.filter(u=>u.k!=='mon').length>=4&&S.t>=[720,540,360,260,190,150][diff]&&S.t>=(A.nx||0)&&S.t>=(A.targetRetryAt||0);let tgt=null;if(launchReady){if(vm===5)tgt={x:W/2,y:H/2,t:-1,k:'hill',hp:1};else{const preferred=vm===1?enemyBs.filter(b=>b.k==='wonder'&&b.done):[];const candidates=[...preferred,...enemyBs.filter(b=>b.k==='tc'),...enemyBs.filter(b=>b.done),...enemyBs];const leader=waveReady.find(u=>u.k!=='mon'&&!u.sh)||waveReady.find(u=>u.k!=='mon')||waveReady[0];const checked=new Set();for(const candidate of candidates){if(checked.has(candidate))continue;checked.add(candidate);if(path(leader,goalNear(candidate,2))){tgt=candidate;break}if(checked.size>=16)break}}if(!tgt)A.targetRetryAt=S.t+15}if(launchReady&&tgt){A.wave++;A.nx=S.t+(vm===5?[240,200,170,145,125,105][diff]:[420,340,280,230,190,155][diff])*PERS[aip].g;A.wu=waveReady;A.ws=A.wu.length;A.on=1;const sx=vm===5?W/2:tc.x+(tgt.x-tc.x)*.35,sy=vm===5?H/2:tc.y+(tgt.y-tc.y)*.35,sol=A.wu.filter(u=>u.k!=='mon'),slots=formationSlots(sol,sx,sy,1+((S.r()*3)|0)%3);sol.forEach((u,i)=>{const fo=vm===5?[(i%5-2),((Math.floor(i/5)%5)-2)]:slots(i),p=path(u,gp(sx+fo[0],sy+fo[1],1.2));if(p){u.o='m';u.p=p;u.rp=1}else{u.o='a';u.tg=tgt;u.p=[]}});const siegeLeader=sol.find(u=>['ram','mang','scor','treb','bomb'].includes(u.k));const siegeT=aiSiegeTarget(siegeLeader,enemyBs,tgt);A.stg={t:S.t,tg:tgt,siegeT};for(const u of A.wu)if(u.k==='mon'){const p=path(u,goalNear(tgt,7));if(p){u.o='m';u.p=p}}}
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
