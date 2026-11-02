/* Crown & Kingdoms — controller polling, selection, orders and menu navigation. */
// Xbox default layout: left stick pans; right stick's vertical axis zooms.
// Shared by solo and multiplayer; these are local camera values, never orders.
function cameraZoomLevel(current,axis,dt){
 if(!Number.isFinite(axis)||!Number.isFinite(dt)||dt<=0)return current;
 return Math.max(.8,Math.min(3,current*Math.exp(-Math.max(-1,Math.min(1,axis))*1.2*Math.min(.1,dt))));
}
// A focus/connection change must not turn already-held gamepad buttons into new commands.
let padNeedsNeutral=false;
function readPad(){let g=null;try{const list=navigator.getGamepads?navigator.getGamepads():[];g=[...list].find(p=>p&&p.connected);gpErr=''}catch(e){gpErr=String(e&&e.name||e);if(pad&&pad.connected)g=pad}if(!g&&pad){pad=null;quarantineGamepadInput();return}const changed=!!(g&&pad&&(g.index!==pad.index||g.id!==pad.id))||!!(g&&!pad);pad=g||null;const n=pad&&pad.buttons?Array.from(pad.buttons,b=>!!(b&&(b.pressed||b.value>.5))):[];if(changed){if(typeof cancelGameplayGestures==='function')cancelGameplayGestures();prev=n.slice();RE=[];ER=n.map(()=>false);E=n.map(()=>false);padNeedsNeutral=n.some(Boolean);P=n.map(()=>false);return}
if(padNeedsNeutral){prev=n.slice();RE=n.map(()=>false);ER=n.map(()=>false);E=n.map(()=>false);P=n.map(()=>false);if(!n.some(Boolean))padNeedsNeutral=false;return}
const mp=i=>Number.isInteger(BM[i])&&BM[i]>=0&&BM[i]<n.length?BM[i]:i;RE=prev.map((_,i)=>{const j=mp(i);return!!(prev[j]&&!n[j])});ER=n.map((v,i)=>v&&!prev[i]);E=ER.map((_,i)=>ER[mp(i)]);P=n.map((_,i)=>!!n[mp(i)]);prev=n}
const ax=i=>{const raw=pad&&pad.axes?pad.axes[i]:0,v=Number.isFinite(raw)?Math.max(-1,Math.min(1,raw)):0,rawZone=i<2?dz:dzr,z=Number.isFinite(rawZone)?Math.max(0,Math.min(.95,rawZone)):.2;return Math.abs(v)<=z?0:Math.sign(v)*(Math.abs(v)-z)/(1-z)},tv=i=>{const v=pad&&pad.buttons[i]?pad.buttons[i].value:0;return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0};
window.addEventListener('gamepadconnected',()=>{prev=[];pad=null;gpErr='';});window.addEventListener('gamepaddisconnected',e=>{if(!pad||e.gamepad.index===pad.index){pad=null;quarantineGamepadInput();}});function quarantineGamepadInput(){prev=[];P=[];E=[];ER=[];RE=[];padNeedsNeutral=true;if(typeof cancelGameplayGestures==='function')cancelGameplayGestures();}
// Edge may hide/show an Xbox tab without a corresponding window focus event.
// Clear old edges immediately, then require every button to be released.
window.addEventListener('focus',quarantineGamepadInput);
window.addEventListener('blur',quarantineGamepadInput);
document.addEventListener('visibilitychange',quarantineGamepadInput);
function pick(wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return null;let b=null,bd=.9;for(const u of S.us)if(u&&u.hp>0&&vis(u)&&!u.ld){const d=Math.hypot(u.x-wx,u.y-wy);if(d<bd){bd=d;b=u}}if(b)return b;
for(const q of S.bs)if(q&&q.hp>0&&(q.t===0||S.ex[q.y*W+q.x])&&wx>=q.x-.3&&wx<=q.x+q.s+.3&&wy>=q.y-.3&&wy<=q.y+q.s+.3)return q;
const i=(wy|0)*W+(wx|0),n=S.nd[i];if(n&&S.ex[i]&&n.amt>0)return n;return S.rel.find(q=>!q.m&&!q.c&&S.ex[(q.y|0)*W+(q.x|0)]&&Math.hypot(q.x-wx,q.y-wy)<.9)||null}
function orderSel(tg,wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return false;const us=S.sel.filter(e=>e&&!e.q&&e.hp>0&&!e.ld&&e.t===0);if(!us.length){const b=S.sel[0];if(b&&b.hp>0&&b.t===0&&b.done&&B[b.k]?.tr){b.rally={x:wx,y:wy,t:tg&&tg.amt>0?tg:null};fx.push({x:wx,y:wy,l:.5,k:'p'});note('Rally point set');return true}return false}
const tradeTarget=!!(tg&&tg.q&&tg.done&&tg.hp>0&&(tg.k==='market'||tg.k==='dock')&&Number.isInteger(tg.t)&&tg.t>0&&tg.t<S.teamN&&!isHostile(0,tg.t));
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
 const endpoint=tg.k,dist2=b=>{const sz=b.s||0,dx=Math.max(b.x-u.x,0,u.x-b.x-sz),dy=Math.max(b.y-u.y,0,u.y-b.y-sz);return dx*dx+dy*dy};
 const homes=S.bs.filter(b=>b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0).map(b=>({b,d:dist2(b)})).sort((a,b)=>a.d-b.d);
 let home=null;for(let j=0;j<Math.min(24,homes.length);j++){const candidate=homes[j].b;if(path(u,goalNear(candidate,1))){home=candidate;break}}
 const route=home?path(u,goalNear(tg,1)):null;
 if(!route){note('Merchant needs a reachable home depot and foreign trading partner');u.o='i';u.tg=null;continue}
 const key=b=>[b.t,b.k,b.x,b.y].join(':');
 u.tradeFromKey=key(home);u.tradeDestKey=key(tg);u.tradeReturning=false;u.tradeCargo=0;u.tradePaused=false;u.manualTradeMove=false;u.tradeSourceWait=0;u.trWait=0;u.o='m';u.p=route;u.rp=1;continue
}
if(tg&&tg.t>0&&diplomacyRelation(u.t,tg.t)==='ally'){
 if(u.k==='vil'&&tg.q&&(!tg.done||tg.hp<tg.mh)){u.o='b';u.tg=tg;continue}
 if(tg.sh&&tg.hp<mhp(tg)&&(u.k==='vil'||(u.sh&&u!==tg))){u.o='rep';u.tg=tg;continue}
 u.o='i';u.tg=null;u.p=[];continue
}
if(tg&&tg.t>0){if(u.st===4){u.o='i';u.tg=null;u.p=[];noAttackBlocked++;continue}if(u.st===2)u.st=0;if(u.k==='mon'){if(!beginConversion([u],tg)){u.o='i';u.tg=null;resetConversion(u);note('Cannot convert that target; check research and faith');}continue}u.o='a';u.tg=tg}
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
else if(tg&&tg.q&&tg.t===0&&(!tg.done||tg.hp<tg.mh)&&u.k==='vil'){u.o='b';u.tg=tg}
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
const it=trOf(s).map(k=>{const lk=U[k].age>S.age[0]?'Needs '+AG[U[k].age].n:'';return{l:unitName(k,s.t),c:U[k].cost,lk,fn:()=>{if(lk)return note(lk);const ok=trainSelection(s,k,P[6]?5:1);if(ok)note(unitName(k,s.t)+(ok>1?' x'+ok:'')+' queued')}}});
if(s.k==='tc'){it.push({l:'Town Bell: Garrison villagers',c:{},lk:'',fn:()=>{townBell(s.t);menu=null}});const g=AG[S.age[0]+1];it.push({l:g?'Advance: '+g.n:'Imperial Age reached',c:g?g.cost:{},lk:g?(ageRequirements(0).ready?'':'Needs two different current-age buildings'+(g.single?' or one Castle':'')):'Done',fn:()=>{if(g&&research(s,'age'))note('Advancing to '+g.n+'...')}})}
for(const k of rsOf(s)){const e=TE[k],lk=S.tech[0][k]?'Done':e.age>S.age[0]?'Needs '+AG[e.age].n:e.pre&&!S.tech[0][e.pre]?'Needs '+TE[e.pre].n:'';it.push({l:e.n,c:researchCost(s,k),lk,fn:()=>{if(lk)return note(lk);if(research(s,k))note('Researching '+e.n)}})}
if(d.tx)for(const r of mkTrades())it.push(r);
if(s.cg&&s.cg.length&&GAR[s.k])it.push({l:'Unload garrison ('+s.cg.length+')',c:{},lk:'',fn:()=>{unload(s);menu=null}});
menu={title:d.n,b:s,i:0,items:it}}
else if(S.sel.length&&S.sel.every(u=>u.k==='fish'))menu={title:'Fishing Ship',i:0,items:[{l:'Deploy Fish Trap (-100 Wood)',c:{w:100},lk:'',fn:()=>{deployFishTrap(S.sel);menu=null}},{l:'Stop fishing',c:{},lk:'',fn:()=>{stopSel();menu=null}}]}
else if(selectedBuilders().length)menu={title:'Build',i:0,items:[...ECO,'bar','rng','stable','siege','smith','univ','castle','tower','monastery','wonder'].map(k=>{const d=B[k];
return{l:d.n,c:d.cost,get lk(){return bLock(k)},fn:()=>{const currentLock=bLock(k);if(currentLock)return note(currentLock);if(!selectedBuilders().length)return note('Select an available villager');if(!can(0,d.cost))return note('Not enough resources');menu=null;place={k}}}})}
else menu={title:'Soldiers',i:0,items:[{l:'Stop',c:{},lk:'',fn:()=>{stopSel();menu=null}},{l:'Regroup here',c:{},lk:'',fn:()=>{regroup();menu=null}},{l:'Patrol to cursor point',c:{},lk:'',fn:()=>{menu=null;pat=1;note('Move the cursor to the patrol point, then A (B cancels)')}},{l:'Follow friendly target',c:{},lk:'',fn:()=>{menu=null;pat=3;note('Move the cursor to a friendly unit, then A (B cancels)')}},{l:'Guard friendly target',c:{},lk:'',fn:()=>{menu=null;pat=4;note('Move the cursor to a friendly unit/building, then A (B cancels)')}},{l:'Stance: Aggressive',c:{},lk:'',fn:()=>setStance(0)},{l:'Stance: Defensive',c:{},lk:'',fn:()=>setStance(1)},{l:'Stance: Stand ground',c:{},lk:'',fn:()=>setStance(2)},{l:'Stance: Passive',c:{},lk:'',fn:()=>setStance(3)},{l:'Stance: No Attack',c:{},lk:'',fn:()=>setStance(4)},{l:'Formation: '+FMN[fm]+' (change)',c:{},lk:'',fn:()=>{fm=(fm+1)%FMN.length;menu=null;note('Formation: '+FMN[fm])}},{l:'Attack Move',c:{},lk:'',fn:()=>{menu=null;pat=2;note('Move the cursor to the target point, then A (B cancels)')}},{l:'Auto-scout (scouts)',c:{},lk:'',fn:()=>{for(const u of S.sel)if(u.k==='scout'||u.k==='mgd')u.as=1;menu=null;note('Auto-scouting on; any order turns it off')}}]}
if(menu&&menu.title==='Soldiers'&&S.sel.some(u=>u.k==='cart'||u.k==='cog'))menu.items.splice(1,0,{l:'Resume automatic trading',c:{},lk:'',fn:()=>{let n=0;for(const u of S.sel)if(u.k==='cart'||u.k==='cog'){u.tradePaused=false;u.manualTradeMove=false;u.o='i';u.p=[];u.rp=0;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;n++}menu=null;note('Automatic trading resumed for '+n+' merchant'+(n===1?'':'s'))}});
if(menu&&menu.title==='Build'){menu.items.splice(ECO.length,0,{l:'Stop (go idle)',c:{},lk:'',fn:()=>{stopSel();menu=null}});menu.pr=[[0,ECO.length+1],[ECO.length+1,menu.items.length]]}}
/* Local Xbox vibration and camera zoom are controller presentation details;
 * neither changes game-world coordinates, commands or saved game state. */
const rumbleOK=()=>!!(pad&&pad.vibrationActuator&&pad.vibrationActuator.playEffect);let lastRb=0;
function rumble(d,a,b){if(!rmb||!rumbleOK())return;const n=performance.now();if(n-lastRb<150)return;lastRb=n;try{const p=pad.vibrationActuator.playEffect('dual-rumble',{startDelay:0,duration:d,weakMagnitude:b,strongMagnitude:a});if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function setZoom(z){if(!Number.isFinite(z))return;z=cl(z,.8,3);const c=S?s2w(CW/2,CH/2):null;zm=z;TW=64*z;TH=32*z;if(c)ctr(c[0],c[1])}

/* Persist controller remap preferences; save slots belong to js/save.js. */
const sv=()=>{try{localStorage.setItem('ck_map',JSON.stringify(BM))}catch(e){}};

/* Xbox selection state and commands are owned by js/input-selection.js. */

/* In-match Xbox controller dispatch: camera, command/group wheels,
 * build placement, gestures and D-pad shortcuts. Function body preserved
 * from the engine; ctl(dt) remains the only mode-dispatch entry. */
function playCtl(dt){if(ov||cgo||menu||pat||place)cancelGameplayGestures();
if(vpWheel){operateVillagerPriorityWheel();return}
if(E[11]&&!P[6]&&!P[7]&&!P[4]&&!P[5]){openVillagerPriorityWheel();return}const lt=P[6],pa=0,py=3,rad=!!(menu&&menu.rad)||!!cgo,sp=650*cspd*(lt?.55:1);
if(ov){cur.x=cl(cur.x+ax(0)*sp*dt,0,CW);cur.y=cl(cur.y+ax(1)*sp*dt,0,CH)}
else if(!menu&&!cgo){
 const lx=ax(0),ly=ax(1);
 if(lx||ly){cur.x=CW/2;cur.y=CH/2;cam.x+=lx*700*camspd*dt;cam.y+=ly*700*camspd*dt}
 if(!lt&&ax(3))setZoom(cameraZoomLevel(zm,ax(3),dt));
 // Preserve pointer edge scrolling without assigning the right stick to panning.
 const ex=cur.x<20?-.8:cur.x>CW-20?.8:0,ey=cur.y<20?-.8:cur.y>CH-20?.8:0;
 cam.x+=ex*700*camspd*dt;cam.y+=ey*700*camspd*dt;
}
clampCam();
// A held selection box stays anchored to the map while the camera pans/zooms.
if(aDown&&Number.isFinite(aDown.wx)&&Number.isFinite(aDown.wy)){const anchor=w2s(aDown.wx,aDown.wy);aDown.x=anchor[0];aDown.y=anchor[1]}
const wxy=s2w(cur.x,cur.y),wx=wxy[0],wy=wxy[1];
if(ov){const o=ovr();if(E[3]){const mw=m2w(o,cur.x,cur.y);ctr(mw[0],mw[1]);yc=1;ov=0;return}if(E[1]||E[5]||E[8]){ov=0;return}if(E[12]){const mw=m2w(o,cur.x,cur.y);S.flare={x:mw[0],y:mw[1],t:S.t};note('Signal sent')}if(E[15]){mmF=(mmF+1)%3;note(['Minimap: full','Minimap: simple','Minimap: no terrain'][mmF])}if(E[14]){mmM=(mmM+1)%3;note(['Minimap: everything','Minimap: economy only','Minimap: military only'][mmM])}return}
if(cgo){const sx=ax(0),sy=ax(1);if(Math.hypot(sx,sy)>.45){const a=(Math.atan2(sy,sx)+Math.PI/2+6.2832)%6.2832;cgo.sel=Math.floor(a/6.2832*8+.5)%8}S.cg=S.cg||[];const sl=cgo.sel,live=()=>controlGroupMembers(S.cg[sl]);
if(E[2]&&sl>=0){S.cg[sl]=controlGroupMembers(S.sel);cgo.done=1;note('Group '+(sl+1)+' set ('+S.cg[sl].length+')')}if(E[3]&&sl>=0&&live().length){S.sel=live();focus(S.sel[0]);cgo.done=1;note('Group '+(sl+1)+' selected')}
if(RE[4]){if(!cgo.done&&sl>=0&&live().length){S.sel=live();note('Group '+(sl+1)+' selected')}cgo=null}if(E[1])cgo=null;return}
if(menu){const m=menu,{items,pr,pg,a0,n}=radialMenuPage(m);if(!n){if(E[0]||E[1]||(RE[7]&&m.rad))menu=null;return}const sx=ax(0),sy=ax(1);
if(Math.hypot(sx,sy)>.4){const a=(Math.atan2(sy,sx)+Math.PI/2+6.2832)%6.2832;m.i=a0+Math.floor(a/6.2832*n+.5)%n}else if(!Number.isInteger(m.i)||m.i<a0||m.i>=a0+n)m.i=a0;
if(E[3])yc=1;if(RE[7]&&m.rad){menu=null;return}if(E[0]){const choice=items[m.i];if(choice&&typeof choice.fn==='function')choice.fn();return}if(E[2]&&m.b)cancelQ(m.b);if(E[3]&&pr.length>1){m.pg=(pg+1)%pr.length;m.i=pr[m.pg][0]}if(E[1])menu=null;return}
if(pat){if(E[1])pat=0;else if(E[0]){if(pat===3||pat===4)orderGuardFollow(wx,wy,pat===3?'F':'G');else patrol(wx,wy,pat===2);pat=0}return}
if(place){if(E[1]){place=null;return}const s=B[place.k].s,lock=bLock(place.k);place.x=cl(Math.round(wx-s/2),0,W-s);place.y=cl(Math.round(wy-s/2),0,H-s);place.ok=!lock&&okPlace(0,place.k,place.x,place.y)&&can(0,B[place.k].cost);
if(E[0]){const k=place.k,d=B[k];if(lock)return note(lock);if(!okPlace(0,k,place.x,place.y))return note('Cannot build there');if(!can(0,d.cost))return note('Not enough resources');let vs=selectedBuilders();if(!vs.length){const v=nearV(place.x,place.y);if(v)vs=[v]}if(!vs.length)return note('No available villagers');pay(0,d.cost);
if(k==='farm'){const n=addN('f',place.x,place.y,farmFood(0),1);if(n)n.t=0;for(const u of vs){
 const own=n&&farmAvailableTo(u,n),other=!own?findReachableAutoNode(u,'f',36):null;
 if(own||other){u.o='g';u.tg=own?n:other.n;u.ct='f';u.p=own?[]:other.route;u.rp=own?0:1;u.ret=0;u.car=0}
 else{u.o='i';u.tg=null;u.p=[];u.rp=0}
 }}else{const b=addB(0,k,place.x,place.y,false);for(const u of vs){u.o='b';u.tg=b;u.p=[]}}
if(k!=='wall'&&!lt)place=null;note(d.n+' placed')}return}
if(E[5]){cancelGameplayGestures();ov=1;return}if(E[7]){openRadial(wx,wy);return}if(E[4]){cancelGameplayGestures();cgo={sel:-1,done:0};yc=1;return}
if(E[1]&&!lt){cancelGameplayGestures();S.sel=[];return}
if(E[8]){cancelGameplayGestures();omr='play';mode='obj';return}
if(E[3]){yc=0;yDown=true}if(yDown&&P[py]&&E[14]){yShort(true);yc=1}if(RE[py]){const executeShortcut=yDown&&!yc;yDown=false;if(executeShortcut)yShort(false);yc=0}
// LT is the Xbox selection/build/train modifier, not an economy/zoom layer.
// The dedicated R3 villager priorities wheel handles those bindings above.
if(!lt&&!P[7]&&!P[4]&&!P[py]){if(E[12])qsel('idle');if(E[15])qsel('support');if(E[13])qsel('tc');if(E[14])qsel('mil')}
if(E[0]){if(cur.x>=mm.x&&cur.y>=mm.y){const mw=m2w(mm,cur.x,cur.y);ctr(mw[0],mw[1])}else aDown={x:cur.x,y:cur.y,wx,wy}}
if(aDown&&P[pa]&&Math.hypot(cur.x-aDown.x,cur.y-aDown.y)>14)boxR={x0:aDown.x,y0:aDown.y,x1:cur.x,y1:cur.y};
if(aDown&&RE[pa]){if(boxR){boxSel(boxR,lt);boxR=null}else{const aw=s2w(aDown.x,aDown.y);tapA(aw[0],aw[1],lt)}aDown=null}
// X's contextual actions and R3's priorities wheel require their own Xbox
// behaviour; do not substitute an extra generic order or subgroup cycling.
if(E[10]){const pg=S.ping&&S.t-S.ping.t<30&&!S.sel.length;if(pg)ctr(S.ping.x,S.ping.y);else{const a=S.sel[0]||S.bs.find(b=>b.t===0&&b.k==='tc');if(a)focus(a)}}}

function ctl(dt){if(mode!=='play')cancelShortcutGesture();if(E.some(Boolean)&&aInit()&&AC.state==='suspended')AC.resume().catch(()=>{});if(mode!=='play'){if(E[12]||E[13]||E[14]||E[15])uis('move');else if(E[0])uis('ok');else if(E[1]||E[9])uis('back')}
if(mode==='remap'){if(rw){const b=ER.findIndex((v,i)=>v&&i!==9);if(b>=0){BM[RA[ri][0]]=b;rw=0;sv()}return}
if(ER[12])ri=(ri+RA.length-1)%RA.length;if(ER[13])ri=(ri+1)%RA.length;if(ER[0])rw=1;if(ER[2]){BM={};sv()}if(ER[9]||ER[1])mode=rbk;return}
if(mode==='obj'){if(E[0]||E[1]||E[8]||E[9]||E[5])mode=omr;return}
if(mode==='tree'){const TL=treeLines();if(E[13])tsc=Math.min(Math.max(0,TL.length-12),tsc+1);if(E[12])tsc=Math.max(0,tsc-1);if(E[1]||E[0]||E[9])mode='pause';return}
if(mode==='info'){if(E[0]||E[1]||E[9])mode='title';return}
if(mode==='title'){titleCtl();return}
if(mode==='multiplayer'){if(window.CK_NET)window.CK_NET.control(dt);else mode='title';return}
if(mode==='slots'){slotsCtl();return}
if(mode==='camp'){campCtl();return}
if(mode==='brief'){briefCtl();return}
if(mode==='setup'){setupCtl();return}
if(mode==='opts'){optsCtl();return}
if(mode==='end'){if(window.CK_NET&&window.CK_NET.snapshot().roomCode&&(E[0]||E[1])){window.CK_NET.leaveToTitle();return}if(E[0])endA();if(E[1])endB();return}
if(mode==='pause'){const PI=pmItems();if(E[12])pm=(pm+PI.length-1)%PI.length;if(E[13])pm=(pm+1)%PI.length;const it=PI[pm];if(E[14]&&it.l){it.l();sset()}if(E[15]&&it.r){it.r();sset()}if(E[0]&&it.a){it.a();sset()}if(E[9]||E[1])mode='play';return}
if(mode!=='play')return;
if(!pad){if(typeof canvasBenchmark!=='undefined'&&canvasBenchmark)stopCanvasBenchmark(true);cancelGameplayGestures();mode='pause';return}
// Keep a reproducible camera and unchanged selection/order state during the
// opt-in offline Series S benchmark. Menu or B cancels instantly; all standard
// Xbox controller bindings return immediately when the test is cancelled.
if(typeof canvasBenchmark!=='undefined'&&canvasBenchmark){
 if(E[9]||E[1]){stopCanvasBenchmark(true);cancelGameplayGestures();mode='pause';pm=0}
 return;
}
if(E[9]){cancelGameplayGestures();mode='pause';return}
playCtl(dt);return;}
/* ===== RENDERING ===== */
