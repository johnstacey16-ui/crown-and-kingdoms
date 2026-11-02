/* Xbox selection, shortcut, and contextual radial policy.
 * Extracted verbatim from js/input.js; polling, mappings, and per-frame dispatch
 * remain in js/input.js. Classic scripts share the same lexical environment. */
/* Xbox controller interaction state and selection policy helpers.
 * State is kept session-local; no save, command, or button mapping changes. */
let aDown=null,lastTap=0,lastTapK=null,boxR=null,cgo=null,vpWheel=null,yc=0,yDown=false,ysc={vb:'house',tb:{}},mmF=0,mmM=0,omr='pause',tsc=0,tcI=0;
function cancelSelectionGesture(){aDown=boxR=null;lastTap=0;lastTapK=null}
function cancelShortcutGesture(){yDown=false;yc=0}
function cancelGameplayGestures(){cancelSelectionGesture();cancelShortcutGesture();vpWheel=null;window.CK_AUTH_LOBBY?.suspend?.()}
const SIEGE=['ram','mang','scor','treb','bomb'],ECO=['house','farm','lumber','mine','mill','market','dock','palisade','wall','gate','outpost'];
const isMil=u=>u&&u.t===0&&u.hp>0&&!u.ld&&U[u.k]&&!['vil','fish','trn','king','mon','cart','cog'].includes(u.k);
const onScr=(x,y)=>{const p=w2s(x,y);return p[0]>-20&&p[0]<CW+20&&p[1]>-20&&p[1]<CH+20};
const focus=a=>ctr(a.x+(a.s||0)/2,a.y+(a.s||0)/2);
function nearV(x,y){let b=null,bd=1e9;for(const u of S.us)if(u&&u.t===0&&u.hp>0&&!u.ld&&u.k==='vil'){const d=Math.hypot(u.x-x,u.y-y)+(u.o==='i'?-20:0);if(d<bd){bd=d;b=u}}return b}
const bLock=k=>{const d=B[k];if(!d)return 'Building unavailable';const req=k==='farm'?'mill':d.req;return k==='wonder'&&vm!==1?'Wonder victory is off':d.age>S.age[0]?'Needs '+AG[d.age].n:req&&!S.bs.some(b=>b&&b.t===0&&b.hp>0&&b.k===req&&b.done)?'Needs '+B[req].n:''};
function selectedBuilders(){return controlGroupMembers(S.sel).filter(u=>u.k==='vil'&&S.us.includes(u))}

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
const b=s[0];if(b.q){if(!b.done)return;const l=trOf(b);if(!l.length)return note('Nothing to train here');let i=ysc.tb[b.k]|0;if(cyc){ysc.tb[b.k]=(i+1)%l.length;return note('Y trains: '+unitName(l[ysc.tb[b.k]],b.t))}const k=l[i%l.length];if(U[k].age>S.age[0])return note('Requires '+AG[U[k].age].n);const ok=trainSelection(b,k,P[6]?5:1);if(ok)note(unitName(k,b.t)+(ok>1?' x'+ok:'')+' queued');return}
// The Xbox Y shortcut is available for multiple military units only.
// Other formations remain reachable through the command menu.
if(cyc)return;
const military=s.filter(u=>S.us.includes(u)&&isMil(u));
if(military.length<2||military.length!==s.length)return;
reformMilitarySelection(military)}
function siteMenu(wx,wy){const t=pick(wx,wy),it=[],mk=(l,fn)=>it.push({l,c:{},lk:'',fn:()=>{menu=null;fn()}});const give=(arr,fn)=>{if(!arr.length)return note('No such units');const sv=S.sel;S.sel=arr;fn();S.sel=sv};
const mil=()=>S.us.filter(u=>isMil(u)&&!SIEGE.includes(u.k)&&!U[u.k].sh),sg=()=>S.us.filter(u=>u.t===0&&!u.ld&&SIEGE.includes(u.k)),nv=()=>S.us.filter(u=>u.t===0&&!u.ld&&u.k==='gal');
if(t&&t.t>0){mk('Attack with military',()=>give(mil(),()=>orderSel(t,wx,wy)));mk('Attack with siege',()=>give(sg(),()=>orderSel(t,wx,wy)));mk('Attack with navy',()=>give(nv(),()=>orderSel(t,wx,wy)));if(!t.q)mk('Send Monk to convert',()=>give(S.us.filter(u=>u.t===0&&!u.ld&&u.k==='mon'),()=>orderSel(t,wx,wy)))}
else if(t&&t.amt>0){const selected=S.sel.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);mk(selected.length?'Send selected villagers to gather ('+selected.length+')':'Send Villager to gather',()=>{if(selected.length)give(selected,()=>orderSel(t,wx,wy));else{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(t,wx,wy));else note('No villagers')}});const dk=t.k==='w'?'lumber':(t.k==='g'||t.k==='s')?'mine':'mill';mk('Build '+B[dk].n+' here',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];place={k:dk}});mk('Send flare',()=>{S.flare={x:wx,y:wy,t:S.t};note('Flare sent')})}
else{if(t&&t.t===0&&t.sh&&t.hp<U[t.k].hp)mk('Repair damaged ship',()=>{const vs=S.sel.filter(u=>u.k==='vil');if(vs.length)give(vs,()=>orderSel(t,wx,wy));else note('Select villagers to repair the ship')});mk('Build...',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];openMenu();if(menu){menu.rad=1;menu.pg=0}});mk('Send military here',()=>give(mil(),()=>orderSel(null,wx,wy)));mk('Attack-move military here',()=>give(mil(),()=>patrol(wx,wy,true)));mk('Attack-move siege here',()=>give(sg(),()=>patrol(wx,wy,true)));mk('Attack-move navy here',()=>give(nv(),()=>patrol(wx,wy,true)));mk('Send navy here',()=>give(nv(),()=>orderSel(null,wx,wy)));mk('Send siege here',()=>give(sg(),()=>orderSel(null,wx,wy)));mk('Send Villager here',()=>{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(null,wx,wy))})}
return{title:t&&t.t>0?'Target':t&&t.amt>0?'Resource':'Command',i:0,items:it}}
function openRadial(wx,wy){cancelGameplayGestures();const target=pick(wx,wy),hasVillagers=S.sel.some(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);if(target&&target.amt>0&&!target.fi&&hasVillagers){menu=siteMenu(wx,wy);menu.rad=1;menu.pg=0}else if(S.sel.length){openMenu();if(menu){menu.rad=1;menu.pg=0}}else{menu=siteMenu(wx,wy);menu.rad=1;menu.pg=0}}
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

