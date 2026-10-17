/* Crown & Kingdoms — controller polling, selection, orders and menu navigation. */
function readPad(){let g=null;try{const list=navigator.getGamepads?navigator.getGamepads():[];g=[...list].find(p=>p&&p.connected);gpErr=''}catch(e){gpErr=String(e&&e.name||e);if(pad&&pad.connected)g=pad}const changed=!!(g&&pad&&(g.index!==pad.index||g.id!==pad.id))||!!(g&&!pad);pad=g||null;const n=pad&&pad.buttons?Array.from(pad.buttons,b=>!!(b&&(b.pressed||b.value>.5))):[];if(changed){prev=n.slice();RE=[];ER=n.map(()=>false);E=n.map(()=>false);P=n.slice();return}const mp=i=>Number.isInteger(BM[i])&&BM[i]>=0&&BM[i]<n.length?BM[i]:i;RE=prev.map((_,i)=>{const j=mp(i);return!!(prev[j]&&!n[j])});ER=n.map((v,i)=>v&&!prev[i]);E=ER.map((_,i)=>ER[mp(i)]);P=n.map((_,i)=>!!n[mp(i)]);prev=n}
const ax=i=>{const raw=pad&&pad.axes?pad.axes[i]:0,v=Number.isFinite(raw)?Math.max(-1,Math.min(1,raw)):0,rawZone=i<2?dz:dzr,z=Number.isFinite(rawZone)?Math.max(0,Math.min(.95,rawZone)):.2;return Math.abs(v)<=z?0:Math.sign(v)*(Math.abs(v)-z)/(1-z)},tv=i=>{const v=pad&&pad.buttons[i]?pad.buttons[i].value:0;return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0};
window.addEventListener('gamepadconnected',()=>{prev=[];pad=null;gpErr='';});window.addEventListener('gamepaddisconnected',e=>{if(!pad||e.gamepad.index===pad.index){pad=null;prev=[];P=[];E=[];ER=[];RE=[];}});window.addEventListener('focus',()=>{prev=[];});
function pick(wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return null;let b=null,bd=.9;for(const u of S.us)if(vis(u)&&!u.ld){const d=Math.hypot(u.x-wx,u.y-wy);if(d<bd){bd=d;b=u}}if(b)return b;
for(const q of S.bs)if((q.t===0||S.ex[q.y*W+q.x])&&wx>=q.x-.3&&wx<=q.x+q.s+.3&&wy>=q.y-.3&&wy<=q.y+q.s+.3)return q;
const i=(wy|0)*W+(wx|0),n=S.nd[i];if(n&&S.ex[i]&&n.amt>0)return n;return S.rel.find(q=>!q.m&&!q.c&&S.ex[(q.y|0)*W+(q.x|0)]&&Math.hypot(q.x-wx,q.y-wy)<.9)||null}
function orderSel(tg,wx,wy){if(!S||!Number.isFinite(wx)||!Number.isFinite(wy)||wx<0||wy<0||wx>=W||wy>=H)return false;const us=S.sel.filter(e=>e&&!e.q&&e.hp>0&&!e.ld);if(!us.length){const b=S.sel[0];if(b&&b.hp>0&&b.t===0&&b.done&&B[b.k]?.tr){b.rally={x:wx,y:wy,t:tg&&tg.amt>0?tg:null};fx.push({x:wx,y:wy,l:.5,k:'p'});note('Rally point set');return true}return false}
const tradeTarget=!!(tg&&tg.q&&tg.done&&tg.hp>0&&(tg.k==='market'||tg.k==='dock')&&tg.t!==0&&!isHostile(0,tg.t));
if(tg&&tg.t>0&&(tg.q||U[tg.k])&&!isHostile(us[0].t,tg.t)&&!(tradeTarget&&us.every(u=>u.k===(tg.k==='market'?'cart':'cog')))){
 const allied=diplomacyRelation(us[0].t,tg.t)==='ally',
  canRepairBuilding=allied&&!!tg.q&&(!tg.done||tg.hp<tg.mh)&&us.some(u=>u.k==='vil'),
  canRepairShip=allied&&!!tg.sh&&tg.hp<mhp(tg)&&us.some(u=>u.k==='vil'||(u.sh&&u!==tg));
 if(!canRepairBuilding&&!canRepairShip){note('That kingdom is not hostile; villagers can help repair allied buildings or ships');return false}
}
let noAttackBlocked=0;for(const u of us){u.p=[];u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;
if(tradeTarget&&u.k===(tg.k==='market'?'cart':'cog')){
 const endpoint=tg.k,homes=S.bs.filter(b=>b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b));
 const home=homes.slice(0,24).find(b=>path(u,goalNear(b,1))),route=home?path(u,goalNear(tg,1)):null;
 if(!route){note('Merchant needs a reachable home depot and foreign trading partner');u.o='i';u.tg=null;continue}
 const key=b=>[b.t,b.k,b.x,b.y].join(':');
 u.tradeFromKey=key(home);u.tradeDestKey=key(tg);u.tradeReturning=false;u.tradeCargo=0;u.tradePaused=false;u.tradeFleeing=false;u.manualTradeMove=false;u.tradeThreatCheckAt=0;u.tradeSourceWait=0;u.trWait=0;u.o='m';u.p=route;u.rp=1;continue
}
if(tg&&tg.t>0&&diplomacyRelation(u.t,tg.t)==='ally'){
 if(u.k==='vil'&&tg.q&&(!tg.done||tg.hp<tg.mh)){u.o='b';u.tg=tg;continue}
 if(tg.sh&&tg.hp<mhp(tg)&&(u.k==='vil'||(u.sh&&u!==tg))){u.o='rep';u.tg=tg;continue}
 u.o='i';u.tg=null;u.p=[];continue
}
if(tg&&tg.t>0){if(u.st===4){u.o='i';u.tg=null;u.p=[];noAttackBlocked++;continue}if(u.st===2)u.st=0;u.o=u.k==='mon'&&!tg.q?'v':'a';u.tg=tg}
else if(tg&&tg.rl&&u.k==='mon'&&!tg.c&&!tg.m){u.o='r';u.tg=tg}
else if(tg&&tg.amt>0&&((u.k==='vil'&&!tg.fi)||(u.k==='fish'&&tg.fi))){if(u.ct!==tg.k)u.car=0;u.o='g';u.tg=tg;u.ct=tg.k;u.ret=0}
else if(tg&&tg.t===0&&tg.sh&&tg.hp<mhp(tg)&&(u.k==='vil'||(u.sh&&u!==tg))){u.o='rep';u.tg=tg}
else if(tg&&tg.q&&tg.t===0&&(!tg.done||tg.hp<tg.mh)&&u.k==='vil'){u.o='b';u.tg=tg}
else if(tg&&tg.t===0&&((U[tg.k]?.cap&&tg.t===u.t)||(tg.q&&GAR[tg.k]&&tg.done))&&!u.sh&&u!==tg&&!U[u.k].cap){u.o='B';u.tg=tg}
else if(u.k==='trn'&&u.cg&&u.cg.some(c=>c&&c.hp>0&&c.ld===u)&&Number.isFinite(wx)&&Number.isFinite(wy)&&wx>=0&&wy>=0&&wx<W&&wy<H&&S.wt[(wy|0)*W+(wx|0)]!==1){const p=path(u,gp(wx,wy,3));if(p){u.o='U';u.ut=[wx,wy];u.p=p;u.rp=1;u.unloadRouteRetryAt=0}else note('No water route to that landing area')}
else{const n=us.length,i=us.indexOf(u),fo=fslot(us,i,wx,wy),gx=wx+fo[0],gy=wy+fo[1],gl=r=>gp(gx,gy,r),p=path(u,gl(.8))||path(u,gl(2));if(p){u.o='m';u.p=p;if(u.k==='cart'||u.k==='cog'){u.manualTradeMove=true;u.tradePaused=false;u.tradeFleeing=false}}else note('No route to that location')}}
if(noAttackBlocked)note('No Attack stance blocked '+noAttackBlocked+' attack order'+(noAttackBlocked===1?'':'s'));ackCmd(S.sel[0]);fx.push({x:wx,y:wy,l:.5,k:'p'});return true}
function openMenu(){const s=S.sel[0];if(!s)return note('Select a villager or building first (A)');
if(s.q){const d=B[s.k];if(!s.done||!(d.tr||d.rs||d.tx||GAR[s.k]))return note('Nothing to do here');
const it=trOf(s).map(k=>{const lk=U[k].age>S.age[0]?'Needs '+AG[U[k].age].n:'';return{l:unitName(k,s.t),c:U[k].cost,lk,fn:()=>{if(lk)return note(lk);const n=P[6]?5:1;let ok=0;for(let q=0;q<n;q++)if(train(s,k))ok++;else break;if(ok)note(unitName(k,s.t)+(ok>1?' x'+ok:'')+' queued')}}});
if(s.k==='tc'){it.push({l:'Town Bell: Garrison villagers',c:{},lk:'',fn:()=>{townBell(s.t);menu=null}});const g=AG[S.age[0]+1];it.push({l:g?'Advance: '+g.n:'Imperial Age reached',c:g?g.cost:{},lk:g?'':'Done',fn:()=>{if(g&&research(s,'age'))note('Advancing to '+g.n+'...')}})}
for(const k of rsOf(s)){const e=TE[k],lk=S.tech[0][k]?'Done':e.age>S.age[0]?'Needs '+AG[e.age].n:e.pre&&!S.tech[0][e.pre]?'Needs '+TE[e.pre].n:'';it.push({l:e.n,c:e.cost,lk,fn:()=>{if(lk)return note(lk);if(research(s,k))note('Researching '+e.n)}})}
if(d.tx)for(const r of mkTrades())it.push(r);
if(s.cg&&s.cg.length&&GAR[s.k])it.push({l:'Unload garrison ('+s.cg.length+')',c:{},lk:'',fn:()=>{unload(s);menu=null}});
menu={title:d.n,b:s,i:0,items:it}}
else if(S.sel.length&&S.sel.every(u=>u.k==='fish'))menu={title:'Fishing Ship',i:0,items:[{l:'Deploy Fish Trap (-100 Wood)',c:{w:100},lk:'',fn:()=>{deployFishTrap(S.sel);menu=null}},{l:'Stop fishing',c:{},lk:'',fn:()=>{stopSel();menu=null}}]}
else if(S.sel.some(u=>u.k==='vil'))menu={title:'Build',i:0,items:['house','farm','lumber','mine','mill','market','dock','wall','gate','outpost','bar','rng','stable','siege','smith','univ','castle','tower','monastery','wonder'].map(k=>{const d=B[k],lk=k==='wonder'&&vm!==1?'Wonder victory is off':d.age>S.age[0]?'Needs '+AG[d.age].n:d.req&&!S.bs.some(b=>b.t===0&&b.k===d.req&&b.done)?'Needs '+B[d.req].n:'';
return{l:d.n,c:d.cost,lk,fn:()=>{if(lk)return note(lk);if(!can(0,d.cost))return note('Not enough resources');menu=null;place={k}}}})}
else menu={title:'Soldiers',i:0,items:[{l:'Stop',c:{},lk:'',fn:()=>{stopSel();menu=null}},{l:'Regroup here',c:{},lk:'',fn:()=>{regroup();menu=null}},{l:'Patrol to cursor point',c:{},lk:'',fn:()=>{menu=null;pat=1;note('Move the cursor to the patrol point, then A (B cancels)')}},{l:'Follow friendly target',c:{},lk:'',fn:()=>{menu=null;pat=3;note('Move the cursor to a friendly unit, then A (B cancels)')}},{l:'Guard friendly target',c:{},lk:'',fn:()=>{menu=null;pat=4;note('Move the cursor to a friendly unit/building, then A (B cancels)')}},{l:'Stance: Aggressive',c:{},lk:'',fn:()=>setStance(0)},{l:'Stance: Defensive',c:{},lk:'',fn:()=>setStance(1)},{l:'Stance: Stand ground',c:{},lk:'',fn:()=>setStance(2)},{l:'Stance: Passive',c:{},lk:'',fn:()=>setStance(3)},{l:'Stance: No Attack',c:{},lk:'',fn:()=>setStance(4)},{l:'Formation: '+FMN[fm]+' (change)',c:{},lk:'',fn:()=>{fm=(fm+1)%FMN.length;menu=null;note('Formation: '+FMN[fm])}},{l:'Attack Move',c:{},lk:'',fn:()=>{menu=null;pat=2;note('Move the cursor to the target point, then A (B cancels)')}},{l:'Auto-scout (scouts)',c:{},lk:'',fn:()=>{for(const u of S.sel)if(u.k==='scout'||u.k==='mgd')u.as=1;menu=null;note('Auto-scouting on; any order turns it off')}}]}
if(menu&&menu.title==='Soldiers'&&S.sel.some(u=>u.k==='cart'||u.k==='cog'))menu.items.splice(1,0,{l:'Resume automatic trading',c:{},lk:'',fn:()=>{let n=0;for(const u of S.sel)if(u.k==='cart'||u.k==='cog'){u.tradePaused=false;u.manualTradeMove=false;u.tradeFleeing=false;u.o='i';u.p=[];u.rp=0;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;n++}menu=null;note('Automatic trading resumed for '+n+' merchant'+(n===1?'':'s'))}});
if(menu&&menu.title==='Build'){menu.items.splice(10,0,{l:'Stop (go idle)',c:{},lk:'',fn:()=>{stopSel();menu=null}});menu.pr=[[0,11],[11,21]]}}
function ctl(dt){if(E.some(Boolean)&&aInit()&&AC.state==='suspended')AC.resume().catch(()=>{});if(mode!=='play'){if(E[12]||E[13]||E[14]||E[15])uis('move');else if(E[0])uis('ok');else if(E[1]||E[9])uis('back')}
if(mode==='remap'){if(rw){const b=ER.findIndex((v,i)=>v&&i!==9);if(b>=0){BM[RA[ri][0]]=b;rw=0;sv()}return}
if(ER[12])ri=(ri+RA.length-1)%RA.length;if(ER[13])ri=(ri+1)%RA.length;if(ER[0])rw=1;if(ER[2]){BM={};sv()}if(ER[9]||ER[1])mode=rbk;return}
if(mode==='obj'){if(E[0]||E[1]||E[8]||E[9]||E[5])mode=omr;return}
if(mode==='tree'){const TL=treeLines();if(E[13])tsc=Math.min(Math.max(0,TL.length-12),tsc+1);if(E[12])tsc=Math.max(0,tsc-1);if(E[1]||E[0]||E[9])mode='pause';return}
if(mode==='info'){if(E[0]||E[1]||E[9])mode='title';return}
if(mode==='title'){titleCtl();return}
if(mode==='multiplayer'){if(window.CK_NET)window.CK_NET.control();else mode='title';return}
if(mode==='slots'){slotsCtl();return}
if(mode==='camp'){campCtl();return}
if(mode==='brief'){briefCtl();return}
if(mode==='setup'){setupCtl();return}
if(mode==='opts'){optsCtl();return}
if(mode==='end'){if(window.CK_NET&&window.CK_NET.snapshot().roomCode&&(E[0]||E[1])){window.CK_NET.leaveToTitle();return}if(E[0])endA();if(E[1])endB();return}
if(mode==='pause'){const PI=pmItems();if(E[12])pm=(pm+PI.length-1)%PI.length;if(E[13])pm=(pm+1)%PI.length;const it=PI[pm];if(E[14]&&it.l){it.l();sset()}if(E[15]&&it.r){it.r();sset()}if(E[0]&&it.a){it.a();sset()}if(E[9]||E[1])mode='play';return}
if(mode!=='play')return;if(!pad){mode='pause';return}if(E[9]){mode='pause';return}
playCtl(dt);return;}
/* ===== RENDERING ===== */
