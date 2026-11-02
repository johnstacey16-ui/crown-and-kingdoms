/* Xbox command wheel, villager priority and quick-select HUD components.
 * Original presentation only: move no gameplay input, simulation or save state.
 * Loaded after js/ui.js so the shared text and drawing primitives remain single-owned. */
/* In-game radial commands, control groups, quick-select strip and unit tooltip labels. */
const DS={'Villager':'Gathers, builds and repairs. Weak in combat.','Militia':'Cheap infantry. Available from the Founding Age.','Spearman':'Infantry that counters cavalry.','Archer':'Ranged. Weak against melee and cavalry.','Scout Cavalry':'Fast scout and raider.','Knight':'Strong cavalry, good against archers. Castle Age.','Crossbowman':'Stronger ranged infantry. Castle Age.','Battering Ram':'Siege: wrecks buildings, weak against units. Castle Age.','Monk':'Heals allies, converts enemy units, carries relics.','House':'+5 population cap.','Lumber Camp':'Wood drop-off. Build beside forests.','Mining Camp':'Gold and stone drop-off. Build beside mines.','Mill':'Food drop-off for berries, deer and farms.','Farm':'Renewable food; reseeds itself for 60 wood.','Barracks':'Trains Militia; Spearmen unlock in Feudal Age.','Archery Range':'Trains archers. Needs a Barracks.','Stable':'Trains cavalry. Needs a Barracks.','Blacksmith':'Military upgrades. Needs a Barracks.','Market':'Trade 100 at a time for Gold. Prices move with each trade, then drift back.','Trade Cart':'Automatically carries gold between different kingdoms’ markets; income scales with route distance.','Trade Cog':'A naval trader that carries gold between different kingdoms’ docks.','Watch Tower':'Shoots enemies in range and reveals terrain.','Castle':'Strong defence; trains Knights, Crossbowmen and Rams.','Stone Wall':'Blocks movement. Keep pressing A to chain walls, B to stop. Leave a gap!','Monastery':'Trains Monks. Needs Castle Age.','Siege Workshop':'Trains Rams, Mangonels and Scorpions. Castle Age.','University':'Crane, Masonry and Arrowslits. Needs a Blacksmith.','Trebuchet':'Huge range, wrecks buildings. Imperial Age.','Camel Rider':'Counters cavalry. Castle Age.','King':'Regicide: if your King dies you lose.','Wonder':'Hold it for 5 minutes to win (Wonder victory only).','Gate':'Your units pass through; enemies are blocked.','Outpost':'Cheap lookout with a long view.','Skirmisher':'Cheap ranged unit that counters archers.','Mangonel':'Siege with splash damage. Castle Age.','Scorpion':'Bolt thrower, strong against infantry.','Dock':'Build on the shore. Trains Fishing Ships and War Galleys.','Fishing Ship':'Catches fish and delivers them to a Dock.','Transport Ship':'Carries 5 land units. A on it to board, A on shore to unload.','War Galley':'Ranged warship. Castle Age.','Advance: Feudal Age':'Unlocks military buildings, towers and the Market.','Advance: Castle Age':'Unlocks Castle, Knights, Crossbowmen, Rams and Monks.','Advance: Imperial Age':'Unlocks the strongest upgrades.'};

function stt(a){if(a.q)return '';if(a.k==='mon')return 'Conversion '+conversionRange(a,null)+'  Faith '+Math.floor(a.faith??100)+'%';const d=U[a.k],t=S.tech[a.t],ml=d.rng<2,b=(ml?(t.atkM2?5:t.atkM?2:0):arrowBonus(a))+(t.atkb&&t.atkb[a.k]||0),ib=((a.k==='mil'||a.k==='spear'||a.k==='skirm')&&t.armI?1:0)+((a.k==='arc'||a.k==='xbow')&&t.armR?1:0);return 'Atk '+d.dmg+(b?'+'+b:'')+'  Armor '+(MA[a.k]||0)+(ib?'+'+ib:'')+'/'+(PRA[a.k]||0)+(ib?'+'+ib:'')+(d.rng>2?'  Rng '+attackRange(a):'')}

// The radial renderer and gamepad handler must agree on empty, stale and
// paginated command lists. An empty list is one safe, zero-choice page.
function radialMenuPage(m){
 // Keep item positions stable for controller cursors and custom build pages.
 // Invalid/stale entries render as inert placeholders, never call unknown code.
 const raw=Array.isArray(m?.items)?m.items:[],
  items=raw.map(item=>item&&typeof item==='object'&&typeof item.l==='string'&&item.l.length?
   {...item,c:item.c&&typeof item.c==='object'?item.c:{},
    lk:typeof item.lk==='string'?item.lk:''}:
   {l:'Unavailable',lk:'',c:{},fn:null}),N=items.length;
 const custom=Array.isArray(m?.pr)?m.pr.filter(p=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&Number.isInteger(p[1])&&p[0]>=0&&p[0]<N&&p[1]>p[0]&&p[1]<=N):[];
 const pr=custom.length?custom:N?Array.from({length:Math.ceil(N/12)},(_,i)=>[i*12,Math.min(N,i*12+12)]):[[0,0]];
 const requested=Number.isInteger(m?.pg)&&(!Array.isArray(m?.pr)||custom.length)?m.pg:0,pg=Math.max(0,Math.min(requested,pr.length-1));
 return {items,pr,pg,a0:pr[pg][0],n:pr[pg][1]-pr[pg][0]};
}

function drawRadial(){const m=menu,{items,pr,pg,a0,n}=radialMenuPage(m),vis=items.slice(a0,a0+n),cx=CW/2,cy=CH/2-10,R=Math.min(CW,CH)*.33;
X.fillStyle='rgba(0,0,0,.55)';X.fillRect(0,0,CW,CH);X.fillStyle='rgba(30,22,12,.92)';X.beginPath();X.arc(cx,cy,R+50,0,7);X.fill();X.strokeStyle='#c9a24a';X.lineWidth=3;X.stroke();X.fillStyle='#241709';X.beginPath();X.arc(cx,cy,R*.46,0,7);X.fill();X.stroke();
const title=typeof m?.title==='string'?m.title:'Commands',ttl=title==='Build'?(pg===0?'Economic buildings':'Military buildings'):title;tx(ttl,cx,cy-R*.18,Math.min(24,R/10),'#f2c14e','center');if(pr.length>1)tx('Y: switch page ('+(pg+1)+'/'+pr.length+')',cx,cy+R*.04,Math.min(15,R/16),'#cbd5e1','center');
if(!n)tx('No commands available — A or B to close',cx,cy+R*.26,17,'#cbd5e1','center');
 const w=Math.min(200,2*R*Math.sin(Math.PI/Math.max(n,3))*.95),h=42;vis.forEach((it,j)=>{const a=j/n*6.2832-1.5708,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,sel=a0+j===m.i;X.fillStyle=sel?'#2f63c4':'rgba(60,44,24,.95)';X.fillRect(x-w/2,y-h/2,w,h);X.strokeStyle=sel?'#fff':'#c9a24a';X.lineWidth=sel?3:1.5;X.strokeRect(x-w/2,y-h/2,w,h);tx(it.l.slice(0,24),x,y-3,15,it.lk?'#aaa':'#fff','center');tx(it.lk||cs(it.c),x,y+13,12,it.lk?'#ffb0b0':'#f0dca6','center')});
const sit=items[Number.isInteger(m.i)?m.i:0];if(sit)tx(DS[sit.l]||'',cx,cy+R*.26,15,'#cbd5e1','center');tx('Left stick: choose    A: confirm    LT+A: train x5    Y: switch page    X: cancel last    B or release RT: close',cx,CH-135,17,'#cbd5e1','center')}


function drawVillagerPriorityWheel(){
 const p=S.vp||(S.vp=createVillagerPriority()),manual=vpWheel.manual;
 const n=manual?4:VILLAGER_PRIORITY_PRESETS.length+1,cx=CW/2,cy=CH/2-12,R=Math.min(CW,CH)*.3;
 X.fillStyle='rgba(0,0,0,.65)';X.fillRect(0,0,CW,CH);
 X.fillStyle='rgba(30,22,12,.95)';X.beginPath();X.arc(cx,cy,R+50,0,7);X.fill();
 X.strokeStyle='#d8ad55';X.lineWidth=3;X.stroke();
 X.fillStyle='#21180f';X.beginPath();X.arc(cx,cy,R*.46,0,7);X.fill();
 tx(manual?'MANUAL PRIORITIES':'VILLAGER PRIORITIES',cx,cy-R*.16,Math.min(23,R/10),'#f2c14e','center');
 tx(p.enabled?'AUTOMATION ON':'AUTOMATION OFF',cx,cy+R*.05,14,p.enabled?'#9ae6b4':'#ffb0b0','center');
 const targets=villagerPriorityTargets(0,p);
 tx('Targets: '+WORKER_TARGETS.map(r=>r.k.toUpperCase()+' '+targets[r.k]).join(' / '),cx,cy+R*.20,13,'#e8dabb','center');
 const w=Math.min(manual?156:140,2*R*Math.sin(Math.PI/n)*.9),h=manual?66:54;
 for(let i=0;i<n;i++){
  const a=i/n*6.2832-1.5708,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,selected=vpWheel.sel===i;
  X.fillStyle=selected?'#2f63c4':'rgba(60,44,24,.98)';X.fillRect(x-w/2,y-h/2,w,h);
  X.strokeStyle=selected?'#fff':'#ad904f';X.lineWidth=selected?3:1.5;X.strokeRect(x-w/2,y-h/2,w,h);
  const name=manual?WORKER_TARGETS[i].n:i===VILLAGER_PRIORITY_PRESETS.length?'Auto Farms':VILLAGER_PRIORITY_PRESETS[i].name;
  const detail=manual?(p[WORKER_TARGETS[i].k]+' weight / '+targets[WORKER_TARGETS[i].k]+' target'):i===VILLAGER_PRIORITY_PRESETS.length?(p.autoFarms?'ON':'OFF'):VILLAGER_PRIORITY_PRESETS[i].weights.join(':');
  tx(name,x,y-3,15,'#fff','center');tx(detail,x,y+17,13,'#e5d5ad','center');
 }
 tx(manual?'Left stick: resource   A: add   B: remove   Y: presets   R3: close':
    'Left stick: preset   A: apply   Y: manual   X: automation   B/R3: close',
    cx,CH-110,16,'#e2e8f0','center');
 tx('Auto Farms toggles farm construction; preset ratios from console reference.',cx,CH-82,13,'#f3c58b','center');
}

function drawCg(){const cx=CW/2,cy=CH/2,R=Math.min(CW,CH)*.26;X.fillStyle='rgba(0,0,0,.5)';X.fillRect(0,0,CW,CH);X.fillStyle='rgba(30,22,12,.92)';X.beginPath();X.arc(cx,cy,R+55,0,7);X.fill();X.strokeStyle='#c9a24a';X.lineWidth=3;X.stroke();
const current=new Set([...S.us,...S.bs]);
for(let i=0;i<8;i++){const a=i/8*6.2832-1.5708,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,g=controlGroupMembers(S.cg&&S.cg[i],current),sel=cgo.sel===i;X.fillStyle=sel?'#2f63c4':'rgba(60,44,24,.95)';X.fillRect(x-48,y-24,96,48);X.strokeStyle=sel?'#fff':'#c9a24a';X.lineWidth=sel?3:1.5;X.strokeRect(x-48,y-24,96,48);tx(String(i+1),x-38,y-4,20,'#f2c14e');tx(g.length?g.length+' units':'empty',x+8,y+10,15,g.length?'#fff':'#888','center')}
tx('CONTROL GROUPS',cx,cy-6,26,'#f2c14e','center');tx('Left stick: pick   X: assign selection   Y: focus   release LB: select',cx,cy+22,15,'#cbd5e1','center')}

function quickBar(){const iv=quickSelectionChoices('idle').length,mil=quickSelectionChoices('mil').length,sup=quickSelectionChoices('support').length,x0=mm.x-262,y0=CH-112;
[[0,iv,'Idle'],[1,sup,'Support'],[2,quickSelectionChoices('tc').length,'Town C.'],[3,mil,'Military']].forEach(q=>{const d=q[0],x=x0+d*62,y=y0;X.fillStyle='rgba(20,14,8,.85)';X.fillRect(x,y,56,86);X.strokeStyle='#c9a24a';X.lineWidth=1.5;X.strokeRect(x,y,56,86);X.fillStyle='#f2c14e';const t3=[[[0,-8],[7,6],[-7,6]],[[8,0],[-6,7],[-6,-7]],[[0,8],[7,-6],[-7,-6]],[[-8,0],[6,7],[6,-7]]][d];poly(t3.map(p=>[x+28+p[0],y+18+p[1]]));X.fill();tx(q[2],x+28,y+50,12,'#cbd5e1','center');tx(String(q[1]),x+28,y+76,22,q[1]?'#fff':'#777','center')})}

