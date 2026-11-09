const tcOf=t=>S.bs.find(b=>b.t===t&&b.k==='tc'&&b.hp>0),cb=(k,t=0)=>S.bs.filter(b=>b.t===t&&b.k===k&&b.done&&b.hp>0).length,cu=(k,t=0)=>S.us.filter(u=>u&&u.hp>0&&u.t===t&&(!k||u.k===k)).length,cmil=t=>S.us.filter(u=>u&&u.hp>0&&u.t===t&&U[u.k]&&u.k!=='vil'&&u.k!=='mon'&&u.k!=='king'&&u.k!=='cart'&&U[u.k].dmg>0&&!U[u.k].sh).length,aliveUnits=(t,k)=>S.us.filter(u=>u&&Number.isInteger(u.t)&&u.t===t&&u.hp>0&&U[u.k]&&(!k||u.k===k));
// The normal production spawn is restricted to the Town Centre perimeter.
// Campaigns deliberately start with bigger armies; place overflow soldiers in
// nearby *reachable* open cells instead of silently dropping the final troops.
function campaignOverflowSpawn(tc){
 const anchor=S.us.find(u=>u&&u.t===tc.t&&u.k==='vil'&&u.hp>0&&!u.ld);
 const cx=tc.x+(tc.s>>1),cy=tc.y+(tc.s>>1);
 for(let radius=tc.s+1;radius<=11;radius++)
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
   const x=cx+dx,y=cy+dy;
   if(x<1||y<1||x>=W-1||y>=H-1)continue;
   const cell=y*W+x;
   if(S.g[cell]||S.wt[cell]===1||S.nd[cell])continue;
   if(S.us.some(u=>u&&u.hp>0&&!u.ld&&Math.floor(u.x)===x&&Math.floor(u.y)===y))continue;
   if(anchor&&!path(anchor,gp(x+.5,y+.5,.75)))continue;
   return [x+.5,y+.5];
  }
 return null;
}
const grp=(t,k,n)=>{const tc=tcOf(t);
 if(!tc||!U[k])return;
 const naval=U[k].sh?raidShipPositions(tc,n,t):null;
 for(let i=0;i<n;i++){
  // Every campaign army, including defenders, keeps its declared roster.
  // Ordinary production and skirmish groups retain their perimeter limit.
  const p=naval?naval[i]:(spawnPos(tc)||(cmp?campaignOverflowSpawn(tc):null));
  if(!p)break;
  addU(t,k,p[0],p[1]);
 }
};
// Ship paths treat resources as obstacles and forbid diagonal corner cutting.
// Rebuild this small placement-only graph on demand so harvested fish and changed
// map cells never leave stale connectivity in a save or simulation entity.
function campaignWaterRegions(){
 const labels=new Int32Array(W*H).fill(-1),sizes=[],queue=new Int32Array(W*H);
 let largest=-1;
 const water=i=>!!S.wt[i]&&!S.nd[i];
 for(let start=0;start<W*H;start++){
  if(labels[start]>=0||!water(start))continue;
  const id=sizes.length;let head=0,tail=1,deep=0;queue[0]=start;labels[start]=id;
  while(head<tail){
   const i=queue[head++],x=i%W,y=i/W|0;if(S.wt[i]===1)deep++;
   for(const[dx,dy]of D8){
    const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;
    const next=ny*W+nx;if(labels[next]>=0||!water(next))continue;
    if(dx&&dy&&(!water(y*W+nx)||!water(ny*W+x)))continue;
    labels[next]=id;queue[tail++]=next;
   }
  }
  sizes.push(tail);
  if(deep&&(largest<0||tail>sizes[largest]))largest=id;
 }
 return {labels,sizes,largest};
}
function campaignDockAccess(x,y,size,regions,minimum=1){
 if(regions.largest<0)return false;
 let count=0;
 for(let dy=-1;dy<=size;dy++)for(let dx=-1;dx<=size;dx++){
  if(dx>=0&&dx<size&&dy>=0&&dy<size)continue;
  const nx=x+dx,ny=y+dy;
  if(nx>=0&&ny>=0&&nx<W&&ny<H&&regions.labels[ny*W+nx]===regions.largest&&++count>=minimum)return true;
 }
 return false;
}
function put(t,k,cx,cy){
 if(k==='dock'){
  const water=campaignWaterRegions(),sites=[];
  for(let y=1;y<H-B[k].s;y++)for(let x=1;x<W-B[k].s;x++){
   if(okPlace(t,k,x,y)&&campaignDockAccess(x,y,B[k].s,water))sites.push({x,y,d:(x-cx)**2+(y-cy)**2,wide:campaignDockAccess(x,y,B[k].s,water,4)});
  }
  sites.sort((a,b)=>Number(b.wide)-Number(a.wide)||a.d-b.d);
  const site=sites[0];return site?addB(t,k,site.x,site.y,true):null;
 }
 for(let r=0;r<16;r++)for(let a=0;a<12;a++){
  const x=Math.round(cx+Math.cos(a*.52)*r),y=Math.round(cy+Math.sin(a*.52)*r);
  if(x>1&&y>1&&x<W-4&&y<H-4&&okPlace(t,k,x,y))return addB(t,k,x,y,true);
 }
 return null;
}

function raidShipPositions(e,count,t=1){
 if(!e||!Number.isInteger(count)||count<=0||!Number.isInteger(t)||!S||!Number.isInteger(W)||!Number.isInteger(H))return [];
 const regions=campaignWaterRegions();if(regions.largest<0)return [];
 const docks=S.bs.filter(b=>b.t===t&&b.k==='dock'&&b.hp>0),anchors=docks.length?docks:[e],spots=[],occupied=new Set();
 for(const u of S.us)if(u&&u.hp>0&&!u.ld&&U[u.k]?.sh&&Number.isFinite(u.x)&&Number.isFinite(u.y))occupied.add((u.y|0)*W+(u.x|0));
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
  const i=y*W+x;if(S.wt[i]!==1||S.nd[i]||occupied.has(i)||regions.labels[i]!==regions.largest)continue;
  let d=Infinity;for(const a of anchors)d=Math.min(d,Math.hypot(x+.5-(a.x+a.s/2),y+.5-(a.y+a.s/2)));
  if(Number.isFinite(d))spots.push({x,y,d});
 }
 spots.sort((a,b)=>a.d-b.d);
 return spots.slice(0,count).map(p=>[p.x+.5,p.y+.5])
}

function raid(n,ks,msg){const e=tcOf(1);if(!e||!Number.isInteger(n)||n<=0||!Array.isArray(ks)||!ks.length)return;const tg=S.bs.filter(b=>b.t===0&&b.hp>0&&['lumber','mine','mill','house','market','dock'].includes(b.k)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]||tcOf(0);if(!tg)return;let ships=0,land=0;const navalSpawns=ks.some(k=>U[k]?.sh)?raidShipPositions(e,n):[];for(let i=0;i<n;i++){const k=ks[i%ks.length],ship=!!(U[k]&&U[k].sh),p=ship?navalSpawns[ships]:spawnPos(e);if(!p||!U[k])continue;const u=addU(1,k,p[0],p[1]);if(!u)continue;if(ship){ships++;const navalTargets=[...S.us.filter(q=>q.hp>0&&!q.ld&&q.t===0&&U[q.k]?.sh),...S.bs.filter(q=>q.hp>0&&q.t===0&&q.k==='dock')].sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));for(const enemy of navalTargets.slice(0,8)){if(path(u,goalNear(enemy,Math.max(1,U[k].rng||1)))){u.o='a';u.tg=enemy;u.p=[];break}}}else{land++;let target=null;const choices=[tg,...S.bs.filter(b=>b.t===0&&b.hp>0&&b!==tg)].slice(0,16);for(const candidate of choices)if(path(u,goalNear(candidate,2))){target=candidate;break}if(target){u.o='a';u.tg=target;u.p=[]}}}if(msg&&(land||ships))note(msg)}

function campaignReliefColumn(){
 const home=tcOf(0);if(!home||S.over)return 0;
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',3);grp(0,'skirm',2);
 const arrived=S.us.filter(u=>u.t===0&&u.hp>0&&!old.has(u.netId));
 for(const u of arrived){u.o='G';u.tg=home;u.p=[];u.rp=0}
 if(arrived.length)note('Royal relief has reached the ford! Spearmen and Skirmishers guard your Town Centre.');
 return arrived.length;
}
function campaignStraitPilgrimGuard(){
 const sanctuary=S.bs.find(b=>b&&b.t===0&&b.k==='monastery'&&b.done&&b.hp>0),home=tcOf(0);
 if(!sanctuary||!home||S.over)return 0;
 const before=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',4);grp(0,'skirm',4);grp(0,'ram',2);
 const pilgrims=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!before.has(u.netId));
 const fort=S.bs.find(b=>b&&b.t===1&&b.k==='castle'&&b.hp>0)||tcOf(1);
 for(const u of pilgrims){
  if(u.k==='ram'&&fort){u.o='a';u.tg=fort;u.guardTarget=null;u.p=[];u.rp=0}
  else {u.o='G';u.tg=sanctuary;u.guardTarget=null;u.p=[];u.rp=0}
 }
 if(pilgrims.length)note('Two recovered relics rally the Pilgrim Guard! Eight defenders guard your Monastery while two allied Battering Rams march on the enemy fortress.');
 return pilgrims.length;
}
function campaignTidewatchReserve(){
 const home=tcOf(0);if(!home||S.over)return 0;
 const previous=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',3);grp(0,'xbow',3);
 const reserve=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!previous.has(u.netId));
 for(const u of reserve){u.o='G';u.tg=home;u.guardTarget=null;u.p=[];u.rp=0}
 if(reserve.length)note('Tidewatch Castle has fallen! The royal reserve joins your Town Centre defence. Press on to defeat the enemy capital.');
 return reserve.length;
}

/* Tidewatch's breached outer Castle becomes an entry point for royal siege
 * reinforcements. These are normal player units with normal projectiles/HP,
 * and an enemy Town Centre must still be destroyed to finish the mission.
 * The captured staging area is reached over traversable land, never by
 * writing terrain or teleporting an enemy building's health to zero. */
function campaignTidewatchSiegeBreachReady(){
 const castle=S.bs.find(b=>b&&b.t===1&&b.k==='castle'&&b.hp>0);
 return !!cmp?.d?.castle||!!(castle&&castle.hp<=B.castle.hp*.75);
}
function campaignTidewatchBreachColumn(){
 const home=tcOf(0),enemy=tcOf(1);
 if(!home||!enemy||S.over)return 0;
 const anchor={t:0,x:enemy.x-16,y:enemy.y+8,s:B.castle.s},created=[],guns=[];
 // The enemy field army can overwhelm unsupported artillery within seconds.
 // A limited, one-time allied landing includes its own infantry escort.
 for(const kind of ['treb','treb','knight','knight','spear','spear','spear','spear','xbow','xbow','xbow','xbow']){
  let spot=campaignOverflowSpawn(anchor);
  if(spot&&S.bs.some(b=>b&&b.hp>0&&spot[0]>=b.x-1&&spot[0]<=b.x+b.s+1&&spot[1]>=b.y-1&&spot[1]<=b.y+b.s+1))spot=null;
  spot=spot||spawnPos(home)||campaignOverflowSpawn(home);
  if(!spot)continue;
  const u=addU(0,kind,spot[0],spot[1]);
  if(!u)continue;
  if(kind==='treb'){
   const route=path(u,goalNear(enemy,Math.max(1,U[kind].rng-.4)));
   if(route){u.o='a';u.tg=enemy;u.p=[];u.rp=0}
   else{u.o='G';u.tg=home;u.p=[];u.rp=0}
   guns.push(u);
  }else{
   const gun=guns.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
   u.o='G';u.tg=gun||home;u.guardTarget=null;u.p=[];u.rp=0;
  }
  created.push(u);
 }
 if(created.length)note('Tidewatch Castle walls are breached! Royal Trebuchets arrive behind the front line with Knights, Spearmen and Crossbowmen on Guard. Keep the assault moving.');
 return created.length;
}
// Completing the paid harbour establishes a one-time allied coast patrol.
// The Fire Ship uses navigable water and never satisfies the War Galley goal.
function campaignCoastHarbourPatrol(){
 // Isolated objective tests do not initialise map coordinates or water grids.
 if(typeof W!=='number'||typeof H!=='number'||!S?.wt||!S?.nd)return 0;
 const dock=S.bs.find(b=>b&&b.t===0&&b.k==='dock'&&b.done&&b.hp>0);
 if(!dock||S.over)return 0;
 const spot=raidShipPositions(dock,1,0)[0];if(!spot)return 0;
 const ship=addU(0,'fire',spot[0],spot[1]);if(!ship)return 0;
 const foe=aliveUnits(1,'gal').sort((a,b)=>Math.hypot(a.x-ship.x,a.y-ship.y)-Math.hypot(b.x-ship.x,b.y-ship.y))[0]||
  S.bs.find(b=>b&&b.t===1&&b.k==='dock'&&b.hp>0);
 if(foe&&path(ship,goalNear(foe,Math.max(1,U.fire.rng||1)))){
  ship.o='a';ship.tg=foe;ship.p=[];ship.rp=0;
 }else{ship.o='G';ship.tg=dock;ship.p=[];ship.rp=0}
 note('The Golden Coast harbour is operating! An allied Fire Ship patrol joins your navy. Train War Galleys at your Dock to secure the sea.');
 return 1;
}
// Capturing the hostile harbour frees local volunteers for the land offensive.
// Troops are physical and vulnerable; the rival capital is never auto-damaged.
// Capturing the enemy Dock opens a nearby coastal beachhead. Reward troops
// enter through real open, reachable land cells rather than materializing at
// the rival Town Centre, and their siege engines still have to fight through.
function campaignCoastLandingRelief(){
 if(typeof W!=='number'||typeof H!=='number'||!S?.wt||!S?.nd)return 0;
 const home=tcOf(0),enemy=tcOf(1);if(!home||!enemy||S.over)return 0;
 const harbour=S.bs.find(b=>b&&b.t===1&&b.k==='dock');
 const beach=harbour?{t:0,x:harbour.x+3,y:harbour.y-4,s:B.dock.s}
   :{t:0,x:enemy.x-18,y:enemy.y+10,s:B.castle.s};
 const arrived=[],rams=[];
 for(const kind of ['ram','ram','ram','ram','knight','knight','spear','spear','spear','spear','spear','skirm','skirm','skirm','skirm']){
  let spot=campaignOverflowSpawn(beach);
  if(spot&&S.bs.some(b=>b&&b.hp>0&&spot[0]>=b.x-1&&spot[0]<=b.x+b.s+1&&spot[1]>=b.y-1&&spot[1]<=b.y+b.s+1))spot=null;
  spot=spot||spawnPos(home)||campaignOverflowSpawn(home);
  if(!spot)continue;
  const u=addU(0,kind,spot[0],spot[1]);if(!u)continue;
  arrived.push(u);if(kind==='ram')rams.push(u);
 }
 for(const u of arrived){
  if(u.k==='ram'&&path(u,goalNear(enemy,Math.max(1,U.ram.rng||1)))){
   u.o='a';u.tg=enemy;u.p=[];u.rp=0;
  }else{
   const ram=u.k!=='ram'?rams.slice().sort((a,b)=>
    Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0]:null;
   u.o='G';u.tg=ram||home;u.p=[];u.rp=0;
  }
  u.guardTarget=null;
 }
 if(arrived.length)note('The rival harbour is captured! Four Battering Rams, two Knights and nine infantry land near the coastal beachhead. Escort the siege train through to the enemy Town Centre.');
 return arrived.length;
}
// The two forward Castle side-quests use the real diagonal Causeway map.
// Each fort must overlook a different ford from the player's own bank;
// a pair of Castles beside the home Town Centre earns no crossing relief.
function campaignCausewayFordCastle(ford){
 if(typeof W!=='number'||typeof H!=='number'||!S?.bs)return null;
 const home=tcOf(0);if(!home)return null;
 const river=y=>W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;
 const homeY=home.y+home.s*.5,homeSide=home.x+home.s*.5<river(homeY)?-1:1;
 return S.bs.find(b=>{
  if(!b||b.t!==0||b.k!=='castle'||!b.done||b.hp<=0)return false;
  const x=b.x+b.s*.5,y=b.y+b.s*.5,offset=(x-river(y))*homeSide;
  return Math.abs(y-H*ford)<=16&&offset>=4&&offset<=22;
 })||null;
}
// The costly royal Castles raise a fresh expedition instead of simply
// handing out the final victory. Every Knight, Crossbowman and Spearman is a
// normal controllable unit with a home Guard order and regular casualty rules.
function campaignCrownRoyalReserve(){
 const home=tcOf(0);if(!home||S.over)return 0;
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'knight',4);grp(0,'xbow',6);grp(0,'spear',4);grp(0,'treb',2);
 const joined=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!old.has(u.netId));
 for(const u of joined){u.o='G';u.tg=home;u.p=[];u.rp=0;u.guardTarget=null}
 if(joined.length)note('The two royal Castles have signalled the border reserve! Four Knights, six Crossbowmen, four Spearmen and two royal Trebuchets join your army. Escort the siege train to fire from beyond the enemy Castle range.');
 return joined.length;
}
function campaignCausewayFordReserve(ford){
 const castle=campaignCausewayFordCastle(ford);
 if(!castle||S.over)return 0;
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',2);grp(0,'skirm',2);
 const force=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!old.has(u.netId));
 for(const u of force){u.o='G';u.tg=castle;u.guardTarget=null;u.p=[];u.rp=0}
 if(force.length)note((ford<.5?'North':'South')+' Causeway ford secured! Four royal defenders arrive to guard your forward Castle. The enemy capital still needs to fall.');
 return force.length;
}
// A real, finished player Dock earns one naval escort; it is not a Galley
// and cannot satisfy the required three-War-Galley fleet milestone.
function campaignCausewayHarbourEscort(){
 if(typeof W!=='number'||typeof H!=='number'||!S?.wt||!S?.nd||S.over)return 0;
 const dock=S.bs.find(b=>b&&b.t===0&&b.k==='dock'&&b.done&&b.hp>0);
 if(!dock)return 0;
 const spot=raidShipPositions(dock,1,0)[0];
 if(!spot)return 0;
 const u=addU(0,'fire',spot[0],spot[1]);
 if(!u)return 0;
 const enemy=aliveUnits(1,'gal').sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
 if(enemy&&path(u,goalNear(enemy,Math.max(1,U.fire.rng||1)))){u.o='a';u.tg=enemy;u.p=[];u.rp=0}
 else{u.o='G';u.tg=dock;u.p=[];u.rp=0}
 note('The royal harbour is operating. One allied Fire Ship joins the defence. Train three War Galleys to contest the strait.');
 return 1;
}
// Towers earn a ford-control bonus only when they physically cover the
// north and south shallows from the player's original bank. Other legal
// Towers still count toward the normal two-Tower construction requirement.
// Holding the strait with three actual War Galleys earns land reinforcements.
// They are living soldiers with ordinary Guard orders, not damage scripts,
// and the fleet requirement remains sustained until the mission ends.
function campaignCausewayFleetRelief(){
 const home=tcOf(0);if(!home||S.over)return 0;
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'knight',3);grp(0,'spear',4);grp(0,'skirm',4);
 const joined=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!old.has(u.netId));
 for(const u of joined){u.o='G';u.tg=home;u.p=[];u.rp=0;u.guardTarget=null}
 if(joined.length)note('Royal ships have secured the Causeway supply route! Three Knights and eight infantry join your land army. Keep the coastal passage open and escort your siege engines.');
 return joined.length;
}
function campaignCausewayFordTower(ford){
 if(typeof W!=='number'||typeof H!=='number'||!S?.bs)return null;
 const home=tcOf(0);if(!home)return null;
 const river=y=>W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;
 const homeY=home.y+home.s*.5,homeSide=home.x+home.s*.5<river(homeY)?-1:1;
 return S.bs.find(b=>{
  if(!b||b.t!==0||b.k!=='tower'||!b.done||b.hp<=0)return false;
  const x=b.x+b.s*.5,y=b.y+b.s*.5,bank=(x-river(y))*homeSide;
  return Math.abs(y-H*ford)<=10&&bank>=3&&bank<=18;
 })||null;
}
// Two distinct secured fords signal a small royal siege detachment. These
// units obey normal movement, combat and death; neither fortress is damaged
// by a scripted shortcut.
function campaignCausewayFordSiegeRelief(){
 const north=campaignCausewayFordTower(.22),south=campaignCausewayFordTower(.78);
 const enemy=S.bs.find(b=>b&&b.t===1&&b.k==='castle'&&b.hp>0)||tcOf(1);
 if(!north||!south||!enemy||S.over)return 0;
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'ram',1);grp(0,'spear',2);grp(0,'skirm',2);
 const joined=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!old.has(u.netId));
 const ram=joined.find(u=>u.k==='ram');
 for(const u of joined){
  if(u===ram&&path(u,goalNear(enemy,Math.max(1,U.ram.rng||1)))){
   u.o='a';u.tg=enemy;u.p=[];u.rp=0;
  }else{u.o='G';u.tg=u!==ram&&ram?ram:north;u.p=[];u.rp=0}
  u.guardTarget=null;
 }
 if(joined.length)note('Both Causeway fords are fortified! A royal Battering Ram and four escort troops join the crossing assault. Keep them alive to destroy the rival Castle.');
 return joined.length;
}
// Redwater is a physical merchant escort, not just an eight-minute timer.
// The merchants enter from a far road checkpoint and walk to the player's
// completed Market. Identifying marks are retained by normal unit save/load.
function campaignRedwaterCartArrived(){
 const market=S.bs.find(b=>b&&b.t===0&&b.k==='market'&&b.done&&b.hp>0);
 if(!market)return false;
 return aliveUnits(0,'cart').some(u=>{
  if(u.campaignConvoy!=='redwater'||u.ld)return false;
  const dx=Math.max(market.x-u.x,0,u.x-(market.x+market.s));
  const dy=Math.max(market.y-u.y,0,u.y-(market.y+market.s));
  return Math.hypot(dx,dy)<=2.5;
 });
}
// The shared terrain pathfinder can return a safe partial route. Trade Carts
// otherwise become idle halfway through Redwater, even on a clear road.
// Resume each exhausted leg without overriding explicit player Hold/Guard.
function campaignRedwaterCaravanAdvance(){
 const market=S.bs.find(b=>b&&b.t===0&&b.k==='market'&&b.done&&b.hp>0);
 if(!market)return 0;
 let ordered=0;
 for(const cart of aliveUnits(0,'cart')){
  if(cart.campaignConvoy!=='redwater'||cart.ld||!['i','m'].includes(cart.o)||cart.p?.length)continue;
  const dx=Math.max(market.x-cart.x,0,cart.x-(market.x+market.s));
  const dy=Math.max(market.y-cart.y,0,cart.y-(market.y+market.s));
  if(Math.hypot(dx,dy)<=2.5)continue;
  const route=path(cart,goalNear(market,1));
  if(!route||!route.length)continue;
  cart.o='m';cart.tg=null;cart.p=route;cart.rp=1;cart.manualTradeMove=true;cart.tradePaused=false;ordered++;
 }
 return ordered;
}
function campaignRoadCaravan(){
 const home=tcOf(0),market=S.bs.find(b=>b&&b.t===0&&b.k==='market'&&b.done&&b.hp>0),enemy=tcOf(1);
 if(!home||!market||!enemy||S.over)return 0;
 let moving=0;
 const target=goalNear(market,1);
 for(let i=0;i<2;i++){
  let spot=null;
  for(const fraction of [.52,.43,.34,.27]){
   const checkpoint={t:0,s:2,
    x:Math.round(market.x+(enemy.x-market.x)*fraction),
    y:Math.round(market.y+(enemy.y-market.y)*fraction)};
   const candidate=campaignOverflowSpawn(checkpoint);
   if(!candidate||Math.hypot(candidate[0]-market.x,candidate[1]-market.y)<23)continue;
   if(Math.hypot(candidate[0]-enemy.x,candidate[1]-enemy.y)<11)continue;
   spot=candidate;break;
  }
  // Last-resort spawn avoids permanently blocking the scenario if a
  // generated forest or river makes a remote checkpoint inaccessible.
  spot=spot||spawnPos(home)||campaignOverflowSpawn(home);
  if(!spot)break;
  const cart=addU(0,'cart',spot[0],spot[1]);
  if(!cart)continue;
  cart.campaignConvoy='redwater';
  const route=path(cart,target);
  if(route){cart.o='m';cart.tg=null;cart.p=route;cart.rp=1;cart.manualTradeMove=true;cart.tradePaused=false;moving++}
 }
 if(moving)note('Redwater merchants are crossing the contested road. Escort at least one living Trade Cart to your Market before the last raid.');
 return moving;
}
// King's Road is an economic supply operation, unlike Redwater's escort.
// A completed Market and two real Towers must exist before a royal
// quartermaster accepts the wood and stone reserved for road repairs.
// The delivery permanently spends actual player resources; the paid-for
// expedition earns real, mortal Guards rather than an instant win.
function campaignKingsRoadSupply(){
 const market=S.bs.find(b=>b&&b.t===0&&b.k==='market'&&b.done&&b.hp>0);
 const price={w:150,s:75};
 if(!market||cb('tower')<2||S.over||!can(0,price))return 0;
 pay(0,price);
 const old=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',2);grp(0,'skirm',2);
 const guards=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!old.has(u.netId));
 for(const u of guards){u.o='G';u.tg=market;u.guardTarget=null;u.p=[];u.rp=0}
 note('The royal roadworks have received 150 wood and 75 stone at your Market! Four royal guards arrive to protect the supply post. Keep your Town Centre safe until 8:00.');
 return guards.length;
}
// A forward watchpost must stand on the real route from Ashford's Town
// Centre toward the rival border, not behind the capital or anywhere on
// the map. Both the Outpost and its small garrison obey normal combat rules.
function campaignFrontierWatchpost(){
 const home=tcOf(0),enemy=tcOf(1);
 if(!home||!enemy)return null;
 const hx=home.x+home.s*.5,hy=home.y+home.s*.5;
 const ex=enemy.x+enemy.s*.5,ey=enemy.y+enemy.s*.5;
 const dx=ex-hx,dy=ey-hy,dist=Math.hypot(dx,dy);
 if(dist<26)return null;
 return S.bs.find(b=>{
  if(!b||b.t!==0||b.k!=='outpost'||!b.done||b.hp<=0)return false;
  const x=b.x+b.s*.5-hx,y=b.y+b.s*.5-hy;
  const forward=(x*dx+y*dy)/dist,off=Math.abs(x*dy-y*dx)/dist;
  return forward>=10&&forward<=Math.min(37,dist*.55)&&off<=11;
 })||null;
}
function campaignFrontierWatchReinforcement(){
 const post=campaignFrontierWatchpost();
 if(!post||S.over)return 0;
 const prior=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',2);grp(0,'skirm',2);
 const guard=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!prior.has(u.netId));
 for(const u of guard){u.o='G';u.tg=post;u.p=[];u.rp=0;u.guardTarget=null}
 if(guard.length)note('The forward frontier Outpost is secured! Four royal defenders march to guard it. Keep your Market, Towers and villagers alive against the border raids.');
 return guard.length;
}
// Reliquary Trail: a forward Outpost must secure the real central relic route.
// Its optional escort uses ordinary mortal units and follows living Monks.
function campaignReliquaryWaystation(){
 const home=tcOf(0);if(!home)return null;
 const hx=home.x+home.s*.5,hy=home.y+home.s*.5;
 const dx=W*.5-hx,dy=H*.5-hy,dist=Math.hypot(dx,dy);
 if(dist<22)return null;
 return S.bs.find(b=>{
  if(!b||b.t!==0||b.k!=='outpost'||!b.done||b.hp<=0)return false;
  const x=b.x+b.s*.5-hx,y=b.y+b.s*.5-hy;
  const forward=(x*dx+y*dy)/dist,off=Math.abs(x*dy-y*dx)/dist;
  // The Mediterranean centre is open water: protect the friendly shore road.
  return forward>=12&&forward<=Math.min(34,dist*.7)&&off<=12;
 })||null;
}
function campaignReliquaryEscort(){
 const post=campaignReliquaryWaystation();
 if(!post||S.over)return 0;
 const before=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',2);grp(0,'skirm',2);
 const escorts=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!before.has(u.netId));
 const monks=aliveUnits(0,'mon').filter(u=>!u.ld);
 escorts.forEach((u,i)=>{u.o='G';u.tg=monks.length?monks[i%monks.length]:post;u.guardTarget=null;u.p=[];u.rp=0});
 if(escorts.length)note('The pilgrim waystation is secured! Four royal escorts arrive to guard your Monks on the relic road.');
 return escorts.length;
}
// Unlike a generic raid on farms, these real enemy patrols actively pursue
// living Monks. If a road is blocked, they attack reachable friendly holdings.
// Two live enemy scouts roam around the actual relic positions from the
// opening second. They can be fought, evaded or converted with normal rules.
function campaignReliquarySentries(){
 const directions=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
 let sentries=0;
 for(const relic of S.rel.filter(q=>q&&q.rl&&!q.c&&!q.m)){
  let placed=false;
  for(const radius of [6,7,5,8,9]){
   if(placed)break;
   for(const [dx,dy] of directions){
    const x=Math.floor(relic.x)+dx*radius,y=Math.floor(relic.y)+dy*radius;
    if(x<2||y<2||x>=W-2||y>=H-2)continue;
    const cell=y*W+x;
    if(S.wt[cell]||S.g[cell]||S.nd[cell])continue;
    if(S.us.some(u=>u&&u.hp>0&&!u.ld&&Math.hypot(u.x-x-.5,u.y-y-.5)<2))continue;
    // Test a genuine route before adding the enemy soldier. Do not put a
    // decorative but unreachable guard behind water or forest.
    if(!path({x:x+.5,y:y+.5,t:1,sh:0},gp(relic.x,relic.y,1)))continue;
    const scout=addU(1,'scout',x+.5,y+.5);
    scout.campaignPatrol='reliquary';
    scout.o='p';scout.pt={a:[x+.5,y+.5],b:[relic.x,relic.y],to:1};
    sentries++;placed=true;break;
   }
  }
 }
 return sentries;
}
function campaignReliquaryPatrol(){
 const enemy=tcOf(1);if(!enemy||S.over)return 0;
 const monks=aliveUnits(0,'mon').filter(u=>!u.ld).sort((a,b)=>Number(!!b.rel||b.o==='r')-Number(!!a.rel||a.o==='r'));
 const targets=[...monks,...S.bs.filter(b=>b&&b.t===0&&b.hp>0&&b.done&&b.k==='monastery'),tcOf(0)].filter(Boolean);
 let launched=0,orders=0;
 for(const k of ['scout','spear','arc']){
  const p=spawnPos(enemy)||(cmp?campaignOverflowSpawn(enemy):null);
  if(!p)continue;
  const u=addU(1,k,p[0],p[1]);if(!u)continue;
  launched++;
  for(const target of targets){
   if(!path(u,goalNear(target,Math.max(1,U[k].rng||1))))continue;
   u.o='a';u.tg=target;u.p=[];u.rp=0;orders++;break;
  }
 }
 if(orders)note('Enemy road patrols are advancing on your Monks! Keep their escorts close.');
 return launched;
}
// Ashford's outer signal towers are real, persistent enemy buildings, not an
// invented capture counter. Their IDs survive normal save/load even after a
// destroyed building has been compacted out of the live entity array.
function campaignAshfordSignalsDisabled(){
 const ids=cmp?.i===8?cmp.d.ashfordSignalIds:null;
 return Array.isArray(ids)&&ids.length===2&&new Set(ids).size===2&&
  ids.every(id=>typeof id==='string'&&!S.bs.some(b=>b&&b.t===1&&b.hp>0&&b.netId===id));
}
function campaignAshfordSignalRelief(){
 const home=tcOf(0);if(!home||S.over||!campaignAshfordSignalsDisabled())return 0;
 const before=new Set(S.us.map(u=>u.netId));
 grp(0,'spear',3);grp(0,'arc',3);
 const relief=S.us.filter(u=>u&&u.t===0&&u.hp>0&&!before.has(u.netId));
 const ram=aliveUnits(0,'ram').find(u=>!u.ld)||home;
 for(const u of relief){u.o='G';u.tg=ram;u.guardTarget=null;u.p=[];u.rp=0}
 if(relief.length)note('The twin signal towers are silent! Six royal troops join the siege and guard your battering rams.');
 return relief.length;
}
function campaignAshfordCastleSortie(){
 const enemy=tcOf(1);if(!enemy||S.over)return 0;
 const before=new Set(S.us.map(u=>u.netId));
 grp(1,'spear',3);grp(1,'arc',3);
 const defenders=S.us.filter(u=>u&&u.t===1&&u.hp>0&&!before.has(u.netId));
 const rams=aliveUnits(0,'ram').filter(u=>!u.ld);
 const targets=[...rams,...S.us.filter(u=>u&&u.t===0&&u.hp>0&&!u.ld&&U[u.k]?.dmg>0),tcOf(0)].filter(Boolean);
 let attacking=0;
 for(const u of defenders)for(const target of targets){
  if(!path(u,goalNear(target,Math.max(1,U[u.k].rng||1))))continue;
  u.o='a';u.tg=target;u.guardTarget=null;u.p=[];u.rp=0;attacking++;break;
 }
 if(attacking)note('Ashford Castle has fallen! The rival sends its last defenders against your siege train.');
 return defenders.length;
}
const CAMP=[
{t:'First Hearth',b:'The old king is dead and three heirs claim the Crown of Ashford. You inherit only a Town Centre and a few villagers on a quiet plain. Build a real village: houses to grow, a lumber camp for wood, a barracks to raise soldiers. Nobody will trouble you here, so learn the ropes.',civ:0,en:1,mt:3,msz:0,seed:11,diff:0,aip:0,vm:0,noai:1,
 setup(){S.age[0]=1;S.res[0]={f:500,w:600,g:100,s:100}},
 goals:[{id:'h',t:'Build a House',ok:()=>cb('house')>=1},{id:'l',t:'Build a Lumber Camp',ok:()=>cb('lumber')>=1},{id:'v',t:'Have 10 villagers',sustained:true,ok:()=>cu('vil')>=10},{id:'b',t:'Build a Barracks',ok:()=>cb('bar')>=1},{id:'s',t:'Train 4 soldiers',ok:()=>cmil(0)>=4}],
 ev:[{at:2,do:()=>note('Pan with the left stick to centre a villager under the reticle, then press A to select.')},{at:14,do:()=>note('With villagers selected, aim at a tree and press A to send them chopping.')},{at:32,do:()=>note('Hold RT for the command menu and pick Build, then House. Houses raise your population limit.')},{when:()=>cb('house')>=1,do:()=>note('Good. A Lumber Camp beside the trees speeds up wood gathering.')},{when:()=>cb('lumber')>=1,do:()=>note('Train villagers at the Town Centre: D-pad Down selects it, then hold RT.')},{when:()=>cu('vil')>=10,do:()=>note('Now build a Barracks and train soldiers there.')}]},
{t:'Raiders at the Ford',b:'Mongol raiders ride south along the river, burning farms and scattering villagers. The king\'s relief column is eight minutes away. Raise a Barracks, muster eight defenders and hold your Town Centre until the relief column arrives.',civ:1,en:2,mt:0,msz:0,seed:22,diff:0,aip:6,vm:0,
 setup(){S.age[0]=1;S.res[0]={f:500,w:500,g:200,s:0}},
 goals:[{id:'b',t:'Build a Barracks',ok:()=>cb('bar')>=1},{id:'s',t:'Muster 8 soldiers',ok:()=>cmil(0)>=8},{id:'t',t:'Survive until 8:00',ok:()=>cmp.t>=480}],
 ev:[{at:8,do:()=>note('Raiders strike fast. Keep soldiers near your villagers.')},{at:150,do:()=>raid(5,['skirm','scout','skirm','scout','skirm'],'Raiders sighted to the north!')},{at:270,do:()=>raid(6,['mil','skirm','mil','skirm','mil','skirm'],'A second raiding party is coming!')},{at:390,do:()=>raid(8,['mil','skirm','scout','mil','skirm','scout','mil','skirm'],'The largest raid yet. The relief column is almost here!')},{at:445,do:()=>campaignReliefColumn()}]},
{t:'The Feudal Frontier',b:'A rival lord fortifies the border. Advance through the Feudal and Castle Ages, open a Market and build two Towers. Small raids will test each new defensive line before the final attack. Optionally place a completed Outpost ahead of the Town Centre, toward the rival frontier, to call in a four-soldier watch garrison.',civ:3,en:5,mt:1,msz:1,seed:33,diff:1,aip:2,vm:0,
 setup(){S.res[0]={f:1300,w:500,g:300,s:200}},
 goals:[{id:'f',t:'Reach the Feudal Age',ok:()=>S.age[0]>=1},{id:'t',t:'Build 2 Towers',ok:()=>cb('tower')>=2},{id:'m',t:'Build a Market',ok:()=>cb('market')>=1},{id:'c',t:'Reach the Castle Age',ok:()=>S.age[0]>=2},{id:'frontierwatch',t:'Optional: Fortify the forward frontier with an Outpost',optional:true,ok:()=>!!campaignFrontierWatchpost()}],
 ev:[{at:10,do:()=>note('Advancing an age is done at the Town Centre and needs the right buildings first.')},{when:()=>S.age[0]>=1,do:()=>note('Feudal Age reached. Towers need stone: put villagers on a stone mine.')},{at:660,do:()=>raid(8,['mil','spear','arc','mil','spear','arc','mil','arc'],'A border patrol is marching on your lands!')},{at:205,when:()=>S.age[0]>=1&&cb('tower')>=1,do:()=>raid(3,['scout','mil','spear'],'A rival scouting party tests your first defensive Tower!')},{at:390,when:()=>cb('tower')>=2&&cb('market')>=1,do:()=>raid(5,['mil','arc','spear','scout','mil'],'The rival launches a second raid at the fortified Market road!')},{when:()=>cmp.d.frontierwatch===1,do:()=>campaignFrontierWatchReinforcement()}]},
{t:'The Relic Road',b:'Holy relics lie scattered across the land and the Church will crown whoever gathers them. Build a monastery, send your monks out and bring the relics home. The Turks may send scouts to probe your lands.',civ:8,en:9,mt:0,msz:1,seed:44,diff:1,aip:3,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:600,w:600,g:500,s:300};grp(0,'mon',2)},
 goals:[{id:'m',t:'Build a Monastery',ok:()=>cb('monastery')>=1},{id:'r',t:'Hold 3 relics in your Monasteries',sustained:true,ok:()=>S.rel.filter(q=>q.m&&q.m.t===0&&q.m.done&&q.m.hp>0).length>=3}],
 ev:[{at:6,do:()=>note('Monks can carry relics. Select one and order it onto a relic, then to your Monastery.')},{at:420,do:()=>raid(4,['scout','skirm','scout','skirm'],'Turkish scouts are probing your lands. Protect your monks!')}]},
{t:'Siege of Kronburg',b:'The Byzantine lord holds Kronburg, a Town Centre ringed with a castle and towers. You have only a small army and three rams. Keep your spearmen close to the rams, shoot the defenders with archers, then bring the castle down and burn the Town Centre.',civ:5,en:3,mt:3,msz:1,seed:55,diff:1,aip:5,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:300,w:400,g:300,s:200};grp(0,'ram',3);grp(0,'spear',8);grp(0,'arc',8);grp(0,'knight',4);const e=tcOf(1);if(put(1,'castle',e.x-7,e.y+8))cmp.d.cas=1;put(1,'tower',e.x-4,e.y+12);put(1,'tower',e.x-11,e.y+5);grp(1,'spear',6);grp(1,'arc',4);S.age[1]=2},
 goals:[{id:'c',t:'Destroy the enemy Castle',ok:()=>cmp.d.cas&&cmp.t>3&&!S.bs.some(b=>b.t===1&&b.k==='castle'&&b.hp>0)},{id:'t',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:5,do:()=>note('Rams are strong against buildings but weak against melee. Guard them.')},{at:90,do:()=>note('Archers are fragile: keep them behind your spearmen.')}]},
{t:'The Last Crown',b:'Only two claimants remain. Both kingdoms muster in Castle Age with equal resources. Protect your King, build siege weapons and escort troops, break the jarl\'s Town Centre if he garrisons, then defeat the enemy King.',civ:0,en:7,mt:2,msz:1,seed:66,diff:2,aip:1,vm:3,
 setup(){S.age[0]=S.age[1]=2;S.res[0]={f:800,w:1200,g:500,s:150};S.res[1]={f:800,w:1200,g:500,s:150}},
 goals:[{id:'k',t:'Slay the enemy King',ok:()=>cmp.t>3&&!S.us.some(u=>u&&Number.isInteger(u.t)&&u.t===1&&u.k==='king'&&u.hp>0)}],
 ev:[{at:6,do:()=>note('If your King falls, the mission is lost. Keep him inside your Town Centre if attacked.')},{at:600,do:()=>note('The jarl keeps his King close to his Town Centre.')}]}
,
{t:'The Northern Watch',b:'The first snows have arrived, and raiders are gathering beyond the pine forests. Build a Watch Tower, protect it with Spearmen and ranged troops, and hold your settlement until the raiding season passes. Build Houses to support your army: a Barracks unlocks the Archery Range, and Skirmishers can defend without spending gold.',civ:5,en:2,mt:5,msz:1,seed:77,diff:1,aip:6,vm:0,
 setup(){S.age[0]=1;S.res[0]={f:600,w:600,g:250,s:150}},
 goals:[{id:'t',t:'Build a Watch Tower',ok:()=>cb('tower')>=1},{id:'a',t:'Train 6 ranged soldiers',ok:()=>aliveUnits(0).filter(u=>U[u.k].rng>=4&&!U[u.k].sh&&!['vil','mon','king','ram','mang','scor','treb','bomb'].includes(u.k)).length>=6},{id:'s',t:'Survive until 10:00',ok:()=>cmp.t>=600}],
 ev:[{at:90,do:()=>raid(4,['scout','skirm','scout','skirm'],'Scouts have been spotted beyond the trees!')},{at:240,do:()=>raid(7,['mil','skirm','scout','mil','skirm','scout','mil'],'The main raiding force is approaching!')},{at:420,do:()=>raid(8,['mil','spear','arc','mil','spear','arc','scout','scout'],'A final wave is testing the northern defences!')}]},
{t:'Crossing at Redwater',b:'The Redwater trade road is under attack. Build a Market and two Towers, defend the crossing through eight minutes, and escort at least one merchant cart from the far checkpoint into your Market. If both merchants fall, the road is lost.',civ:3,en:8,mt:7,msz:1,seed:88,diff:1,aip:2,vm:0,
 setup(){S.age[0]=1;S.res[0]={f:700,w:700,g:350,s:250}},
 goals:[{id:'m',t:'Build a Market',ok:()=>cb('market')>=1},{id:'t',t:'Build 2 Towers',ok:()=>cb('tower')>=2},{id:'s',t:'Hold the crossing for 8:00',ok:()=>cmp.t>=480},{id:'caravan',t:'Escort a Redwater Trade Cart safely into your Market',ok:()=>campaignRedwaterCartArrived()}],
 ev:[{at:100,do:()=>raid(5,['scout','mil','scout','mil','arc'],'The enemy is probing the river crossing.')},{at:260,do:()=>raid(8,['mil','spear','arc','mil','spear','arc','scout','scout'],'A larger force is advancing along the trade road.')},{at:390,do:()=>note('Keep villagers away from the front line while your towers and soldiers hold the crossing.')},{at:405,when:()=>cb('market')>=1,do:()=>campaignRoadCaravan()},{at:435,when:()=>cmp.e[3]&&!cmp.d.caravan,do:()=>note('The caravan needs an escort! Keep your soldiers near the Trade Carts until at least one enters your Market.')}]},
{t:'Crown of Ashford',b:'The rival claimant holds Ashford behind a Castle and two signal towers. Defeat the garrison, destroy the real Castle, then break the rival Town Centre to claim the capital. Optional: silence both marked signal towers to rally six royal spearmen and archers to your siege. Expect a final counterattack when the Castle falls.',civ:0,en:1,mt:0,msz:2,seed:99,diff:2,aip:1,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:900,w:900,g:700,s:500};grp(0,'knight',6);grp(0,'arc',10);grp(0,'ram',3);const e=tcOf(1);if(e){put(1,'castle',e.x-7,e.y+8);const ids=[];for(const [dx,dy] of [[-4,12],[-11,5]]){const tower=put(1,'tower',e.x+dx,e.y+dy);if(tower){tower.campaignSignal='ashford';ids.push(tower.netId)}}cmp.d.ashfordSignalIds=ids;grp(1,'knight',5);grp(1,'arc',8);S.age[1]=2}},
 goals:[{id:'castle',t:'Destroy Ashford Castle',ok:()=>cmp.t>3&&!S.bs.some(b=>b&&b.t===1&&b.k==='castle'&&b.hp>0)},{id:'tc',t:'Destroy the rival Town Centre',ok:()=>cmp.t>3&&!tcOf(1)},{id:'signals',t:'Optional: Destroy both Ashford signal towers',optional:true,ok:()=>campaignAshfordSignalsDisabled()}],
 ev:[{at:5,do:()=>note('Ashford Castle must fall before you can claim the capital. Protect your rams with archers and cavalry.')},{at:120,do:()=>note('The two enemy signal towers can be destroyed for a real royal siege escort. They are optional, but the Castle and Town Centre are not.')},{when:()=>cmp.d.signals===1,do:()=>campaignAshfordSignalRelief()},{when:()=>cmp.d.castle===1&&!!tcOf(1),do:()=>campaignAshfordCastleSortie()}]},
{t:'Siege of Greywatch',b:'Greywatch blocks the royal road. The enemy has fortified its capital, and reinforcements will strike your economy. Muster your siege engines before advancing. Gather wood and gold for replacements, research Crossbowman at an Archery Range, and use Guard to keep the escort with your rams. Keep cavalry away from enemy pikes.',civ:0,en:3,mt:1,msz:1,seed:910,diff:1,aip:1,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:1100,w:900,g:650,s:450};grp(0,'knight',5);grp(0,'arc',8);grp(0,'ram',2);const e=tcOf(1);if(e){S.age[1]=2;S.res[1]={f:900,w:700,g:500,s:300};put(1,'castle',e.x-7,e.y+7);put(1,'tower',e.x-4,e.y+11);grp(1,'spear',5);grp(1,'arc',6);grp(1,'ram',1)}},
 goals:[{id:'greywatch',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:90,do:()=>note('Greywatch is reinforced. Keep your siege units behind the front line.')},{at:240,do:()=>raid(5,['knight','arc','spear','knight','arc'],'Enemy reinforcements are striking your economy.')}]},
{t:'The King’s Road',b:'The northern royal road needs supplies, not just walls. Establish a Market and raise two Towers; your starting stone only covers the first Tower, so mine or trade for more. After five minutes the Market quartermaster will collect 150 wood and 75 stone for repairs once the towers stand. Fund that real supply contract, then hold the road until 8:00.',civ:3,en:2,mt:0,msz:1,seed:911,diff:1,aip:4,vm:0,
 setup(){S.age[0]=1;S.res[0]={f:700,w:800,g:250,s:150};grp(0,'mil',4);grp(0,'arc',4);const e=tcOf(1);if(e){S.age[1]=1;S.res[1]={f:600,w:500,g:250,s:100};grp(1,'scout',3);grp(1,'mil',4)}},
 goals:[{id:'roadmarket',t:'Build a Market',ok:()=>cb('market')>=1},{id:'roadtowers',t:'Build 2 Towers',ok:()=>cb('tower')>=2},{id:'roadtime',t:'Hold the road for 8:00',ok:()=>cmp.t>=480},{id:'roadsupply',t:'Fund royal roadworks with 150 wood and 75 stone at the Market',ok:()=>!!cmp.e[3]}],
 ev:[{at:70,do:()=>raid(4,['scout','mil','scout','mil'],'Scouts are probing your outer farms.')},{at:200,do:()=>raid(7,['mil','spear','arc','scout','mil','arc','spear'],'A larger raiding party is approaching.')},{at:360,do:()=>raid(8,['knight','arc','spear','knight','arc','mil','spear','arc'],'The enemy commits its main raiding force.')},{at:300,when:()=>cb('market')>=1&&cb('tower')>=2&&can(0,{w:150,s:75}),do:()=>campaignKingsRoadSupply()}]},
{t:'The Reliquary Trail',b:'Your Monastery and two Monks are ready. Two sacred relics lie along the Mediterranean shore, each watched by an enemy scouting patrol. Escort your Monks, outfight or evade the scouts, and bring both relics home while reinforcements hunt your pilgrims. Optional: establish a forward Outpost on your bank to rally four royal escorts.',civ:1,en:0,mt:7,msz:1,seed:912,diff:1,aip:2,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:800,w:650,g:650,s:250};const tc=tcOf(0);if(tc)put(0,'monastery',tc.x+8,tc.y+4);grp(0,'mon',2);grp(0,'mil',4);grp(0,'arc',4);
// The two authored relics are the entire objective. Leave no random map
// relics behind as an easier, unguarded shortcut around the pilgrim trail.
S.rel.length=0;const hx=tc?tc.x+tc.s*.5:W*.15,hy=tc?tc.y+tc.s*.5:H*.85,dx=W*.5-hx,dy=H*.5-hy,dist=Math.hypot(dx,dy)||1;
 for(const side of [-1,1]){
  let placed=false;
  for(const forward of [24,26,22,28,20,30,32]){
   if(placed)break;
   for(const lateral of [12,10,14,8,16]){
    if(placed)break;
    for(const offset of [0,-2,2,-4,4]){
     const x=Math.round(hx+dx/dist*forward-dy/dist*(side*lateral+offset)),y=Math.round(hy+dy/dist*forward+dx/dist*(side*lateral+offset)),cell=y*W+x;
     if(x<3||y<3||x>=W-3||y>=H-3||S.g[cell]||S.wt[cell]||S.nd[cell])continue;
     if(S.rel.some(q=>Math.hypot(q.x-x-.5,q.y-y-.5)<5))continue;
     // A dry tile is not enough: Monks must be able to walk there using
     // ordinary land pathfinding on the seeded Mediterranean coastline.
     const pilgrim=aliveUnits(0,'mon').find(u=>!u.ld);
     if(!pilgrim||!path(pilgrim,gp(x+.5,y+.5,.8)))continue;
     S.rel.push({rl:1,x:x+.5,y:y+.5,c:null,m:null});placed=true;break;
    }
   }
  }
 }const e=tcOf(1);if(e){S.age[1]=2;grp(1,'knight',4);grp(1,'arc',5)}campaignReliquarySentries()},
 goals:[{id:'relics',t:'Return both relics to your Monastery',sustained:true,ok:()=>S.rel.filter(r=>r.m&&r.m.t===0&&r.m.done&&r.m.hp>0).length>=2},{id:'trailpost',t:'Optional: Build a completed forward Outpost on the pilgrim shore road',optional:true,ok:()=>!!campaignReliquaryWaystation()}],
 ev:[{at:15,do:()=>note('The relics are watched by Scout Cavalry. Clear their patrols with soldiers before sending vulnerable Monks down the shore road.')},{at:55,do:()=>campaignReliquaryPatrol()},{at:130,do:()=>campaignReliquaryPatrol()},{at:220,do:()=>raid(5,['scout','knight','arc','knight','arc'],'Enemy reinforcements have reached your supply road.')},{when:()=>cmp.d.trailpost===1,do:()=>campaignReliquaryEscort()}]},
{t:'The Golden Coast',b:'A rival admiral controls the fishing grounds while a coastal lord threatens your settlement. Build a Dock to rally one allied Fire Ship, then train at least three War Galleys and muster twelve land soldiers. Destroy the enemy Dock to stop his sea reinforcements and rally coastal volunteers (optional). Protect your home, defeat the coastal lord and destroy his Town Centre.',civ:2,en:6,mt:7,msz:1,seed:913,diff:1,aip:5,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:650,w:850,g:500,s:200};const tc=tcOf(0);if(tc){for(let i=0;i<4;i++)put(0,'house',tc.x-7+(i%2)*3,tc.y-7+Math.floor(i/2)*3);grp(0,'gal',2);grp(0,'fish',2);grp(0,'spear',6);grp(0,'arc',5)}const e=tcOf(1);if(e){S.age[1]=2;S.res[1]={f:600,w:650,g:500,s:200};put(1,'dock',e.x-7,e.y+2);grp(1,'gal',3);grp(1,'spear',7);grp(1,'arc',5);grp(1,'ram',2)}},
 goals:[{id:'dock',t:'Build a Dock',ok:()=>cb('dock')>=1},{id:'fleet',t:'Have 3 War Galleys alive',sustained:true,ok:()=>aliveUnits(0,'gal').length>=3},{id:'army',t:'Have 12 land soldiers alive',sustained:true,ok:()=>aliveUnits(0).filter(u=>U[u.k].dmg>0&&!U[u.k].sh&&!['vil','king','mon'].includes(u.k)).length>=12},{id:'blockade',t:'Optional: Destroy the enemy Dock',optional:true,ok:()=>cmp.t>3&&!S.bs.some(b=>b&&b.t===1&&b.k==='dock'&&b.hp>0)},{id:'win',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:20,do:()=>note('Escort your Fishing Ships with the opening Galleys. A completed Dock rallies one allied Fire Ship, but you must train War Galleys yourself.')},{when:()=>cmp.d.dock===1,do:()=>campaignCoastHarbourPatrol()},{at:150,do:()=>raid(3,['scout','arc','spear'],'Coastal raiders are attacking the settlement!')},{at:150,when:()=>S.bs.some(b=>b&&b.t===1&&b.k==='dock'&&b.hp>0),do:()=>raid(2,['gal','gal'],'Enemy war galleys sail from the hostile harbour!')},{at:300,do:()=>raid(6,['ram','knight','arc','spear','knight','arc'],'The coastal lord commits his land siege!')},{at:300,when:()=>S.bs.some(b=>b&&b.t===1&&b.k==='dock'&&b.hp>0),do:()=>raid(1,['gal'],'The rival admiral sends another war galley!')},{when:()=>cmp.d.blockade===1,do:()=>campaignCoastLandingRelief()}]},
{t:'The Strait\'s Last Relic',b:'An enemy-held abbey guards a stolen relic across the strait. Build a Monastery and recover two relics to rally the Pilgrim Guard and its two allied Battering Rams. Protect your sanctuary while the siege column destroys the hostile Castle and Town Centre. Enemy raiders will test both your land army and fleet.',civ:2,en:6,mt:7,msz:1,seed:914,diff:2,aip:5,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:750,w:750,g:650,s:350};const home=tcOf(0);if(home)for(let i=0;i<4;i++)put(0,'house',home.x-7+(i%2)*3,home.y-6+Math.floor(i/2)*3);grp(0,'mon',2);grp(0,'gal',3);grp(0,'spear',7);grp(0,'arc',6);const e=tcOf(1);if(e){S.age[1]=2;S.res[1]={f:650,w:700,g:600,s:350};put(1,'castle',e.x-7,e.y+7);put(1,'dock',e.x-7,e.y+2);const abbey=put(1,'monastery',e.x-14,e.y+5);if(abbey){const stolen=S.rel.find(q=>q&&q.rl&&!q.c&&!q.m);if(stolen){stolen.x=abbey.x+1;stolen.y=abbey.y+1;stolen.m=abbey}}grp(1,'gal',3);grp(1,'spear',7);grp(1,'arc',6)}},
 goals:[{id:'monastery',t:'Build a Monastery',ok:()=>cb('monastery')>=1},{id:'relics',t:'Hold 2 relics in your Monasteries',sustained:true,ok:()=>S.rel.filter(q=>q.m&&q.m.t===0&&q.m.done&&q.m.hp>0).length>=2},{id:'castle',t:'Destroy the enemy Castle',ok:()=>cmp.t>3&&!S.bs.some(b=>b.t===1&&b.k==='castle'&&b.hp>0)},{id:'tc',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:20,do:()=>note('Keep your monks behind the army and return relics to a completed Monastery.')},{at:150,do:()=>raid(5,['gal','gal','scout','spear','arc'],'The enemy fleet is probing the strait!')},{at:300,do:()=>raid(7,['ram','knight','arc','spear','gal','gal','arc'],'A combined assault is approaching the crossing!')},{at:480,do:()=>raid(8,['ram','ram','knight','knight','arc','spear','gal','gal'],'The enemy commits its reserve. Hold the shore!')},{when:()=>cmp.t>12&&!S.bs.some(b=>b&&b.t===1&&b.k==='monastery'&&b.hp>0),do:()=>note('The seized monastery is down. The stolen relic can now be recovered!')},{when:()=>cmp.d.relics===1,do:()=>campaignStraitPilgrimGuard()}]},
{t:'The Siege of Tidewatch',b:'The royal fleet has secured the outer coast, but Tidewatch still controls the harbour and the road inland. You have two Fire Ships to contest its war galleys. Destroy the enemy Dock to cut off sea reinforcements and seize supplies (optional). Build a Siege Workshop and muster two Bombard Cannons. Breaking the Castle outer defences calls in an allied Trebuchet column with a real infantry escort. Destroying the Castle then rallies a royal guard for your own Town Centre. Protect the siege column to destroy the enemy capital.',civ:2,en:6,mt:7,msz:1,seed:915,diff:2,aip:4,vm:0,
 setup(){S.age[0]=3;S.res[0]={f:1500,w:1400,g:1300,s:650};const p=tcOf(0);if(p){put(0,'castle',p.x+7,p.y+6);put(0,'tower',p.x+8,p.y-5);put(0,'tower',p.x+8,p.y+13);for(let i=0;i<5;i++)put(0,'house',p.x-7+(i%3)*3,p.y-7+Math.floor(i/3)*3);grp(0,'knight',5);grp(0,'xbow',10);grp(0,'spear',6);grp(0,'ram',2);grp(0,'fire',2)}const e=tcOf(1);if(e){S.age[1]=3;S.res[1]={f:1100,w:900,g:900,s:500};put(1,'castle',e.x-8,e.y+8);put(1,'tower',e.x-5,e.y+12);put(1,'tower',e.x-12,e.y+6);put(1,'dock',e.x-11,e.y+5);grp(1,'gal',2);grp(1,'knight',6);grp(1,'xbow',8);grp(1,'bomb',2)}},
 goals:[{id:'workshop',t:'Build a Siege Workshop',ok:()=>cb('siege')>=1},{id:'bombards',t:'Muster 2 Bombard Cannons',ok:()=>aliveUnits(0,'bomb').length>=2},{id:'harbour',t:'Optional: Destroy the enemy Dock',optional:true,ok:()=>cmp.t>3&&!S.bs.some(b=>b.t===1&&b.k==='dock'&&b.hp>0)},{id:'castle',t:'Destroy Tidewatch Castle',ok:()=>cmp.t>3&&!S.bs.some(b=>b.t===1&&b.k==='castle'&&b.hp>0)},{id:'tc',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:20,do:()=>note('Tidewatch is an Imperial Age siege. Your fortified camp has housing and two watchtowers covering the approaches. Keep a few Spearmen and Crossbowmen protecting the Town Centre while your main force escorts Bombard Cannons.')},{at:90,do:()=>raid(6,['knight','knight','xbow','spear','xbow','scout'],'Tidewatch cavalry are raiding your supply road!')},{at:240,do:()=>raid(8,['ram','bomb','knight','xbow','spear','knight','xbow','ram'],'The harbour garrison launches a coordinated counter-attack!')},{at:420,do:()=>raid(7,['bomb','ram','knight','knight','xbow','spear','xbow'],'Enemy reinforcements are attempting to break your siege!')},{at:345,when:()=>S.bs.some(b=>b.t===1&&b.k==='dock'&&b.hp>0),do:()=>raid(2,['gal','gal'],'Tidewatch war galleys are sailing from the harbour!')},{when:()=>cmp.d.harbour===1,do:()=>{S.res[0].w+=180;S.res[0].g+=100;note('Harbour secured! Captured ship stores provide 180 wood and 100 gold. Enemy sea reinforcements are cut off.')}},{when:()=>cmp.d.castle===1,do:()=>campaignTidewatchReserve()},{when:()=>campaignTidewatchSiegeBreachReady(),do:()=>campaignTidewatchBreachColumn()}]},
{t:'The Bridge at Blackwood',b:'The forest road is the last open supply route to the northern army. Hold the crossing through repeated enemy raids. Raise two towers, seal the approaches with six wall sections, and keep your Town Centre standing until the relief force arrives.',civ:0,en:1,mt:1,msz:1,seed:916,diff:1,aip:3,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:900,w:1200,g:450,s:450};grp(0,'mil',6);grp(0,'spear',6);grp(0,'arc',7);const e=tcOf(1);if(e){S.age[1]=1;S.res[1]={f:900,w:650,g:350,s:150};grp(1,'spear',6);grp(1,'arc',5)}},
 goals:[{id:'tower',t:'Build 2 completed Towers',ok:()=>S.bs.filter(b=>b.t===0&&b.k==='tower'&&b.done&&b.hp>0).length>=2},{id:'wall',t:'Build 6 completed Wall sections',ok:()=>S.bs.filter(b=>b.t===0&&b.k==='wall'&&b.done&&b.hp>0).length>=6},{id:'hold',t:'Hold Blackwood for 8:00',ok:()=>cmp.t>=480}],
 ev:[{at:20,do:()=>note('Build your towers where they cover the approach. Walls buy time, but leave room for your villagers to move between resources and the Town Centre.')},{at:65,do:()=>raid(5,['scout','mil','spear','scout','arc'],'Blackwood scouts are testing the outer farms!')},{at:155,do:()=>raid(7,['mil','spear','arc','scout','mil','arc','spear'],'The first serious raid is moving up the forest road!')},{at:260,do:()=>raid(8,['knight','spear','arc','knight','mil','arc','spear','ram'],'Enemy cavalry and siege are approaching the crossing!')},{at:365,do:()=>raid(9,['ram','knight','knight','spear','arc','mil','arc','spear','scout'],'A combined force is pushing for the Town Centre!')},{at:435,do:()=>raid(10,['ram','ram','knight','knight','spear','arc','mil','arc','spear','knight'],'The final assault has begun. Hold until the relief signal!')}]},
{t:'The Causeway Muster',b:'The rival guards the last road over the strait. Scout your bank, build a Dock and field three War Galleys. The completed Dock rallies one Fire Ship; securing a fleet signals mounted and infantry relief. Raise two Towers; putting one by each ford optionally earns a guarded royal siege ram. Break the real enemy Castle and Town Centre to reopen the Causeway.',civ:2,en:6,mt:7,layout:12,msz:1,seed:917,diff:2,aip:5,vm:0,
 setup(){S.age[0]=2;S.res[0]={f:1000,w:1100,g:750,s:400};const home=tcOf(0);if(home)for(let i=0;i<4;i++)put(0,'house',home.x-7+(i%2)*3,home.y-7+Math.floor(i/2)*3);grp(0,'knight',4);grp(0,'spear',6);grp(0,'arc',8);grp(0,'ram',2);const e=tcOf(1);if(e){S.age[1]=2;S.res[1]={f:1000,w:900,g:700,s:350};put(1,'castle',e.x-8,e.y+8);put(1,'tower',e.x-5,e.y+12);put(1,'tower',e.x-12,e.y+6);grp(1,'knight',5);grp(1,'spear',6);grp(1,'arc',8);grp(1,'ram',2)}for(const gy of [.34,.42,.66]){const y=Math.floor(H*gy),cx=Math.round(W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8);let placed=false;for(let dx=-3;dx<=3&&!placed;dx++){const x=cx+dx,i=y*W+x;if(x>1&&x<W-1&&S.wt[i]===1&&!S.nd[i]){addU(1,'gal',x+.5,y+.5);placed=true}}}},
 goals:[{id:'dock',t:'Build a Dock',ok:()=>cb('dock')>=1},{id:'fleet',t:'Have 3 War Galleys alive',sustained:true,ok:()=>aliveUnits(0,'gal').length>=3},{id:'towers',t:'Build 2 completed Towers',ok:()=>S.bs.filter(b=>b.t===0&&b.k==='tower'&&b.done&&b.hp>0).length>=2},{id:'castle',t:'Destroy the enemy Castle',ok:()=>cmp.t>3&&!S.bs.some(b=>b.t===1&&b.k==='castle'&&b.hp>0)},{id:'tc',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)},{id:'fords',t:'Optional: Secure both Causeway fords with Towers',optional:true,ok:()=>!!campaignCausewayFordTower(.22)&&!!campaignCausewayFordTower(.78)}],
 ev:[{at:20,do:()=>note('Scout your shoreline with a Knight before ordering a Dock. Towers overlooking the north and south fords earn a guarded siege column.')},{when:()=>cmp.d.dock===1,do:()=>campaignCausewayHarbourEscort()},{when:()=>cmp.d.fleet===1,do:()=>campaignCausewayFleetRelief()},{when:()=>cmp.d.fords===1,do:()=>campaignCausewayFordSiegeRelief()},{at:80,do:()=>raid(5,['scout','mil','arc','spear','mil'],'Enemy scouts are testing the inland approach!')},{at:180,do:()=>raid(8,['ram','knight','arc','spear','knight','arc','spear','mil'],'A mixed force is advancing toward the causeway!')},{at:320,do:()=>raid(9,['ram','ram','knight','knight','arc','spear','mil','arc','knight'],'The rival commits its siege reserve. Protect your towers and keep your army together!')},{at:470,do:()=>note('A galley fleet can contest the strait while towers and land troops hold the ford approaches. Do not expose siege units to cavalry.')},{at:115,do:()=>{if(!cb('dock'))note('Causeway scouting: send a Knight east along your bank to reveal clear coastal ground, then have a Villager build a Dock beside the navigable strait.')}}]},
{t:'The Crown Holds the Crossing',b:'The enemy has fallen back beyond the Causeway. Establish two Castles to rally a royal reserve and long-range Trebuchets before leading the assault. The rival commits three timed combined-arms attacks; hold the line, then break through. Protect your siege train with infantry and cavalry, withstand the counterattacks, then destroy the rival Town Centre. For extra royal defenders, build one Castle overlooking the northern ford and another overlooking the southern ford on your bank. Forts far from the crossings do not earn these optional garrisons.',civ:2,en:6,mt:7,msz:1,layout:12,seed:918,diff:3,aip:5,vm:0,
 setup(){S.age[0]=3;S.res[0]={f:1800,w:1800,g:1500,s:1900};const home=tcOf(0);if(home)for(let i=0;i<6;i++)put(0,'house',home.x-8+(i%3)*3,home.y-8+Math.floor(i/3)*3);grp(0,'knight',6);grp(0,'xbow',10);grp(0,'spear',8);grp(0,'bomb',2);const enemyStrategy=S.ai[1];if(enemyStrategy){enemyStrategy.nx=Math.max(enemyStrategy.nx||0,600);enemyStrategy.rn=Math.max(enemyStrategy.rn||0,600)}const e=tcOf(1);if(e){S.age[1]=3;S.res[1]={f:1500,w:1300,g:1200,s:800};put(1,'castle',e.x-8,e.y+8);put(1,'tower',e.x-5,e.y+12);put(1,'tower',e.x-12,e.y+6);grp(1,'knight',6);grp(1,'xbow',8);grp(1,'spear',6);grp(1,'ram',2);grp(1,'bomb',1)}},
 goals:[{id:'castles',t:'Build 2 completed Castles',ok:()=>S.bs.filter(b=>b.t===0&&b.k==='castle'&&b.done&&b.hp>0).length>=2},{id:'northford',t:'Optional: Fortify the north Causeway ford',optional:true,ok:()=>!!campaignCausewayFordCastle(.22)},{id:'southford',t:'Optional: Fortify the south Causeway ford',optional:true,ok:()=>!!campaignCausewayFordCastle(.78)},{id:'tc',t:'Destroy the enemy Town Centre',ok:()=>cmp.t>3&&!tcOf(1)}],
 ev:[{at:20,do:()=>note('Protect your builders and use the shallow fords. Castles near the northern and southern crossings each rally four defenders, but remote Castles do not.')},{when:()=>cmp.d.northford===1,do:()=>campaignCausewayFordReserve(.22)},{when:()=>cmp.d.southford===1,do:()=>campaignCausewayFordReserve(.78)},{when:()=>cmp.d.castles===1,do:()=>campaignCrownRoyalReserve()},{at:110,do:()=>raid(5,['knight','knight','xbow','spear','ram'],'The rival is testing the first crossing with a mixed assault!')},{at:260,do:()=>raid(7,['ram','ram','bomb','knight','knight','xbow','spear'],'Heavy siege is advancing. Keep Bombard Cannons protected and repair damaged Castles.')},{at:440,do:()=>raid(8,['bomb','ram','ram','knight','knight','xbow','spear','gal'],'The enemy commits its final reserve to break your fortified line!')}]}
,
{t:'The Iron Pass',b:'The mountain pass is the only road through which the royal supply wagons can reach the frontier. An enemy host is gathering beyond the ridge. Build a layered defence, keep your army alive and hold the pass until the royal convoy escapes. Your forward camp starts with two Houses; extend your housing if you need to reinforce the garrison.',civ:5,en:2,mt:5,msz:1,seed:919,diff:2,aip:6,vm:0,
 setup(){S.age[0]=1;S.res[0]={f:900,w:850,g:350,s:250};grp(0,'spear',6);grp(0,'arc',6);grp(0,'scout',2);const home=tcOf(0);if(home){put(0,'house',home.x-8,home.y+5);put(0,'house',home.x+8,home.y+5)}// This hold mission already sends four timed scripted assaults; avoid piling the normal autonomous waves over them before the convoy escapes.
 const enemyStrategy=S.ai[1];if(enemyStrategy){enemyStrategy.nx=Math.max(enemyStrategy.nx||0,600);enemyStrategy.rn=Math.max(enemyStrategy.rn||0,600)}const e=tcOf(1);if(e){S.age[1]=1;S.res[1]={f:900,w:650,g:300,s:150};grp(1,'scout',3);grp(1,'spear',5)}},
 goals:[{id:'towers',t:'Build 2 completed Towers',ok:()=>S.bs.filter(b=>b.t===0&&b.k==='tower'&&b.done&&b.hp>0).length>=2},{id:'army',t:'Keep 15 land soldiers alive',sustained:true,ok:()=>aliveUnits(0).filter(u=>U[u.k].dmg>0&&!U[u.k].sh&&!['vil','king','mon','cart','cog'].includes(u.k)).length>=15},{id:'hold',t:'Hold the pass for 9:00',ok:()=>cmp.t>=540}],
 ev:[{at:20,do:()=>note('The Iron Pass: place Towers to cover the approach, but keep soldiers nearby to stop siege units.')},{at:95,do:()=>raid(5,['scout','spear','scout','arc','spear'],'Enemy scouts have found the pass!')},{at:205,do:()=>raid(7,['spear','arc','scout','spear','arc','scout','ram'],'The first serious assault is advancing. Protect your Towers from the ram!')},{at:325,do:()=>raid(9,['knight','spear','arc','knight','spear','arc','ram','scout','arc'],'Enemy cavalry and siege are attacking together!')},{at:440,do:()=>raid(10,['ram','ram','knight','knight','spear','arc','spear','arc','scout','knight'],'The final host is here. Hold the pass until the convoy clears the road!')}]}
]; 
const campDone=()=>{try{const d=JSON.parse(localStorage.getItem('ck_camp'));return Array.isArray(d)?Array.from({length:CAMP.length},(_,i)=>d[i]===1||d[i]===true?1:0):[]}catch(e){return[]}};
function campMark(i){if(!Number.isInteger(i)||i<0||i>=CAMP.length)return;try{const d=campDone();d[i]=1;localStorage.setItem('ck_camp',JSON.stringify(d))}catch(e){}}
function startScenario(i){if(!Number.isInteger(i)||i<0||i>=CAMP.length)return false;const sc=CAMP[i];if(!sc)return false;if(!PRF)PRF={civ,msz,mt,mapLayout,diff,aip,vm,scoreLimit};civ=sc.civ;msz=sc.msz;mt=sc.mt;mapLayout=Number.isInteger(sc.layout)?sc.layout:0;if(mapLayout)applyMapLayout();diff=sc.diff;aip=sc.aip;vm=sc.vm;scoreLimit=1200;seedOv=sc.seed;aiCiv=sc.en;cmp={i,t:0,d:{},e:{}};start();seedOv=null;aiCiv=-1;if(sc.setup)sc.setup();note('Mission '+(i+1)+': '+sc.t);return true}
function cmpTick(dt){if(!cmp||!Number.isInteger(cmp.i))return;const sc=CAMP[cmp.i];if(!sc||S.over||!Number.isFinite(dt)||dt<=0)return;if(!tcOf(0)){endGame('lose','Your Town Centre fell');return}if(cmp.i===5&&!S.us.some(u=>u&&u.t===0&&u.k==='king'&&u.hp>0)){endGame('lose','Your King has fallen');return}if(cmp.i===7&&cmp.e[3]&&!cmp.d.caravan&&!S.us.some(u=>u&&u.t===0&&u.k==='cart'&&u.campaignConvoy==='redwater'&&u.hp>0)){endGame('lose','The Redwater merchant convoy was destroyed');return}cmp.t+=dt;cmp.k=(cmp.k||0)+1;if(cmp.i===7&&cmp.e[3]&&!cmp.d.caravan&&cmp.k%30===0)campaignRedwaterCaravanAdvance();sc.ev.forEach((e,i)=>{if(cmp.e[i])return;const ready=(e.at!==undefined||typeof e.when==='function')&&(e.at===undefined||cmp.t>=e.at)&&(typeof e.when!=='function'||e.when());if(ready){cmp.e[i]=1;e.do()}});if(cmp.k%15)return;let all=true;for(const g of sc.goals){const sustained=g.sustained===true;if(cmp.d[g.id]&&!sustained)continue;if(g.ok()){if(!cmp.d[g.id]){cmp.d[g.id]=1;note('Objective complete: '+g.t);sfx('tech')}}else{if(!g.optional)all=false;if(sustained&&cmp.d[g.id]){cmp.d[g.id]=0;note('Objective needs restoring: '+g.t)}}}if(all){S.over='win';mode='end';campMark(cmp.i);sting(true);rumble(700,1,.6)}}
function restoreCampaignPrefs(){if(PRF){({civ,msz,mt,mapLayout,diff,aip,vm,scoreLimit}=PRF);PRF=null}}
function leaveCampaign(){restoreCampaignPrefs();cmp=null;seedOv=null;aiCiv=-1;mode='title'}
function endA(){if(!cmp){start();return}if(S.over==='win'){const next=nextCampaignMission(cmp.i);if(next!==null){bi=next;mode='brief'}else{mode='camp';ci=0}}else startScenario(cmp.i)}
function endB(){if(cmp){if(S.over==='win'&&nextCampaignMission(cmp.i)===null){leaveCampaign()}else{mode='camp';ci=0}}else leaveCampaign()}

const CAMP_ARCS=[{n:'The Crown of Ashford',ids:[0,1,2,3,4,5,8]},{n:'Frontier Wars',ids:[6,7]},{n:'The Royal Campaign',ids:[9,10,11]},{n:'Coastal War',ids:[12,13,14]},{n:'Northern March',ids:[15,18]},{n:'The Causeway Campaign',ids:[16,17]}];
function nextCampaignMission(i){const arc=CAMP_ARCS.find(a=>a.ids.includes(i));if(!arc)return null;const p=arc.ids.indexOf(i);return p>=0&&p<arc.ids.length-1?arc.ids[p+1]:null}
const campItems=()=>{const dn=campDone(),arc=CAMP_ARCS[ca]||CAMP_ARCS[0],ids=arc.ids.filter(i=>Number.isInteger(i)&&CAMP[i]&&typeof CAMP[i].t==='string');return[{n:'Campaign: '+arc.n,v:()=>((ca+1)+' / '+CAMP_ARCS.length),d:()=> 'Use Left/Right to switch campaign.',l:()=>{ca=(ca+CAMP_ARCS.length-1)%CAMP_ARCS.length;ci=0},r:()=>{ca=(ca+1)%CAMP_ARCS.length;ci=0}},...ids.map((i,j)=>{const m=CAMP[i],locked=j>0&&!dn[ids[j-1]];return{n:(j+1)+'. '+m.t+(dn[i]?'  (complete)':locked?'  (locked)':''),d:()=>String(m.b||'Mission briefing unavailable.').slice(0,100)+'...',a:()=>{if(!locked){bi=i;mode='brief'}}}}),{n:'Back',a:()=>{leaveCampaign()}}]};
function campCtl(){const it=campItems(),n=it.length;ci=Number.isInteger(ci)&&ci>=0&&ci<n?ci:0;if(E[12])ci=(ci+n-1)%n;if(E[13])ci=(ci+1)%n;const r=it[ci];if(E[14]&&r.l)r.l();if(E[15]&&r.r)r.r();if(E[0]&&r.a)r.a();if(E[1]||E[9])leaveCampaign()}
function briefCtl(){if(E[0]){const arc=Number.isInteger(bi)?CAMP_ARCS.find(a=>a.ids.includes(bi)):null;const pos=arc?arc.ids.indexOf(bi):-1;const done=campDone();if(arc&&(pos===0||pos>0&&done[arc.ids[pos-1]]))startScenario(bi);else mode='camp'}if(E[1]||E[9])mode='camp'}

