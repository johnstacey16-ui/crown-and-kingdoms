/* Xbox selection, shortcut, and contextual radial policy.
 * Shared contextual order policy; polling, mappings and per-frame dispatch
 * remain in js/input.js. Classic scripts share the same lexical environment. */
function pick(wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return null;let b=null,bd=.9;for(const u of S.us)if(u&&u.hp>0&&vis(u)&&!u.ld){const d=Math.hypot(u.x-wx,u.y-wy);if(d<bd){bd=d;b=u}}if(b)return b;
for(const q of S.bs)if(q&&q.hp>0&&(q.t===0||S.ex[q.y*W+q.x])&&wx>=q.x-.3&&wx<=q.x+q.s+.3&&wy>=q.y-.3&&wy<=q.y+q.s+.3)return q;
const i=(wy|0)*W+(wx|0),n=S.nd[i];if(n&&S.ex[i]&&n.amt>0)return n;return S.rel.find(q=>!q.m&&!q.c&&S.ex[(q.y|0)*W+(q.x|0)]&&Math.hypot(q.x-wx,q.y-wy)<.9)||null}
function orderSel(tg,wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return false;const us=S.sel.filter(e=>e&&!e.q&&e.hp>0&&!e.ld&&e.t===0);if(!us.length){
 const mule=S.sel.find(b=>b&&b.k==='mule'&&b.t===0&&b.hp>0&&b.done&&S.bs.includes(b));
 if(mule){const moved=orderMuleCart(mule,Math.floor(wx),Math.floor(wy));if(moved)note('Mule Cart moving');return moved}
 const buildings=[...new Set(S.sel.filter(b=>b&&S.bs.includes(b)&&b.hp>0&&b.t===0&&b.done&&Array.isArray(b.q)&&B[b.k]?.tr?.length))];if(!buildings.length)return false;const rallyTarget=tg&&(tg.amt>0||validTradePartner(0,tg))?tg:null;for(const b of buildings)b.rally={x:wx,y:wy,t:rallyTarget};fx.push({x:wx,y:wy,l:.5,k:'p'});note(buildings.length>1?'Rally point set for '+buildings.length+' buildings':'Rally point set');return true}
const tradeTarget=validTradePartner(0,tg);
/* A foreign trade order is only valid for a selection of matching merchants. */
const tradeOnly=tradeTarget&&us.every(u=>u.k===(tg.k==='market'?'cart':'cog'));
if(tg&&tg.t>0&&(tg.q||U[tg.k])&&!isHostile(0,tg.t)&&!tradeOnly){
 const allied=diplomacyRelation(us[0].t,tg.t)==='ally',
  canRepairBuilding=allied&&!!tg.q&&(!tg.done||tg.hp<tg.mh)&&us.some(u=>u.k==='vil'),
  canRepairShip=allied&&!!tg.sh&&tg.hp<mhp(tg)&&us.some(u=>u.k==='vil'||(u.sh&&u!==tg));
 if(!canRepairBuilding&&!canRepairShip){note('That kingdom is not hostile; villagers can help repair allied buildings or ships');return false}
}
/* Reuse identical same-tile, same-goal A* results within one formation order. */
const formationRoutes=new Map();
let sharedFormationPaths=0,sharedFallbackPaths=0;
/* A blocked formation slot should not strand an entire group: try the common
   destination after the individual slot, reusing same-tile paths across units. */
const fallbackRoutes=new Map();
/* Land and naval units form independent ranks, avoiding water/land slot mixing. */
const landFormation=us.filter(u=>!u.sh),navalFormation=us.filter(u=>u.sh);
const landSlots=formationSlots(landFormation,wx,wy),navalSlots=formationSlots(navalFormation,wx,wy);
/* Share formation goal predicates for units assigned the same destination slot. */
const formationGoals=new Map(),fallbackGoals=new Map();
const cachedGoal=(cache,x,y,r)=>{const key=x+','+y+','+r;let goal=cache.get(key);if(!goal){goal=gp(x,y,r);cache.set(key,goal)}return goal};
let landIndex=0,navalIndex=0;
let noAttackBlocked=0,noRouteCount=0,fallbackCount=0;for(const u of us){const unitIndex=u.sh?navalIndex++:landIndex++;u.p=[];u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;
if(tradeTarget&&u.k===(tg.k==='market'?'cart':'cog')){
 if(!assignTradeRoute(u,tg)){note('Merchant needs a reachable home depot and foreign trading partner');u.o='i';u.tg=null;}
 continue
}
if(tg&&tg.t>0&&diplomacyRelation(u.t,tg.t)==='ally'){
 if((u.k==='vil'||u.k==='serjeant'&&tg.k==='donjon'&&tg.t===u.t&&S.civ?.[u.t]===34)&&tg.q&&(!tg.done||tg.hp<tg.mh)){u.o='b';u.tg=tg;continue}
 if(tg.sh&&tg.hp<mhp(tg)&&(u.k==='vil'||(u.sh&&u!==tg))){u.o='rep';u.tg=tg;continue}
 u.o='i';u.tg=null;u.p=[];continue
}
if(tg&&tg.t>0){if(u.st===4){u.o='i';u.tg=null;u.p=[];noAttackBlocked++;continue}if(u.st===2)u.st=0;if(u.k==='mon'){if(!beginConversion([u],tg)){u.o='i';u.tg=null;resetConversion(u);note('Cannot convert that target; check research and faith');}continue}u.o='a';u.tg=tg}
else if(u.k==='mon'&&u.rel&&tg&&['monastery','fchurch'].includes(tg.k)&&tg.t===u.t&&tg.hp>0&&tg.done){u.o='r';u.tg=tg}
else if(tg&&tg.rl&&u.k==='mon'&&!tg.c&&!tg.m){u.o='r';u.tg=tg}
else if(tg&&tg.amt>0&&((u.k==='vil'&&!tg.fi)||(u.k==='fish'&&tg.fi))){
  // Group-clicking one farm never makes every selected villager work it.
  if(!resourceHasWorksite(u,tg)){
   const alternative=findReachableAutoNode(u,'f',36);
   if(alternative){if(u.ct!==alternative.n.k)u.car=0;u.o='g';u.tg=alternative.n;u.ct=alternative.n.k;u.ret=0;u.p=alternative.route;u.rp=1}
   else{u.o='i';u.tg=null;u.p=[];u.rp=0}
   continue;
  }
  if(u.ct!==tg.k)u.car=0;u.o='g';u.tg=tg;u.ct=tg.k;u.ret=0
 }
else if(tg&&tg.t===0&&tg.sh&&tg.hp<mhp(tg)&&(u.k==='vil'||(u.sh&&u!==tg))){u.o='rep';u.tg=tg}
else if(tg&&tg.q&&tg.t===0&&(!tg.done||tg.hp<tg.mh)&&(u.k==='vil'||u.k==='serjeant'&&tg.k==='donjon'&&S.civ?.[u.t]===34)){u.o='b';u.tg=tg}
else if(tg&&tg.t===0&&((U[tg.k]?.cap&&tg.t===u.t)||(tg.q&&GAR[tg.k]&&tg.done))&&!u.sh&&u!==tg&&!U[u.k].cap){u.o='B';u.tg=tg}
else if(u.k==='trn'&&Array.isArray(u.cg)&&u.cg.some(c=>c&&c.hp>0&&c.ld===u&&c.t===u.t&&U[c.k]&&!U[c.k].sh)&&Number.isFinite(wx)&&Number.isFinite(wy)&&wx>=0&&wy>=0&&wx<W&&wy<H&&S.wt[(wy|0)*W+(wx|0)]!==1){const landing=transportLandingRoute(u,wx,wy);if(landing?.route?.length){u.o='U';u.ut=[wx,wy];u.unloadBeach=landing.beach;u.p=landing.route;u.rp=1;u.unloadRouteRetryAt=0}else note('No water route to that landing area')}
else{const i=unitIndex,fo=(u.sh?navalSlots:landSlots)(i),gx=wx+fo[0],gy=wy+fo[1],gl=r=>cachedGoal(formationGoals,gx,gy,r);
const routeKey=[u.t,u.sh?1:0,u.x|0,u.y|0,gx,gy].join(':');
let p=formationRoutes.get(routeKey);
if(p!==undefined)sharedFormationPaths++;
if(p===undefined){p=path(u,gl(.8))||path(u,gl(2));formationRoutes.set(routeKey,p||null)}
if(!p){
 const fallbackKey=[u.t,u.sh?1:0,u.x|0,u.y|0,wx,wy].join(':');
 p=fallbackRoutes.get(fallbackKey);
 if(p!==undefined)sharedFallbackPaths++;
 if(p===undefined){p=path(u,cachedGoal(fallbackGoals,wx,wy,.8))||path(u,cachedGoal(fallbackGoals,wx,wy,2));fallbackRoutes.set(fallbackKey,p||null)}
 if(p)fallbackCount++;
}
if(p)p=p.slice();if(p){u.o='m';u.p=p;if(u.k==='cart'||u.k==='cog'){u.manualTradeMove=true;u.tradePaused=false;}}else noRouteCount++}}
if(window.CK_PATH_DIAGNOSTICS&&typeof window.CK_PATH_DIAGNOSTICS.recordFormation==='function')window.CK_PATH_DIAGNOSTICS.recordFormation(us.length,sharedFormationPaths,sharedFallbackPaths);
if(noRouteCount)note(noRouteCount===1?'No route to that location':noRouteCount+' selected units could not reach their destinations');
if(fallbackCount)note(fallbackCount+' unit'+(fallbackCount===1?'':'s')+' moved toward the group destination instead of blocked formation slots');
if(noAttackBlocked)note('No Attack stance blocked '+noAttackBlocked+' attack order'+(noAttackBlocked===1?'':'s'));ackCmd(S.sel[0]);fx.push({x:wx,y:wy,l:.5,k:'p'});return true}

/* Solo march waypoints append real A* legs to the existing saved movement
 * path. Active jobs, battles, transports, trade and multiplayer retain their
 * original commands. A failed leg never destroys an in-progress march. */
function queueMarchWaypoint(wx,wy){
 if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return false;
 if(window.CK_NET?.isRunning?.()){note('Queued march waypoints are solo-only for now');return false}
 const units=[...new Set(S.sel.filter(u=>isMil(u)&&S.us.includes(u)&&!u.retreating&&(u.o==='i'||u.o==='m')))];
 if(!units.length){note('Select living idle or moving soldiers or warships to queue a waypoint');return false}
 let queued=0,blocked=0;
 for(const u of units){
  const old=u.o==='m'&&Array.isArray(u.p)&&u.p.length?u.p:null;
  const last=old?.[old.length-1];
  const validLast=Array.isArray(last)&&last.length===2&&last.every(Number.isFinite);
  const origin=validLast?{x:last[0],y:last[1],t:u.t,sh:u.sh}:u;
  const route=path(origin,gp(wx,wy,.8))||path(origin,gp(wx,wy,2));
  if(!route?.length){blocked++;continue}
  const append=old&&validLast&&route[0][0]===last[0]&&route[0][1]===last[1]?route.slice(1):route;
  if((old?.length||0)+append.length>Math.min(W*H,512)){blocked++;continue}
  if(!append.length){queued++;continue}
  u.p=old?old.concat(append):append;
  u.o='m';u.tg=null;u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;u.rp=0;
  queued++;
 }
 if(queued){fx.push({x:wx,y:wy,l:.5,k:'p'});note('March waypoint queued for '+queued+' unit'+(queued===1?'':'s')+(blocked?' ('+blocked+' could not route)':''))}
 else note('No route to that waypoint, or the route is too long');
 return queued>0;
}
function controlGroupMembers(group,current=null){
 if(!S||!Array.isArray(group))return [];
 const world=current||new Set([...S.us,...S.bs]);
 return [...new Set(group)].filter(e=>e&&world.has(e)&&e.t===0&&e.hp>0&&!e.ld);
}
function trainSelection(anchor,kind,count=1){
 if(mode!=='play'||!S||!U[kind]||![1,5].includes(count)||!S.sel.includes(anchor)||!S.bs.includes(anchor)||anchor.t!==0)return 0;
 const buildings=[...new Set(S.sel)].filter(b=>b&&S.bs.includes(b)&&b.t===0&&b.hp>0&&b.done&&Array.isArray(b.q)&&!b.rs&&B[b.k]?.tr?.includes(kind));
 let queued=0;
 for(let i=0;i<count;i++){
  // Keep production balanced across the selected compatible buildings. Stable
  // ties preserve selection order; train() owns costs, capacity and legality.
  const ordered=buildings.slice().sort((a,b)=>a.q.length-b.q.length);
  let accepted=false;
  for(const b of ordered)if(train(b,kind)){queued++;accepted=true;break;}
  if(!accepted)break;
 }
 return queued;
}
/* Reform now around each movement class's own centre. Use the normal movement
 * planner so collision, blocked-slot fallbacks and path diagnostics stay shared.
 * Temporary order selections must never leak into the player's selection. */
function reformMilitarySelection(units){
 if(mode!=='play'||!S||!Array.isArray(units))return false;
 const eligible=controlGroupMembers(units).filter(u=>S.us.includes(u)&&isMil(u));
 if(eligible.length<2||eligible.length!==units.length||
    eligible.some(u=>!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=W||u.y>=H))return false;
 const selected=S.sel;
 fm=fm===1?5:1;
 try{
  // A fleet and a land army may be on opposite sides of a shoreline. Never
  // send both towards a combined centre that is invalid for one movement class.
  for(const group of [eligible.filter(u=>!u.sh),eligible.filter(u=>u.sh)]){
   if(!group.length)continue;
   const x=group.reduce((sum,u)=>sum+u.x,0)/group.length,y=group.reduce((sum,u)=>sum+u.y,0)/group.length;
   S.sel=group;orderSel(null,x,y);
  }
 }finally{S.sel=selected}
 note('Formation: '+FMN[fm]);return true;
}
function openMenu(){const s=S.sel[0];if(!s)return note('Select a villager or building first (A)');
if(s.q){const d=B[s.k];if(!s.done||!(d.tr||d.rs||d.tx||GAR[s.k]))return note('Nothing to do here');
const it=trOf(s).map(k=>{const age=unitEffectiveAge(s.t,k),lk=age>S.age[0]?'Needs '+AG[age].n:'';return{l:unitName(k,s.t),c:unitTrainingCost(s.t,k),lk,fn:()=>{if(lk)return note(lk);const ok=trainSelection(s,k,P[6]?5:1);if(ok)note(unitName(k,s.t)+(ok>1?' x'+ok:'')+' queued')}}});
if(s.k==='mule')it.push(
  {l:'Move Mule Cart',c:{},lk:'',fn:()=>{menu=null;pat=6;note('Choose a land tile and press A to move (B cancels)')}},
  {l:'Follow nearby resources',c:{},lk:'',fn:()=>{if(resumeMuleCart(s))note('Mule Cart following nearby resources');menu=null}},
  {l:'Stop Mule Cart',c:{},lk:'',fn:()=>{if(stopMuleCart(s))note('Mule Cart stopped');menu=null}});
 if(s.k==='tc'){it.push({l:'Town Bell: Garrison villagers',c:{},lk:'',fn:()=>{townBell(s.t);menu=null}});const g=AG[S.age[0]+1];it.push({l:g?'Advance: '+g.n:'Imperial Age reached',c:g?g.cost:{},lk:g?(ageRequirements(0).ready?'':'Needs two different current-age buildings'+(g.single?' or one Castle':'')):'Done',fn:()=>{if(g&&research(s,'age'))note('Advancing to '+g.n+'...')}})}
for(const k of rsOf(s)){const e=TE[k],age=researchEffectiveAge(s,k),lk=S.tech[0][k]?'Done':age>S.age[0]?'Needs '+AG[age].n:e.pre&&!S.tech[0][e.pre]?'Needs '+TE[e.pre].n:'';it.push({l:e.n,c:researchCost(s,k),lk,fn:()=>{if(lk)return note(lk);if(research(s,k))note('Researching '+e.n)}})}
if(d.tx)for(const r of mkTrades())it.push(r);
if(s.k==='mill'&&S.civ?.[s.t]===39)it.push({l:'Garrison nearby sheep',c:{},lk:'',
 fn:()=>{const ok=typeof garrisonLivestockMill==='function'&&garrisonLivestockMill(s);
  note(ok?'Sheep sheltered in Mill — passive food enabled':'No nearby herdable sheep or Mill is full')} });
if(s.cg&&s.cg.length&&GAR[s.k])it.push({l:'Unload garrison ('+s.cg.length+')',c:{},lk:'',fn:()=>{unload(s);menu=null}});
menu={title:d.n,b:s,i:0,items:it}}
else if(S.sel.length&&S.sel.every(u=>u.k==='fish'))menu={title:'Fishing Ship',i:0,items:[{l:'Deploy Fish Trap (-100 Wood)',c:{w:100},lk:'',fn:()=>{deployFishTrap(S.sel);menu=null}},{l:'Stop fishing',c:{},lk:'',fn:()=>{stopSel();menu=null}}]}
else if(selectedBuilders('donjon').length)menu={title:'Build',i:0,items:(selectedBuilders().length?[...ECO,'bar','rng','stable','siege','smith','univ','castle','tower','monastery','wonder','tc','fchurch','mule']:['donjon']).filter(k=>civilizationBuildingAllowed(k,0)).map(k=>{const d=B[k];
return{l:d.n,c:civilizationBuildingCost(k,0),get lk(){return bLock(k)},fn:()=>{const currentLock=bLock(k);if(currentLock)return note(currentLock);if(!selectedBuilders(k).length)return note(k==='donjon'?'Select a Sicilian Serjeant or villager':'Select an available villager');if(!can(0,civilizationBuildingCost(k,0)))return note('Not enough resources');menu=null;place={k}}}})}
else menu={title:'Soldiers',i:0,items:[{l:'Stop',c:{},lk:'',fn:()=>{stopSel();menu=null}},{l:'Regroup here',c:{},lk:'',fn:()=>{regroup();menu=null}},{l:'Queue march waypoints',c:{},lk:'',fn:()=>{menu=null;pat=5;note('Move camera to each waypoint and press A to add; B finishes. Idle or moving military only.')}},{l:'Patrol to cursor point',c:{},lk:'',fn:()=>{menu=null;pat=1;note('Move the cursor to the patrol point, then A (B cancels)')}},{l:'Follow friendly target',c:{},lk:'',fn:()=>{menu=null;pat=3;note('Move the cursor to a friendly unit/building, then A (B cancels)')}},{l:'Guard friendly target',c:{},lk:'',fn:()=>{menu=null;pat=4;note('Move the cursor to a friendly unit/building, then A (B cancels)')}},{l:'Stance: Aggressive',c:{},lk:'',fn:()=>setStance(0)},{l:'Stance: Defensive',c:{},lk:'',fn:()=>setStance(1)},{l:'Stance: Stand ground',c:{},lk:'',fn:()=>setStance(2)},{l:'Stance: Passive',c:{},lk:'',fn:()=>setStance(3)},{l:'Stance: No Attack',c:{},lk:'',fn:()=>setStance(4)},{l:'Formation: '+FMN[fm]+' (change)',c:{},lk:'',fn:()=>{fm=(fm+1)%FMN.length;menu=null;note('Formation: '+FMN[fm])}},{l:'Attack Move',c:{},lk:'',fn:()=>{menu=null;pat=2;note('Move the cursor to the target point, then A (B cancels)')}},{l:'Auto-scout (scouts)',c:{},lk:'',fn:()=>{for(const u of S.sel)if(u.k==='scout'||u.k==='mgd')u.as=1;menu=null;note('Auto-scouting on; any order turns it off')}}]}
if(menu&&menu.title==='Soldiers'&&S.civ?.[0]===38&&
 S.sel.some(u=>u&&u.t===0&&u.hp>0&&!u.ld&&['ratha','rathaM'].includes(u.k))){
 const first=S.sel.find(u=>u&&u.t===0&&u.hp>0&&!u.ld&&['ratha','rathaM'].includes(u.k)),
       targetMode=first.k==='ratha'?'melee':'ranged';
 menu.items.splice(1,0,{l:'Ratha: switch to '+targetMode,c:{},lk:'',
  fn:()=>{let count=0;for(const u of S.sel)if(typeof setRathaMode==='function'&&setRathaMode(u,targetMode))count++;
   menu=null;note(count+' Ratha'+(count===1?'':'s')+' switched to '+targetMode)}});
}
if(menu&&menu.title==='Soldiers'&&S.sel.some(u=>u.k==='cart'||u.k==='cog'))menu.items.splice(1,0,{l:'Resume automatic trading',c:{},lk:'',fn:()=>{let n=0;for(const u of S.sel)if(u.k==='cart'||u.k==='cog'){u.tradePaused=false;u.manualTradeMove=false;u.o='i';u.p=[];u.rp=0;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;n++}menu=null;note('Automatic trading resumed for '+n+' merchant'+(n===1?'':'s'))}});
if(menu&&menu.title==='Build'){const stop=Math.min(ECO.length,menu.items.length);menu.items.splice(stop,0,{l:'Stop (go idle)',c:{},lk:'',fn:()=>{stopSel();menu=null}});menu.pr=Array.from({length:Math.ceil(menu.items.length/12)},(_,i)=>[i*12,Math.min(menu.items.length,(i+1)*12)])}}

/* Xbox controller interaction state and selection policy helpers.
 * State is kept session-local; no save, command, or button mapping changes. */
let aDown=null,lastTap=0,lastTapK=null,boxR=null,cgo=null,vpWheel=null,yc=0,yDown=false,ysc={vb:'house',tb:{}},mmF=0,mmM=0,omr='pause',tsc=0,tcI=0;
function cancelSelectionGesture(){aDown=boxR=null;lastTap=0;lastTapK=null}
function cancelShortcutGesture(){yDown=false;yc=0}
function cancelGameplayGestures(){cancelSelectionGesture();cancelShortcutGesture();vpWheel=null;window.CK_AUTH_LOBBY?.suspend?.()}
const SIEGE=['ram','mang','scor','treb','bomb'],ECO=['house','farm','lumber','mine','mill','market','dock','palisade','wall','gate','outpost','feitoria','donjon','folwark','mule'];
const isMil=u=>u&&u.t===0&&u.hp>0&&!u.ld&&U[u.k]&&!['vil','fish','trn','king','mon','cart','cog'].includes(u.k);
const onScr=(x,y)=>{const p=w2s(x,y);return p[0]>-20&&p[0]<CW+20&&p[1]>-20&&p[1]<CH+20};
const focus=a=>ctr(a.x+(a.s||0)/2,a.y+(a.s||0)/2);
function nearV(x,y){let b=null,bd=1e9;for(const u of S.us)if(u&&u.t===0&&u.hp>0&&!u.ld&&u.k==='vil'){const d=Math.hypot(u.x-x,u.y-y)+(u.o==='i'?-20:0);if(d<bd){bd=d;b=u}}return b}
const bLock=k=>{const d=B[k];if(!d)return 'Building unavailable';if(!civilizationBuildingAllowed(k,0))return k==='donjon'?'Only Sicilians can construct a Donjon':k==='folwark'?'Only Poles can construct a Folwark':k==='mill'&&S.civ?.[0]===35?'Poles build Folwarks instead of Mills':k==='monastery'?'Build a Fortified Church instead':k==='fchurch'?'Only Armenians and Georgians build Fortified Churches':'Only Portuguese can construct a Feitoria';if(d.pop&&popOf(0)+d.pop>capOf(0))return 'Requires '+d.pop+' free population slots';if(k==='tc'&&vm===6)return 'Extra Town Centres disabled in Sudden Death';const req=k==='farm'?(S.civ?.[0]===35?'folwark':'mill'):d.req;return k==='wonder'&&vm!==1?'Wonder victory is off':d.age>S.age[0]?'Needs '+AG[d.age].n:req&&!S.bs.some(b=>b&&b.t===0&&b.hp>0&&b.k===req&&b.done)?'Needs '+B[req].n:''};
function selectedBuilders(kind=null){return controlGroupMembers(S.sel).filter(u=>S.us.includes(u)&&(u.k==='vil'||kind==='donjon'&&u.k==='serjeant'&&S.civ?.[u.t]===34))}

/* Xbox controller selection policy: category shortcuts, additive selection,
 * held-A box selection, double-tap select-like-kind and world commands.
 * Shared selection state stays in engine.js; no button mappings change. */
function quickSelectionChoices(k){
if(k==='idle')return S.us.filter(u=>u&&u.t===0&&u.hp>0&&!u.ld&&(u.k==='vil'||u.k==='fish')&&u.o==='i');
if(k==='support')return S.us.filter(u=>u&&u.t===0&&u.hp>0&&!u.ld&&u.k==='mon');
if(k==='tc')return S.bs.filter(b=>b&&b.t===0&&b.hp>0&&b.done&&b.k==='tc');
return S.us.filter(isMil)}
function qsel(k){cancelGameplayGestures();const l=quickSelectionChoices(k);if(k==='idle'){if(!l.length)return note('No idle villagers');const u=l[idleI++%l.length];S.sel=[u];focus(u);return}
if(k==='support'){if(!l.length)return note('No support units');S.sel=l;focus(l[0]);return}
if(k==='tc'){if(!l.length)return note('No completed town centres');const b=l[tcI++%l.length];S.sel=[b];focus(b);return}
if(!l.length)return note('No military units');S.sel=l;focus(l[0])}
function boxSel(r,add){cancelSelectionGesture();S.sel=controlGroupMembers(S.sel);const x0=Math.min(r.x0,r.x1),x1=Math.max(r.x0,r.x1),y0=Math.min(r.y0,r.y1),y1=Math.max(r.y0,r.y1),inb=(x,y,dy)=>{const p=w2s(x,y);return p[0]>=x0&&p[0]<=x1&&p[1]-dy>=y0&&p[1]-dy<=y1};let l=controlGroupMembers(S.us).filter(u=>inb(u.x,u.y,14*zm));if(!l.length)l=controlGroupMembers(S.bs).filter(b=>inb(b.x+b.s/2,b.y+b.s/2,0));if(add)l=controlGroupMembers(S.sel.concat(l));if(l.length){S.sel=l;ack(l[0])}}
function tapA(wx,wy,add){S.sel=controlGroupMembers(S.sel);const now=performance.now(),t=pick(wx,wy),own=t&&controlGroupMembers([t]).length>0;
if(own&&now>=lastTap&&now-lastTap<350&&lastTapK===t.k&&!add){const l=t.q?controlGroupMembers(S.bs).filter(b=>b.k===t.k&&onScr(b.x+b.s/2,b.y+b.s/2)):controlGroupMembers(S.us).filter(u=>u.k===t.k&&onScr(u.x,u.y));S.sel=l;note(l.length+' selected');lastTap=0;return}
lastTap=own?now:0;lastTapK=own?t.k:null;
if(own&&!(t.q&&(!t.done||t.hp<t.mh)&&selectedBuilders().length)){S.sel=add?controlGroupMembers(S.sel.concat([t])):[t];ack(t)}
else if(!orderSel(t,wx,wy))note('Select your units first (A on a unit)')}

/* Xbox Y shortcut, contextual command menu and R3 villager-priority wheel.
 * Preserve controller edges, resource orders and radial menu page semantics. */
function yShort(cyc){cancelSelectionGesture();const s=controlGroupMembers(S.sel);if(!s.length)return note('Select villagers, a building or soldiers for the Y shortcut');
if(s.some(u=>u.k==='vil')){const L=['house','palisade','wall','farm'];if(!L.includes(ysc.vb))ysc.vb='house';if(cyc){const i=L.indexOf(ysc.vb);ysc.vb=L[(i+1)%L.length];return note('Y builds: '+B[ysc.vb].n)}const k=ysc.vb,lk=bLock(k);if(lk)return note(lk);if(!can(0,B[k].cost))return note('Not enough resources');place={k};return}
const b=s[0];if(b.q){if(!b.done)return;const l=trOf(b);if(!l.length)return note('Nothing to train here');let i=ysc.tb[b.k]|0;if(cyc){ysc.tb[b.k]=(i+1)%l.length;return note('Y trains: '+unitName(l[ysc.tb[b.k]],b.t))}const k=l[i%l.length];if(unitEffectiveAge(b.t,k)>S.age[0])return note('Requires '+AG[unitEffectiveAge(b.t,k)].n);const ok=trainSelection(b,k,P[6]?5:1);if(ok)note(unitName(k,b.t)+(ok>1?' x'+ok:'')+' queued');return}
// The Xbox Y shortcut is available for multiple military units only.
// Other formations remain reachable through the command menu.
if(cyc)return;
const military=s.filter(u=>S.us.includes(u)&&isMil(u));
if(military.length<2||military.length!==s.length)return;
reformMilitarySelection(military)}
function siteMenu(wx,wy){const t=pick(wx,wy),it=[],mk=(l,fn)=>it.push({l,c:{},lk:'',fn:()=>{menu=null;fn()}});const give=(arr,fn)=>{if(!arr.length)return note('No such units');const sv=S.sel;S.sel=arr;fn();S.sel=sv};
const mil=()=>S.us.filter(u=>isMil(u)&&!SIEGE.includes(u.k)&&!U[u.k].sh),sg=()=>S.us.filter(u=>u.t===0&&!u.ld&&SIEGE.includes(u.k)),nv=()=>S.us.filter(u=>u.t===0&&!u.ld&&u.k==='gal');
if(t&&t.t>0){mk('Attack with military',()=>give(mil(),()=>orderSel(t,wx,wy)));mk('Attack with siege',()=>give(sg(),()=>orderSel(t,wx,wy)));mk('Attack with navy',()=>give(nv(),()=>orderSel(t,wx,wy)));if(!t.q)mk('Send Monk to convert',()=>give(S.us.filter(u=>u.t===0&&!u.ld&&u.k==='mon'),()=>orderSel(t,wx,wy)))}
else if(t&&t.amt>0){const selected=S.sel.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);mk(selected.length?'Send selected villagers to gather ('+selected.length+')':'Send Villager to gather',()=>{if(selected.length)give(selected,()=>orderSel(t,wx,wy));else{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(t,wx,wy));else note('No villagers')}});const dk=[41,42].includes(S.civ?.[0])&&(['w','g','s'].includes(t.k)||t.k==='f'&&t.an)?'mule':t.k==='w'?'lumber':(t.k==='g'||t.k==='s')?'mine':'mill';mk('Build '+B[dk].n+' here',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];place={k:dk}});mk('Send flare',()=>{S.flare={x:wx,y:wy,t:S.t};note('Flare sent')})}
else{if(t&&t.t===0&&t.sh&&t.hp<U[t.k].hp)mk('Repair damaged ship',()=>{const vs=S.sel.filter(u=>u.k==='vil');if(vs.length)give(vs,()=>orderSel(t,wx,wy));else note('Select villagers to repair the ship')});mk('Build...',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];openMenu();if(menu){menu.rad=1;menu.pg=0}});mk('Send military here',()=>give(mil(),()=>orderSel(null,wx,wy)));mk('Attack-move military here',()=>give(mil(),()=>patrol(wx,wy,true)));mk('Attack-move siege here',()=>give(sg(),()=>patrol(wx,wy,true)));mk('Attack-move navy here',()=>give(nv(),()=>patrol(wx,wy,true)));mk('Send navy here',()=>give(nv(),()=>orderSel(null,wx,wy)));mk('Send siege here',()=>give(sg(),()=>orderSel(null,wx,wy)));mk('Send Villager here',()=>{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(null,wx,wy))})}
return{title:t&&t.t>0?'Target':t&&t.amt>0?'Resource':'Command',i:0,items:it}}
function openRadial(wx,wy){cancelGameplayGestures();const target=pick(wx,wy),hasVillagers=S.sel.some(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);if(target&&target.amt>0&&!target.fi&&hasVillagers){menu=siteMenu(wx,wy)}else if(S.sel.length){openMenu()}else{menu=siteMenu(wx,wy)}if(menu){menu.rad=1;menu.pg=0}}
function openVillagerPriorityWheel(){
 if(!S||!S.vp)return false;
 cancelGameplayGestures();vpWheel={manual:false,sel:0};return true;
}
function operateVillagerPriorityWheel(){
 const w=vpWheel;if(!w)return false;
 if(E[11]){vpWheel=null;return true}
 if(E[3]){w.manual=!w.manual;w.sel=0;return true}
 if(E[2]){toggleVillagerAutomation();return true}
 const n=w.manual?4:VILLAGER_PRIORITY_PRESETS.length+1,sx=ax(0),sy=ax(1);
 if(Math.hypot(sx,sy)>.4){const a=(Math.atan2(sy,sx)+Math.PI/2+6.2832)%6.2832;w.sel=Math.floor(a/6.2832*n+.5)%n}
 if(w.manual){
  const resource=WORKER_TARGETS[w.sel];
  if(E[0])changeVillagerTarget(resource.k,1);
  if(E[1])changeVillagerTarget(resource.k,-1);
 }else{
  if(E[1]){vpWheel=null;return true}
  if(E[0]){if(w.sel===VILLAGER_PRIORITY_PRESETS.length)toggleAutomaticFarms();else applyVillagerPriorityPreset(w.sel);vpWheel=null}
 }
 return true;
}

