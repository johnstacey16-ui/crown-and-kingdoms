/* Crown & Kingdoms — economic, defensive, and naval AI. Loaded after simulation.js. */
/* ===== ENEMY AI (same rules as player; no resource or damage bonuses) ===== */
function aiAvailableBuilder(u){return u&&u.hp>0&&!u.ld&&!u.aiEvac&&!u.retreating&&!['b','B','a','m','rep'].includes(u.o)}
function aiBuilderCandidates(vs){return vs.filter(aiAvailableBuilder).sort((a,b)=>(a.o==='i'?0:a.o==='g'?1:2)-(b.o==='i'?0:b.o==='g'?1:2))}
function aiBuild(vs,k,t=1){const d=B[k],tc=S.bs.find(b=>b.t===t&&b.k==='tc'&&b.hp>0&&b.done)||S.bs.find(b=>b.t===t&&b.k==='tc'&&b.hp>0),v=aiBuilderCandidates(vs)[0];if(!tc||!v||d.age>S.age[t]||!can(t,d.cost))return;
for(let i=0;i<60;i++){const sp=26+Math.min(60,S.bs.length),x=(tc.x+1+(S.r()-.5)*sp)|0,y=(tc.y+1+(S.r()-.5)*sp)|0;if(Math.hypot(x-tc.x,y-tc.y)<4||cor(tc,x,y))continue;
if(okPlace(t,k,x,y)){const target={x,y,s:d.s};let builder=v,route=path(builder,goalNear(target,1));if(!route){for(const candidate of aiBuilderCandidates(vs)){if(candidate===v)continue;const alt=path(candidate,goalNear(target,1));if(alt){builder=candidate;route=alt;break}}}if(!route)continue;pay(t,d.cost);const b=addB(t,k,x,y,false);builder.o='b';builder.tg=b;builder.p=route;return}}}
const cor=(tc,x,y)=>Math.abs(x-(tc.x+1))<=3||Math.abs(y-(tc.y+1))<=3;
function aiWall(vs,tc,t=1){if(!can(t,B.wall.cost))return;const cx=tc.x+1,cy=tc.y+1;let n=0;for(let a=-8;a<=8&&n<3;a++)for(const[x,y]of[[cx+a,cy-8],[cx+a,cy+8],[cx-8,cy+a],[cx+8,cy+a]]){if(n>=3)break;if(Math.abs(x-cx)<=2||Math.abs(y-cy)<=2)continue;if(S.bs.some(b=>b.t===t&&b.k==='wall'&&b.hp>0&&b.x===x&&b.y===y))continue;const v=aiBuilderCandidates(vs)[0];if(!v||!can(t,B.wall.cost))return;if(okPlace(t,'wall',x,y)){const target={x,y,s:B.wall.s};let builder=v,route=path(v,goalNear(target,1));if(!route){for(const candidate of aiBuilderCandidates(vs)){if(candidate===v)continue;const alt=path(candidate,goalNear(target,1));if(alt){builder=candidate;route=alt;break}}}if(!route)continue;pay(t,B.wall.cost);const w=addB(t,'wall',x,y,false);builder.o='b';builder.tg=w;builder.p=route;n++}}}
function aiDock(vs,tc,t=1){const d=B.dock,v=aiBuilderCandidates(vs)[0];if(!v||!can(t,d.cost))return;const sites=[];for(let y=Math.max(1,tc.y-20);y<Math.min(H-3,tc.y+20);y++)for(let x=Math.max(1,tc.x-20);x<Math.min(W-3,tc.x+20);x++){const dd=Math.hypot(x-tc.x,y-tc.y);if(dd>5&&!cor(tc,x,y)&&okPlace(t,'dock',x,y))sites.push({x,y,dd})}sites.sort((a,b)=>a.dd-b.dd);for(const site of sites.slice(0,64)){const target={x:site.x,y:site.y,s:d.s};let builder=v,route=path(v,goalNear(target,1));if(!route){for(const candidate of aiBuilderCandidates(vs)){if(candidate===v)continue;const alt=path(candidate,goalNear(target,1));if(alt){builder=candidate;route=alt;break}}}if(!route)continue;pay(t,d.cost);const dock=addB(t,'dock',site.x,site.y,false);builder.o='b';builder.tg=dock;builder.p=route;return}}
function aiRebal(vil,R,t=1){const nv=vil.length,wk=k=>vil.filter(u=>u.o==='g'&&u.ct===k).length,mv=(k,fr='w')=>{const w=vil.find(u=>u.o==='g'&&u.ct===fr&&!u.car&&!u.ret);if(!w)return;const n=findNode(w,k,36);if(n){const route=path(w,goalNear(n,1));if(!route)return;w.tg=n;w.ct=k;w.p=route;w.rp=1}};
if(R.w<150&&wk('w')<nv*.4&&Math.max(R.f,R.g)>250)mv('w',R.f>R.g?'f':'g');else if(S.age[t]>=1&&R.s<150&&wk('s')<Math.max(2,nv*.1|0)&&(PERS[aip].tw>0||PERS[aip].wl>0)&&R.f>200&&R.g>100)mv('s',R.f>R.g?'f':'g');
if(R.w>800){if(R.f<400&&wk('f')<nv*.45)mv('f');else if(R.s<300&&S.age[t]>=1&&wk('s')<Math.max(3,nv*.12|0))mv('s');else if(R.g<300&&wk('g')<nv*.3)mv('g')}}
function aiNear(vs,k,nk,t=1){const d=B[k],v=aiBuilderCandidates(vs)[0],tc=S.bs.find(b=>b.t===t&&b.k==='tc'&&b.hp>0&&b.done)||S.bs.find(b=>b.t===t&&b.k==='tc'&&b.hp>0);if(!v||!tc||!can(t,d.cost))return;
const ns=S.nodes.filter(n=>nk.includes(n.k)&&!n.an&&!n.fi&&Math.hypot(n.x-tc.x,n.y-tc.y)<45&&!S.bs.some(q=>q.t===t&&q.k===k&&q.hp>0&&Math.hypot(q.x-n.x,q.y-n.y)<7)).sort((a,b)=>Math.hypot(a.x-tc.x,a.y-tc.y)-Math.hypot(b.x-tc.x,b.y-tc.y));
for(const n of ns.slice(0,12))for(const[dx,dy]of[[-2,0],[1,0],[0,-2],[0,1],[-2,-2],[1,1]]){const x=n.x+dx,y=n.y+dy;if(okPlace(t,k,x,y)&&!cor(tc,x,y)){const target={x,y,s:d.s};let builder=v,route=path(v,goalNear(target,1));if(!route){for(const candidate of aiBuilderCandidates(vs)){if(candidate===v)continue;const alt=path(candidate,goalNear(target,1));if(alt){builder=candidate;route=alt;break}}}if(!route)continue;pay(t,d.cost);const building=addB(t,k,x,y,false);builder.o='b';builder.tg=building;builder.p=route;return}}}
function aiTownTechReady(t,tc,villagers){if(villagers<8||tc.rs)return false;for(const k of ['loom','wheel','handcart']){const e=TE[k];if(e&&B.tc.rs&&B.tc.rs.includes(k)&&!S.tech[t][k]&&e.age<=S.age[t]&&(!e.pre||S.tech[t][e.pre])&&can(t,e.cost))return true}return false}
function aiRetreat(t,my,tc,bl){if(!tc||!tc.done)return;const shelters=bl.filter(b=>b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle'));for(const u of my){if(u.k==='vil'||u.k==='mon'||u.k==='king'||u.k==='cart'||u.k==='cog'||u.sh||u.hp<=0)continue;const ratio=u.hp/Math.max(1,mhp(u));if(u.retreating){const safe=u.retreatTarget;if(ratio>=.55||!safe||safe.hp<=0){u.retreating=false;u.retreatTarget=null;if(u.tg===safe){u.o='i';u.tg=null;u.p=[];u.rp=0}}else continue}if(ratio<=.22){for(const safe of shelters.slice().sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b))){const p=path(u,goalNear(safe,1));if(!p)continue;u.retreating=true;u.retreatTarget=safe;u.o='m';u.tg=safe;u.p=p;u.rp=1;break}}}}
function ai(dt){if(!Number.isFinite(dt)||dt<=0)return;for(let t=1;t<S.teamN;t++)aiTeam(t,dt)}
function aiTeam(t,dt){if(!Number.isFinite(dt)||dt<=0)return;const A=S.ai[t]||(S.ai[t]={cd:1,wave:0,nx:0,kn:new Set()});A.cd-=dt;if(A.cd>0)return;A.cd=([3,2,1.2][diff])*(1+(t-1)*.05);const R=S.res[t],my=[],vil=[],arm=[],fish=[],scouts=[],galleys=[],bl=[];let tc=null;for(const u of S.us)if(u&&u.t===t&&u.hp>0&&U[u.k]){my.push(u);if(u.k==='vil'&&!u.ld)vil.push(u);else if(!u.ld&&!U[u.k].sh&&u.k!=='scout'&&u.k!=='king'&&u.k!=='cart'&&!u.retreating)arm.push(u);if(u.k==='fish'&&!u.ld)fish.push(u);if(u.k==='scout'&&!u.ld)scouts.push(u);if(u.k==='gal'&&!u.ld)galleys.push(u)}for(const b of S.bs)if(b.t===t){bl.push(b);if(b.k==='tc'&&b.hp>0&&(!tc||(!tc.done&&b.done)))tc=b}if(!tc)return;
const hostileFleet=[],hostileShips=[],humanArmy=[],humanShips=[];let navalThreatCount=0;for(const e of S.us){if(!e||!Number.isInteger(e.t)||!isHostile(t,e.t)||e.hp<=0||!U[e.k])continue;if(!e.ld&&!U[e.k].sh)humanArmy.push(e);if(U[e.k].sh){if(!e.ld&&e.k!=='fish')hostileShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4)humanShips.push(e);if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4){navalThreatCount++;hostileFleet.push(e)}}}
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
 if(transfer){R[transfer.k]-=transfer.amount;S.res[transfer.ally][transfer.k]+=transfer.amount;A.lastTributeAt=S.t}
}
aiRetreat(t,my,tc,bl);
const damagedFleet=my.filter(u=>u.sh&&u.hp>0&&u.hp<mhp(u)*.55&&u.o!=='rep').sort((a,b)=>a.hp/mhp(a)-b.hp/mhp(b));
if(damagedFleet.length&&!my.some(u=>u.sh&&u.o==='rep')){
 const target=damagedFleet[0],underFire=S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&U[e.k]?.sh&&Math.hypot(e.x-target.x,e.y-target.y)<10);
 if(!underFire){
  const repairer=my.find(u=>u!==target&&u.sh&&u.hp>mhp(u)*.7&&u.o==='i'&&!['fish','trn','cog'].includes(u.k));
  if(repairer){repairer.o='rep';repairer.tg=target;repairer.p=[]}
 }
}
const cnt=k=>bl.filter(b=>b.k===k&&b.hp>0).length;
if(popOf(t)+queuedPopulation(t)+5>capOf(t)&&bl.filter(b=>b.k==='house'&&b.hp>0&&!b.done).length<1+(vil.length>=18)+(vil.length>=28))aiBuild(vil,'house',t);
if(tc.done&&!tc.rs&&!aiTownTechReady(t,tc,vil.length)&&Array.isArray(tc.q)&&vil.length+tc.q.filter(q=>q&&q.k==='vil').length<([18,28,40][diff]*PERS[aip].v|0)&&Array.isArray(tc.q)&&tc.q.length<2&&!(AG[S.age[t]+1]&&new Set(S.bs.filter(x=>x.t===t&&x.done&&x.hp>0&&AG[S.age[t]+1].needs.includes(x.k)&&B[x.k]&&(B[x.k].age||0)===S.age[t]).map(x=>x.k)).size>=2&&R.f>=AG[S.age[t]+1].cost.f))train(tc,'vil');
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
   if(S.wt[ix]!==1||S.nd[ix]||S.g[ix])continue;
   let danger=30;for(const e of hostileFleet)danger=Math.min(danger,Math.hypot(e.x-(x+.5),e.y-(y+.5)));
   spots.push({x,y,score:danger-Math.hypot(x-s.x,y-s.y)*.18+(S.ex[ix]?0.15:0)});
  }
  spots.sort((a,b)=>b.score-a.score);
  let route=null;for(const spot of spots.slice(0,8)){route=path(s,gp(spot.x+.5,spot.y+.5,1.2));if(route&&route.length)break;route=null}
  if(route){s.o='m';s.tg=null;s.p=route;s.fleeUntil=S.t+10}
 }
}
for(const s of fish.filter(u=>u.o==='i'&&S.t>=(u.fleeUntil||0))){let n=findNode(s,'f',32);if(!n&&R.w>=100){deployFishTrap([s]);n=findNode(s,'f',32)}if(n){const route=path(s,goalNear(n,1));if(route){s.o='g';s.tg=n;s.ct='f';s.p=route;s.rp=1;s.ret=0}}}
for(const s of scouts.filter(u=>u.o==='i')){const x=2+S.r()*(W-4),y=2+S.r()*(H-4),p=path(s,gp(x,y,2.5));if(p){s.o='m';s.p=p}}
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
  const ix=y*W+x;if(S.wt[ix]!==1||S.nd[ix]||S.g[ix])continue;
  let clearance=30;for(const e of hostileFleet)clearance=Math.min(clearance,Math.hypot(e.x-(x+.5),e.y-(y+.5)));
  spots.push({x,y,score:clearance-Math.hypot(x-ship.x,y-ship.y)*.12});
 }
 spots.sort((a,b)=>b.score-a.score);
 let escape=null;for(const spot of spots.slice(0,6)){escape=path(ship,gp(spot.x+.5,spot.y+.5,1.2));if(escape&&escape.length)break;escape=null}
 if(escape){ship.o='m';ship.tg=null;ship.p=escape;ship.navalFallbackUntil=S.t+20}
}
const ptc=S.bs.filter(b=>isHostile(t,b.t)&&b.k==='tc'&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y))[0],focusCounts=new Map();for(const u of galleys)if(u.o==='a'&&u.tg)focusCounts.set(u.tg,(focusCounts.get(u.tg)||0)+1);for(const ship of galleys.filter(u=>(u.o==='i'||(u.o==='m'&&!u.tg)||(u.o==='a'&&(!u.tg||u.tg.hp<=0||u.tg.ld||!isHostile(t,u.tg.t))))&&(u.hp/mhp(u)>=.32||S.t>=(u.navalFallbackUntil||0)))){const navalTargetScore=e=>Math.hypot(e.x-ship.x,e.y-ship.y)-(e.k==='gal'?6:0)+(U[e.k].dmg>=4?0:10)-Math.min(3,focusCounts.get(e)||0)*4;let enemy=null,enemyScore=Infinity;for(const candidate of hostileShips){const score=navalTargetScore(candidate);if(score<enemyScore){enemyScore=score;enemy=candidate}}if(enemy&&Math.hypot(enemy.x-ship.x,enemy.y-ship.y)<28){ship.o='a';ship.tg=enemy;ship.p=[];focusCounts.set(enemy,(focusCounts.get(enemy)||0)+1);continue}if(!ptc)continue;const p=path(ship,(x,y)=>S.wt[y*W+x]&&Math.hypot(x-ptc.x,y-ptc.y)<18);if(p&&p.length){ship.o='m';ship.p=p}}}
if(vil.length>=7&&S.bs.filter(b=>b.t===t&&b.k==='bar'&&b.hp>0).length<1+(arm.length>=8)+(arm.length>=16))aiBuild(vil,'bar',t);else if(cnt('bar')&&vil.length>=10&&cnt('rng')<1+(arm.length>=12)&&(arm.length>=4))aiBuild(vil,'rng',t);if(vil.length>=6&&cnt('lumber')<1+(S.t>600)+(S.t>1200)+(S.t>1800))aiNear(vil,'lumber',['w'],t);else if(vil.length>=8&&cnt('mill')<1+(S.t>900)+(S.t>1800))aiNear(vil,'mill',['f'],t);else if(vil.length>=11&&cnt('mine')<1+(S.t>600)+(S.t>1200)+(S.t>1800))aiNear(vil,'mine',['g','s'],t);
else if(cnt('rng')&&S.age[t]>=1&&vil.length>=12&&!cnt('stable')&&(arm.length>=4))aiBuild(vil,'stable',t);else if(cnt('bar')&&S.age[t]>=1&&vil.length>=12&&!cnt('smith')&&(arm.length>=4))aiBuild(vil,'smith',t);else if(S.age[t]>=1&&cnt('tower')<PERS[aip].tw&&vil.length>=12)aiBuild(vil,'tower',t);else if(S.age[t]>=2&&!cnt('castle')&&vil.length>=14)aiBuild(vil,'castle',t);else if(S.age[t]>=2&&!cnt('monastery')&&vil.length>=14)aiBuild(vil,'monastery',t);else if(S.age[t]>=2&&!cnt('siege')&&vil.length>=16)aiBuild(vil,'siege',t);else if(S.age[t]>=2&&!cnt('univ')&&cnt('smith')&&vil.length>=18)aiBuild(vil,'univ',t);else if(vm===1&&S.age[t]>=3&&!cnt('wonder')&&vil.length>=20)aiBuild(vil,'wonder',t);else if(S.age[t]>=1&&!cnt('market')&&vil.length>=14)aiBuild(vil,'market',t);
if(S.age[t]>=1&&S.t>420&&vil.length>=12&&cnt('tower')<PERS[aip].tw&&can(t,B.tower.cost))aiBuild(vil,'tower',t);
if(PERS[aip].cv&&S.age[t]>=1&&cnt('bar')&&!cnt('stable')&&vil.length>=10&&(arm.length>=4||R.w>=B.stable.cost.w+100)&&can(t,B.stable.cost))aiBuild(vil,'stable',t);
if(PERS[aip].rg&&cnt('bar')&&cnt('rng')<2&&vil.length>=10&&(arm.length>=4||R.w>=B.rng.cost.w+100)&&can(t,B.rng.cost))aiBuild(vil,'rng',t);
{const g=AG[S.age[t]+1];if(g&&!tc.rs&&vil.length>=8&&new Set(S.bs.filter(x=>x.t===t&&x.done&&x.hp>0&&g.needs.includes(x.k)&&B[x.k]&&(B[x.k].age||0)===S.age[t]).map(x=>x.k)).size>=2&&can(t,g.cost))research(tc,'age')}
const humanCav=humanArmy.filter(u=>CAVARM.has(u.k)).length,humanRanged=humanArmy.filter(u=>['arc','xbow','lbow','skirm','mgd','genoa','jan','hcan','conq'].includes(u.k)).length,humanSiege=humanArmy.filter(u=>['ram','mang','scor','treb','bomb','cata'].includes(u.k)).length,humanInf=humanArmy.filter(u=>['mil','spear','pike','halb','woad','bers','huskarl','jaguar','saml','tk','axe','gbeto'].includes(u.k)).length;
const queuedUnits=k=>bl.reduce((n,b)=>n+(b.hp>0&&Array.isArray(b.q)?b.q.filter(q=>q&&q.k===k).length:0),0);
for(const b of bl)if(b.done&&b.hp>0&&B[b.k]?.tr&&b.k!=='tc'&&!b.rs&&Array.isArray(b.q)&&b.q.length<2){const o=trOf(b).filter(k=>U[k].age<=S.age[t]&&k!=='trn'&&(k!=='fish'||my.filter(u=>u.k==='fish').length+queuedUnits('fish')<3)&&(k!=='gal'||my.filter(u=>u.k==='gal').length+queuedUnits('gal')<Math.min(12,Math.max(4,2+2*navalThreatCount)))&&(k!=='scout'||my.filter(u=>u.k==='scout').length+queuedUnits('scout')<2)&&(k!=='cart'||(my.filter(u=>u.k==='cart').length+queuedUnits('cart')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='market'&&b2.done&&b2.hp>0)))&&(k!=='cog'||(my.filter(u=>u.k==='cog').length+queuedUnits('cog')<2&&S.bs.some(b2=>b2.t!==t&&b2.k==='dock'&&b2.done&&b2.hp>0))));if(o.length){const isDock=b.k==='dock',enemyShips=humanShips.length,counterPlans=isDock?(enemyShips?[{threat:enemyShips,units:['gal']}]:[]):[{threat:humanCav,minimum:2,units:['halb','pike','spear','camel'],own:['halb','pike','spear','camel']},{threat:humanRanged,minimum:3,units:['skirm','knight','cata'],own:['skirm','knight','cata']},{threat:humanSiege,minimum:1,units:['knight','mil','scout'],own:['knight','mil','scout']},{threat:humanInf,minimum:4,units:['mang','scor','arc'],own:['mang','scor','arc']}].filter(p=>p.threat>=p.minimum).map(p=>({...p,score:p.threat-my.filter(u=>p.own.includes(u.k)).length*2})).sort((a,b)=>b.score-a.score);const counterChoices=counterPlans.flatMap(p=>p.units.map(k=>({k,score:p.score,owned:my.filter(u=>u.k===k).length}))).filter(q=>o.includes(q.k)).sort((a,b)=>(b.score-a.score)+(a.owned-b.owned)*4);train(b,counterChoices[0]?.k||pickW(o))}}
const techPriority=k=>{
 const base={loom:76,wheel:79,handcart:75,gath:86,axe:82,saw:78,gmine:74,smine:66,coll:75,plow:70,crop:60,carry:58,atkM:62,atkR:62,atkM2:72,atkR2:72,armI:60,armR:60,armC:60,man:65,longs:66,twohand:65,champ:64,cons:62,pike:63,halb:66,husb:64,blood:68,squires:64,arson:56,arb:65,elsk:64,lcav:62,cavl:65,siegeup:54,crane:50,mas:52,slit:45,fw:35,gtow:40,keep:36,navalAtk:55,navalHull:57};
 let score=base[k]||20;
 if(k==='pike'&&humanCav>=2)score+=90;
 if(k==='halb'&&humanCav>=2)score+=85;
 const ownInf=arm.filter(u=>INFARM.has(u.k)).length,ownRanged=arm.filter(u=>ARCHARM.has(u.k)).length,ownCav=arm.filter(u=>CAVARM.has(u.k)).length;
 if(k==='husb'&&ownCav>=3)score+=22;
 if(k==='blood'&&ownCav>=3)score+=26;
 if(k==='squires'&&ownInf>=3)score+=22;
 if(k==='arson'&&ownInf>=4)score+=18;
 if(k==='elsk'&&humanRanged>=4)score+=60;
 /* Avoid spending scarce resources on upgrades for unit classes not yet fielded. */
 if(k==='husb'&&ownCav<2)score-=24;
 if(k==='blood'&&ownCav<2)score-=26;
 if(k==='squires'&&ownInf<2)score-=24;
 if(k==='arson'&&ownInf<3)score-=24;
 if(k==='armR'&&ownRanged<2)score-=28;
 if(k==='armI'&&ownInf<2)score-=28;
 if(k==='armC'&&ownCav<2)score-=28;
 if(k==='atkM'&&ownInf+ownCav<2)score-=20;
 if(k==='atkR'&&ownRanged<2)score-=20;
 if(k==='atkM2'&&ownInf+ownCav<2)score-=28;
 if(k==='atkR2'&&ownRanged<2)score-=28;
 /* Armour research should protect the army we actually field, not just react to the enemy's composition. */
 if(k==='armR'&&ownRanged>=3)score+=32;
 if(k==='armI'&&ownInf>=3)score+=30;
 if(k==='armC'&&ownCav>=3)score+=32;
 if(k==='armI'&&humanRanged>=3)score+=12;
 if(k==='armR'&&humanInf>=4)score+=10;
 if((k==='twohand'||k==='champ')&&humanInf>=3)score+=22;
 if(k==='cons'&&arm.length>=8)score+=24;
 if(k==='atkM'&&ownInf>=4)score+=24;
 if(k==='atkR'&&ownRanged>=4)score+=24;
 if(k==='siegeup'&&humanSiege>=1)score+=42;
 if(k==='navalHull'&&humanShips.length)score+=95;
 if(k==='navalAtk'&&humanShips.length)score+=105;
 if(k==='atkM'&&humanInf>=4)score+=18;
 if(k==='atkR'&&humanRanged>=4)score+=18;
 if(k==='loom'&&vil.length>=5)score+=16;
 if(k==='wheel'&&vil.length>=8)score+=18;
 if(k==='handcart'&&vil.length>=12)score+=20;
 if(k==='gath'&&vil.length>=8)score+=15;
 if(k==='axe'&&vil.length>=4)score+=12;
 if(k==='carry'&&vil.length>=12)score+=12;
 if(k==='mas'&&bl.some(b=>b.k==='tc'&&b.hp<b.mh*.8))score+=15;
 return score
};
for(const b of bl)if(b.done&&b.hp>0&&rsOf(b).length&&!b.rs&&(!Array.isArray(b.q)||!b.q.length)){
 const choices=rsOf(b).filter(k=>{const e=TE[k];return!!e&&!S.tech[t][k]&&!bl.some(other=>other.rs&&other.rs.k===k)&&e.age<=S.age[t]&&(!e.pre||S.tech[t][e.pre])&&can(t,e.cost)});
 choices.sort((a,b)=>techPriority(b)-techPriority(a));
 if(choices.length)research(b,choices[0])
}
const wk=k=>vil.filter(u=>u.o==='g'&&u.ct===k).length;
/* Repair important damaged buildings with a small number of idle villagers when construction is not already waiting. */
if(!bl.some(b=>!b.done&&b.hp>0)&&S.t-(A.lastBuildingRepair??-99)>=4){
 const priority={tc:10,castle:9,tower:8,gate:7,wall:6,monastery:5,market:5,lumber:4,mine:4,mill:4,dock:4,bar:3,rng:3,stable:3,siege:3,house:2};
 const repairSites=bl.concat(S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.done&&b.hp>0&&['tc','castle','tower','market','mill','lumber','mine','dock','wall','gate'].includes(b.k))),target=repairSites.filter(b=>b.done&&b.hp>0&&b.hp<b.mh*.65&&!vil.some(v=>v.o==='b'&&v.tg===b)&&!S.us.some(e=>e&&Number.isInteger(e.t)&&isHostile(t,e.t)&&e.hp>0&&!e.ld&&U[e.k]?.dmg>3&&Math.hypot(e.x-(b.x+b.s/2),e.y-(b.y+b.s/2))<8))
  .sort((a,b)=>((priority[b.k]||1)+(1-b.hp/b.mh)*3)-((priority[a.k]||1)+(1-a.hp/a.mh)*3))[0];
 if(target){
  const builders=vil.filter(v=>v.o==='i'&&!v.ld).sort((a,b)=>Math.hypot(a.x-(target.x+target.s/2),a.y-(target.y+target.s/2))-Math.hypot(b.x-(target.x+target.s/2),b.y-(target.y+target.s/2)));
  let assigned=0;for(const v of builders){if(Math.hypot(v.x-(target.x+target.s/2),v.y-(target.y+target.s/2))>26)continue;const route=path(v,goalNear(target,1));if(!route)continue;v.o='b';v.tg=target;v.p=route;v.rp=1;assigned++;if(assigned>=2)break}
  if(assigned)A.lastBuildingRepair=S.t
 }
}
for(const v of vil)if(v.o==='i'){let buildRoute=null,buildChecks=0;const ub=bl.find(b=>{if(b.done||b.hp<=0||vil.some(u=>u.o==='b'&&u.tg===b))return false;if(++buildChecks>8)return false;buildRoute=path(v,goalNear(b,1));return !!buildRoute});if(ub){v.o='b';v.tg=ub;v.p=buildRoute;v.rp=1;continue}const nv=vil.length;let k=wk('f')<(S.age[t]>=1&&arm.length<6?Math.max(8,nv*.45|0):Math.max(5,nv*.32|0))?'f':wk('w')<Math.max(6,nv*.3|0)?'w':wk('g')<Math.max(3,nv*.2|0)?'g':wk('s')<Math.max(2,nv*.1|0)&&S.age[t]>=1?'s':'f',n=findNode(v,k,36);
if(k==='f'&&R.w>=60+((S.age[t]>=1&&cnt('bar')&&arm.length<6)?50:0)&&(!n||S.nodes.filter(m=>m.fm&&m.amt>0&&Math.hypot(m.x-tc.x,m.y-tc.y)<12).length<Math.max(4,nv*.25|0)))for(let i=0,pf=0;i<20&&!pf;i++){const x=(tc.x+1+(S.r()-.5)*14)|0,y=(tc.y+1+(S.r()-.5)*14)|0;if(Math.hypot(x-tc.x,y-tc.y)>3&&!cor(tc,x,y)&&okPlace(t,'farm',x,y)){const farm=addN('f',x,y,farmFood(t),1);if(!farm)continue;pay(t,B.farm.cost);farm.t=t;n=farm;pf=1}}
if(!n){k='w';n=findNode(v,'w',30)}if(n){let route=path(v,goalNear(n,1));if(!route){let attempts=0;for(const alternative of S.nodes){if(alternative===n||alternative.amt<=0||!['f','w','g','s'].includes(alternative.k)||Math.hypot(alternative.x-v.x,alternative.y-v.y)>36)continue;if(++attempts>12)break;const candidate=path(v,goalNear(alternative,1));if(candidate){n=alternative;route=candidate;break}}}if(route){v.o='g';v.tg=n;v.ct=n.k;v.p=route;v.rp=1;v.ret=0}}}
/* Villagers evacuate from nearby raiders, then resume their previous work once they reach safety. */
for(const v of vil){
 if(v.hp<=0||v.ld||v.o==='B')continue;
 /* Single-pass nearest-raider scan avoids filter/map/sort allocations for every villager. */
 let threat=null;
 for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(t,e.t)||!(U[e.k]?.dmg>3))continue;const d=Math.hypot(e.x-v.x,e.y-v.y);if(!threat||d<threat.d)threat={e,d}}
 if(v.aiEvac){
  const ev=v.aiEvac,near=threat&&threat.d<7,safe=ev.shelter&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))<3;
  if(!near&&(safe||S.t>=ev.until)){
   const target=ev.tg,valid=target&&(target.s?target.hp>0:target.amt>0);
   v.o=valid?ev.o:'i';v.tg=valid?target:null;v.ct=ev.ct||v.ct;v.p=[];v.rp=0;v.aiEvac=null;
  }else if(near&&ev.shelter&&Math.hypot(v.x-(ev.shelter.x+ev.shelter.s/2),v.y-(ev.shelter.y+ev.shelter.s/2))>3&&(!v.p||!v.p.length)){
   const route=path(v,goalNear(ev.shelter,1));if(route){v.o='m';v.tg=ev.shelter;v.p=route}
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
  route=path(v,gp(x,y,1.2));if(route){v.aiEvac={o:v.o,tg:v.tg,ct:v.ct,shelter:null,until:S.t+8};v.o='m';v.tg=null;v.p=route}
  continue;
 }
 v.aiEvac={o:v.o,tg:v.tg,ct:v.ct,shelter,until:S.t+18};v.o='m';v.tg=shelter;v.p=route;v.rp=1;
}
aiRebal(vil,R,t);{let thr=false,intr=null,best=Infinity;for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(t,e.t)||!(U[e.k]?.dmg>3))continue;const d=Math.hypot(e.x-tc.x,e.y-tc.y);if(d<12)thr=true;if(d<13){const score=d-(['ram','mang','scor','treb','bomb'].includes(e.k)?8:0);if(score<best){best=score;intr=e}}}if(thr){if(intr)for(const d of arm)if(d.o==='i'&&Math.hypot(d.x-tc.x,d.y-tc.y)<18){d.o='a';d.tg=intr;d.p=[]}for(const v of vil.concat(my.filter(u=>u.k==='king')))if(v.o!=='B'&&!v.ld&&Math.hypot(v.x-tc.x,v.y-tc.y)<16&&(tc.cg||[]).length<15){v.o='B';v.tg=tc;v.p=[]}A.gu=S.t}else if(tc.cg&&tc.cg.length&&S.t-(A.gu||0)>15)unload(tc)}
/* Allied AI kingdoms now send a limited relief detachment to threatened allied Town Centres and Castles. */
const alliedBases=S.bs.filter(b=>b.t!==t&&diplomacyRelation(t,b.t)==='ally'&&b.hp>0&&b.done&&['tc','castle','tower','market','mill','lumber','mine','dock'].includes(b.k));
let distress=null;
for(const base of alliedBases){
 let intruder=null,best=Infinity;const bx=base.x+base.s/2,by=base.y+base.s/2;
 for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(t,e.t)||!(U[e.k]?.dmg>3))continue;const d=Math.hypot(e.x-bx,e.y-by);if(d>=13)continue;const score=d-(['ram','mang','scor','treb','bomb'].includes(e.k)?7:0);if(score<best){best=score;intruder=e}}
 if(intruder){distress={base,enemy:intruder};break}
}
if(distress&&S.t-(A.lastAllyHelp??-99)>=6){
 const responders=arm.filter(u=>u.o==='i'&&!u.retreating&&!u.ld&&u.k!=='mon'&&Math.hypot(u.x-(distress.base.x+distress.base.s/2),u.y-(distress.base.y+distress.base.s/2))<32)
  .sort((a,b)=>Math.hypot(a.x-distress.base.x,a.y-distress.base.y)-Math.hypot(b.x-distress.base.x,b.y-distress.base.y)).slice(0,8);
 for(const u of responders){u.o='a';u.tg=distress.enemy;u.p=[]}
 if(responders.length)A.lastAllyHelp=S.t;
}
/* Local anti-raid response: defend remote economic sites without pulling the entire army off its main plan. */
const economicSites=bl.filter(b=>b.done&&b.hp>0&&['lumber','mine','mill','market','house','tc','castle','tower','gate','wall','dock'].includes(b.k))
 .concat(S.nodes.filter(n=>n.fm&&n.t===t&&n.amt>0));
let raid=null;
for(const site of economicSites){
 let intruder=null;const sx=site.x+(site.s||0)/2,sy=site.y+(site.s||0)/2;
 for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(t,e.t)||!(U[e.k]?.dmg>3))continue;const d=Math.hypot(e.x-sx,e.y-sy);if(d<8.5&&(!intruder||d<intruder.d))intruder={e,d}}
 if(intruder){raid={site,e:intruder.e};break}
}
if(raid&&S.t-(A.lastRaidDefense??-99)>=8){
 const defenders=arm.filter(u=>u.o==='i'&&!u.retreating&&!u.ld&&Math.hypot(u.x-raid.site.x,u.y-raid.site.y)<21)
  .sort((a,b)=>Math.hypot(a.x-raid.site.x,a.y-raid.site.y)-Math.hypot(b.x-raid.site.x,b.y-raid.site.y)).slice(0,4);
 for(const u of defenders){u.o='a';u.tg=raid.e;u.p=[]}
 if(defenders.length)A.lastRaidDefense=S.t;
}
if(bl.some(b=>b.k==='market'&&b.done&&b.hp>0)){for(const k of['f','w','s']){if(R[k]>1100&&R.g<400)trade(t,k,'sell');else if(R[k]<80&&R.g>600&&k!=='s')trade(t,k,'buy')}}
if(A.stg){const wu=(A.wu||[]).filter(u=>u.hp>0&&u.k!=='mon'&&!u.retreating);if(wu.every(u=>u.o!=='m')||S.t-A.stg.t>50){for(const u of wu)if(u.o==='m'||u.o==='i'){u.o='a';u.tg=['ram','mang','scor','treb','bomb'].includes(u.k)&&A.stg.siegeT&&A.stg.siegeT.hp>0?A.stg.siegeT:A.stg.tg;u.p=[]}A.stg=null}}
{A.kn=A.kn||new Set();for(const b of S.bs)if(isHostile(t,b.t)&&b.hp>0&&!A.kn.has(b)&&my.some(u=>Math.hypot(u.x-b.x,u.y-b.y)<9))A.kn.add(b);
if(A.on){A.wu=A.wu.filter(u=>u.hp>0);if(A.wu.length<A.ws*.4){A.on=0;for(const u of A.wu){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.tg=null}}A.nx=S.t+[240,180,120][diff];note('The enemy army is retreating!')}else if(A.wu.every(u=>u.o==='i'))A.on=0}
if(A.rd){A.rd.u=A.rd.u.filter(u=>u.hp>0);if(A.rd.u.length<2||S.t-A.rd.t>150){for(const u of A.rd.u){const p=path(u,gp(tc.x+1,tc.y+5,3));if(p){u.o='m';u.p=p;u.tg=null}}A.rd=null}}
else if(S.t>(A.rn||420*PERS[aip].r)&&S.age[t]>=1){const pt=arm.filter(u=>u.o==='i'&&['knight','camel','mgd','cata','arc','xbow','skirm','lbow','spear','pike','halb','ram','mang','scor','treb','bomb','ele','tk','jan','hcan'].includes(u.k)).slice(0,10),tg2=[...A.kn].filter(b=>b.hp>0&&['lumber','mine','mill','house','market','dock'].includes(b.k)).sort((a,b)=>Math.hypot(a.x-tc.x,a.y-tc.y)-Math.hypot(b.x-tc.x,b.y-tc.y))[0];if(pt.length>=4&&tg2){A.rd={u:pt,t:S.t};A.rn=S.t+[300,220,150][diff]*PERS[aip].r;for(const u of pt){u.o='a';u.tg=tg2;u.p=[]}}}}
const enemyBs=S.bs.filter(b=>isHostile(t,b.t)&&b.hp>0).sort((x,y)=>Math.hypot(x.x-tc.x,x.y-tc.y)-Math.hypot(y.x-tc.x,y.y-tc.y)),need=Math.round(([14,20,26][diff]+A.wave*[3,4,5][diff])*PERS[aip].n),tgt=vm===5?{x:W/2,y:H/2,t:-1,k:'hill',hp:1}:((vm===1&&enemyBs.find(b=>b.k==='wonder'&&b.done))||enemyBs.find(b=>b.k==='tc')||enemyBs.find(b=>b.done)||enemyBs[0]);
if(arm.length>=need&&tgt&&S.t>=(A.nx||0)){A.wave++;A.nx=S.t+(vm===5?[180,150,120][diff]:[300,240,180][diff])*PERS[aip].g;A.wu=arm.slice();A.ws=arm.length;A.on=1;const sx=vm===5?W/2:tc.x+(tgt.x-tc.x)*.35,sy=vm===5?H/2:tc.y+(tgt.y-tc.y)*.35,sv=fm,sol=arm.filter(u=>u.k!=='mon');fm=1+((S.r()*3)|0)%3;sol.forEach((u,i)=>{const fo=vm===5?[(i%5-2),((Math.floor(i/5)%5)-2)]:fslot(sol,i,sx,sy),p=path(u,gp(sx+fo[0],sy+fo[1],1.2));if(p){u.o='m';u.p=p}else{u.o='a';u.tg=tgt;u.p=[]}});fm=sv;const siegeT=enemyBs.find(b=>b.k==='castle'&&b.done)||enemyBs.find(b=>b.k==='tower'&&b.done)||enemyBs.find(b=>b.k==='tc'&&b.done)||tgt;A.stg={t:S.t,tg:tgt,siegeT};for(const u of arm)if(u.k==='mon'){const p=path(u,goalNear(tgt,7));if(p){u.o='m';u.p=p}}}}
