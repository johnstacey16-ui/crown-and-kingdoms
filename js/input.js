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
/* Selection targeting, movement orders, formations and contextual menus: js/input-selection.js. */

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
if(pat){if(E[1])pat=0;else if(E[0]){if(pat===5)queueMarchWaypoint(wx,wy);else{if(pat===3||pat===4)orderGuardFollow(wx,wy,pat===3?'F':'G');else patrol(wx,wy,pat===2);pat=0}}return}
if(place){if(E[1]){place=null;return}
const d=place&&typeof place.k==='string'&&Object.prototype.hasOwnProperty.call(B,place.k)?B[place.k]:null;
if(!d||!Number.isInteger(d.s)||d.s<1||d.s>W||d.s>H){place=null;note('Building placement cancelled: unavailable building');return}
const s=d.s,lock=bLock(place.k);place.x=cl(Math.round(wx-s/2),0,W-s);place.y=cl(Math.round(wy-s/2),0,H-s);place.ok=!lock&&okPlace(0,place.k,place.x,place.y)&&can(0,d.cost);
if(E[0]){const k=place.k,d=B[k];if(lock)return note(lock);if(!okPlace(0,k,place.x,place.y))return note('Cannot build there');if(!can(0,d.cost))return note('Not enough resources');let vs=selectedBuilders(k);if(!vs.length){const v=nearV(place.x,place.y);if(v)vs=[v]}if(!vs.length)return note(k==='donjon'?'No available Sicilian Serjeants or villagers':'No available villagers');
if(k==='farm'){const n=addN('f',place.x,place.y,farmFood(0),1);
if(!n)return note('Cannot build there');
n.t=0;pay(0,d.cost);for(const u of vs){
 const own=farmAvailableTo(u,n),other=!own?findReachableAutoNode(u,'f',36):null;
 if(own||other){u.o='g';u.tg=own?n:other.n;u.ct='f';u.p=own?[]:other.route;u.rp=own?0:1;u.ret=0;u.car=0}
 else{u.o='i';u.tg=null;u.p=[];u.rp=0}
 }}else{const b=addB(0,k,place.x,place.y,false);if(!b)return note('Cannot build there');pay(0,d.cost);for(const u of vs){u.o='b';u.tg=b;u.p=[]}}
if(k!=='wall'&&!lt)place=null;note(d.n+' placed')}return}
if(E[5]){cancelGameplayGestures();ov=1;return}if(E[7]){openRadial(wx,wy);return}if(E[4]){cancelGameplayGestures();cgo={sel:-1,done:0};yc=1;return}
if(E[1]&&!lt){cancelGameplayGestures();S.sel=[];return}
if(E[8]){cancelGameplayGestures();omr='play';mode='obj';return}
if(E[3]){yc=0;yDown=true}if(yDown&&P[py]&&E[14]){yShort(true);yc=1}if(RE[py]){const executeShortcut=yDown&&!yc;yDown=false;if(executeShortcut)yShort(false);yc=0}
// LT is the Xbox selection/build/train modifier, not an economy/zoom layer.
// The dedicated R3 villager priorities wheel handles those bindings above.
if(!lt&&!P[7]&&!P[4]&&!P[py]){if(E[12])qsel('idle');if(E[15])qsel('support');if(E[13])qsel('tc');if(E[14])qsel('mil')}
if(E[0]){if(minimapContains(mm,cur.x,cur.y)){const mw=m2w(mm,cur.x,cur.y);ctr(mw[0],mw[1])}else aDown={x:cur.x,y:cur.y,wx,wy}}
if(aDown&&P[pa]&&Math.hypot(cur.x-aDown.x,cur.y-aDown.y)>14)boxR={x0:aDown.x,y0:aDown.y,x1:cur.x,y1:cur.y};
if(aDown&&RE[pa]){if(boxR){boxSel(boxR,lt);boxR=null}else{const aw=s2w(aDown.x,aDown.y);tapA(aw[0],aw[1],lt)}aDown=null}
// X's contextual actions and R3's priorities wheel require their own Xbox
// behaviour; do not substitute an extra generic order or subgroup cycling.
if(E[10]){const pg=S.ping&&S.t-S.ping.t<30&&!S.sel.length;if(pg)ctr(S.ping.x,S.ping.y);else{const a=S.sel[0]||S.bs.find(b=>b.t===0&&b.k==='tc');if(a)focus(a)}}}

function ctl(dt){if(mode!=='play')cancelShortcutGesture();if(E.some(Boolean)&&aInit()&&AC.state==='suspended')AC.resume().catch(()=>{});if(mode!=='play'){if(E[12]||E[13]||E[14]||E[15])uis('move');else if(E[0])uis('ok');else if((E[1]||E[9])&&mode!=='title')uis('back')}
if(mode==='remap'){if(rw){const b=ER.findIndex((v,i)=>v&&i!==9);if(b>=0){BM[RA[ri][0]]=b;rw=0;sv()}return}
if(ER[12])ri=(ri+RA.length-1)%RA.length;if(ER[13])ri=(ri+1)%RA.length;if(ER[0])rw=1;if(ER[2]){BM={};sv()}if(ER[9]||ER[1])mode=rbk;return}
if(mode==='obj'){if(E[0]||E[1]||E[8]||E[9]||E[5])mode=omr;return}
if(mode==='tree'){const TL=treeLines();if(E[13])tsc=Math.min(Math.max(0,TL.length-1),tsc+1);if(E[12])tsc=Math.max(0,tsc-1);if(E[1]||E[0]||E[9])mode='pause';return}
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
