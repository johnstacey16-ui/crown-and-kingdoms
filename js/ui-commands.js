/* Xbox command wheel, villager priority and quick-select HUD components.
 * Original presentation only: move no gameplay input, simulation or save state.
 * Loaded after js/ui.js so the shared text and drawing primitives remain single-owned. */
/* In-game radial commands, control groups, quick-select strip and unit tooltip labels. */
const DS={'Villager':'Gathers, builds and repairs. Weak in combat.','Militia':'Cheap infantry. Available from the Founding Age.','Spearman':'Infantry that counters cavalry.','Archer':'Ranged. Weak against melee and cavalry.','Scout Cavalry':'Fast scout and raider.','Knight':'Strong cavalry, good against archers. Castle Age.','Crossbowman':'Stronger ranged infantry. Castle Age.','Battering Ram':'Siege: wrecks buildings, weak against units. Castle Age.','Monk':'Heals allies, converts enemy units, carries relics.','House':'+5 population cap.','Lumber Camp':'Wood drop-off. Build beside forests.','Mining Camp':'Gold and stone drop-off. Build beside mines.','Mill':'Food drop-off for berries, deer and farms.','Farm':'Renewable food; reseeds itself for 60 wood.','Barracks':'Trains Militia; Spearmen unlock in Feudal Age.','Archery Range':'Trains archers. Needs a Barracks.','Stable':'Trains cavalry. Needs a Barracks.','Blacksmith':'Military upgrades. Needs a Barracks.','Market':'Trade 100 at a time for Gold. Prices move with each trade, then drift back.','Trade Cart':'Automatically carries gold between different kingdoms’ markets; income scales with route distance.','Trade Cog':'A naval trader that carries gold between different kingdoms’ docks.','Watch Tower':'Shoots enemies in range and reveals terrain.','Castle':'Strong defence; trains Knights, Crossbowmen and Rams.','Stone Wall':'Blocks movement. Keep pressing A to chain walls, B to stop. Leave a gap!','Monastery':'Trains Monks. Needs Castle Age.','Siege Workshop':'Trains Rams, Mangonels and Scorpions. Castle Age.','University':'Crane, Masonry and Arrowslits. Needs a Blacksmith.','Trebuchet':'Huge range, wrecks buildings. Imperial Age.','Camel Rider':'Counters cavalry. Castle Age.','King':'Regicide: if your King dies you lose.','Wonder':'Hold it for 5 minutes to win (Wonder victory only).','Gate':'Your units pass through; enemies are blocked.','Outpost':'Cheap lookout with a long view.','Skirmisher':'Cheap ranged unit that counters archers.','Mangonel':'Siege with splash damage. Castle Age.','Scorpion':'Bolt thrower, strong against infantry.','Dock':'Build on the shore. Trains Fishing Ships and War Galleys.','Fishing Ship':'Catches fish and delivers them to a Dock.','Transport Ship':'Carries 5 land units. A on it to board, A on shore to unload.','War Galley':'Ranged warship. Castle Age.','Advance: Feudal Age':'Unlocks military buildings, towers and the Market.','Advance: Castle Age':'Unlocks Castle, Knights, Crossbowmen, Rams and Monks.','Advance: Imperial Age':'Unlocks the strongest upgrades.'};

function stt(a){
 if(!a||a.q)return '';
 const d=U[a.k],t=S.tech?.[a.t];
 // A stale selection may outlive its unit definition or team's research on
 // recovery/reload. The HUD must remain drawable so B can deselect it.
 if(!d||!t)return 'Stats unavailable';
 if(a.k==='mon')return 'Conversion '+conversionRange(a,null)+'  Faith '+Math.floor(a.faith??100)+'%';
 const b=(d.rng<2?meleeResearchAttackBonus(t):arrowBonus(a))+
  (a.k==='scout'&&(S.age?.[a.t]||0)>=1?2:0)+(t.atkb&&t.atkb[a.k]||0);
 return 'Atk '+d.dmg+(b?'+'+b:'')+'  Armor '+combatArmor(a,'m')+'/'+combatArmor(a,'p')+
  (d.rng>2?'  Rng '+attackRange(a):'');
}

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

// List menus use the same validated entries and controller page bounds as
// radial menus. A stale index or malformed command cannot break the HUD.
function listMenuPage(m){
 const {items,a0,n}=radialMenuPage(m),N=items.length;
 const i=n&&Number.isInteger(m?.i)&&m.i>=a0&&m.i<a0+n?m.i:a0;
 return {items,N,i}
}

/* Figma focus treatment for the existing controller-owned command wheels.
 * Compact layouts only change the drawing: radialMenuPage and the gamepad
 * direction/selection logic continue to use their unchanged item indices. */
const CK_COMMAND_UI=Object.freeze({
 focus:'#f2c14e',selected:'#354651',panel:'#111820',text:'#f1f5f9',
 muted:'#cbd5e1',brass:'#d9b568',cream:'#f5d27b',danger:'#ff8b82'
});
function commandLabelFit(value,width,size){
 const label=String(value??''),limit=Math.max(1,Math.floor(Math.max(0,width)/(Math.max(1,size)*.62)));
 return label.length<=limit?label:label.slice(0,Math.max(0,limit-1))+'…';
}
function compactCommandLayout(width,height,count,selected){
 const w=Math.max(200,Math.min(560,width-24));
 const rh=48,visible=Math.min(count,Math.max(1,Math.floor((height-154)/rh)));
 const focus=Math.max(0,Math.min(selected,count-1));
 const start=Math.max(0,Math.min(focus-Math.floor(visible/2),count-visible));
 const h=52+visible*rh+54;
 return {w,x:(width-w)/2,y:Math.max(4,(height-h)/2),rh,visible,start,h};
}
function drawCompactRadialMenu(m,items,a0,n,pg,pageCount,title){
 const raw=Number.isInteger(m?.i)?m.i:a0;
 const focus=raw>=a0&&raw<a0+n?raw:a0;
 const l=compactCommandLayout(CW,CH,n,focus-a0),x=l.x,y=l.y,w=l.w;
 X.fillStyle='rgba(0,0,0,.65)';X.fillRect(0,0,CW,CH);
 X.fillStyle=CK_COMMAND_UI.panel;X.fillRect(x,y,w,l.h);
 X.strokeStyle=CK_COMMAND_UI.brass;X.lineWidth=2;X.strokeRect(x+.5,y+.5,w-1,l.h-1);
 tx(commandLabelFit(title,w-110,19),x+14,y+35,19,CK_COMMAND_UI.cream);
 tx((pg+1)+'/'+pageCount+'  •  '+(focus-a0+1)+'/'+n,
  x+w-14,y+35,14,CK_COMMAND_UI.muted,'right');
 for(let row=0;row<l.visible;row++){
  const index=a0+l.start+row,it=items[index],yy=y+52+row*l.rh,
   selected=index===focus;
  X.fillStyle=selected?CK_COMMAND_UI.selected:'rgba(255,255,255,.035)';
  X.fillRect(x+9,yy,w-18,l.rh-4);
  if(selected){
   X.strokeStyle=CK_COMMAND_UI.focus;X.lineWidth=2;
   X.strokeRect(x+9.5,yy+.5,w-19,l.rh-5);
   X.fillStyle=CK_COMMAND_UI.focus;X.fillRect(x+15,yy+8,4,l.rh-20);
  }
  tx(commandLabelFit(it.l,w-143,16),x+28,yy+30,16,
   it.lk?CK_COMMAND_UI.muted:selected?CK_COMMAND_UI.cream:CK_COMMAND_UI.text);
  const cost=it.lk||cs(it.c);
  tx(commandLabelFit(cost,98,13),x+w-18,yy+29,13,
   it.lk?CK_COMMAND_UI.danger:CK_COMMAND_UI.muted,'right');
 }
 const selectedItem=items[focus],info=selectedItem?(DS[selectedItem.l]||''):'';
 tx(commandLabelFit(info||(!n?'No commands available — A or B to close':'A: confirm   Y: page   B: close'),
  w-28,13),x+14,y+l.h-20,13,CK_COMMAND_UI.muted);
 tx('LEFT STICK  CHOOSE     A  CONFIRM     Y  PAGE     B  CLOSE',
  CW/2,Math.min(CH-7,y+l.h+20),12,CK_COMMAND_UI.muted,'center');
}
function drawRadial(){const m=menu,{items,pr,pg,a0,n}=radialMenuPage(m),vis=items.slice(a0,a0+n),cx=CW/2,cy=CH/2-10,R=Math.min(CW,CH)*.33;
const title=typeof m?.title==='string'?m.title:'Commands',ttl=title==='Build'?(pg===0?'Economic buildings':'Military buildings'):title;
if(CW<720||CH<500){drawCompactRadialMenu(m,items,a0,n,pg,pr.length,ttl);return}
X.fillStyle='rgba(0,0,0,.55)';X.fillRect(0,0,CW,CH);X.fillStyle='rgba(30,22,12,.92)';X.beginPath();X.arc(cx,cy,R+50,0,7);X.fill();X.strokeStyle=CK_COMMAND_UI.brass;X.lineWidth=3;X.stroke();X.fillStyle='#241709';X.beginPath();X.arc(cx,cy,R*.46,0,7);X.fill();X.stroke();
tx(commandLabelFit(ttl,R*1.12,Math.min(20,R/12)),cx,cy-R*.18,Math.min(20,R/12),CK_COMMAND_UI.cream,'center');if(pr.length>1)tx('Y: switch page ('+(pg+1)+'/'+pr.length+')',cx,cy+R*.04,Math.min(15,R/16),CK_COMMAND_UI.muted,'center');
if(!n)tx('No commands available — A or B to close',cx,cy+R*.26,17,CK_COMMAND_UI.muted,'center');
const w=Math.min(200,2*R*Math.sin(Math.PI/Math.max(n,3))*.95),h=48;
vis.forEach((it,j)=>{const a=j/n*6.2832-1.5708,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,sel=a0+j===m.i;
X.fillStyle=sel?CK_COMMAND_UI.selected:'rgba(60,44,24,.95)';X.fillRect(x-w/2,y-h/2,w,h);
X.strokeStyle=sel?CK_COMMAND_UI.focus:CK_COMMAND_UI.brass;X.lineWidth=sel?3:1.5;X.strokeRect(x-w/2,y-h/2,w,h);
tx(commandLabelFit(it.l,w-8,15),x,y-3,15,it.lk?CK_COMMAND_UI.muted:CK_COMMAND_UI.text,'center');
tx(commandLabelFit(it.lk||cs(it.c),w-8,12),x,y+13,12,it.lk?CK_COMMAND_UI.danger:CK_COMMAND_UI.cream,'center')});
const sit=items[Number.isInteger(m.i)?m.i:0];if(sit)tx(commandLabelFit(DS[sit.l]||'',Math.min(2*R,540),15),cx,cy+R*.26,15,CK_COMMAND_UI.muted,'center');tx('Left stick: choose    A: confirm    LT+A: train x5    Y: switch page    X: cancel last    B or release RT: close',cx,CH-135,17,CK_COMMAND_UI.muted,'center')}


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
  X.fillStyle=selected?'#354651':'rgba(60,44,24,.98)';X.fillRect(x-w/2,y-h/2,w,h);
  X.strokeStyle=selected?'#f2c14e':'#ad904f';X.lineWidth=selected?3:1.5;X.strokeRect(x-w/2,y-h/2,w,h);
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
for(let i=0;i<8;i++){const a=i/8*6.2832-1.5708,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,g=controlGroupMembers(S.cg&&S.cg[i],current),sel=cgo.sel===i;X.fillStyle=sel?'#354651':'rgba(60,44,24,.95)';X.fillRect(x-48,y-24,96,48);X.strokeStyle=sel?'#f2c14e':'#d9b568';X.lineWidth=sel?3:1.5;X.strokeRect(x-48,y-24,96,48);tx(String(i+1),x-38,y-4,20,'#f2c14e');tx(g.length?g.length+' units':'empty',x+8,y+10,15,g.length?'#fff':'#888','center')}
tx('CONTROL GROUPS',cx,cy-6,26,'#f2c14e','center');tx('Left stick: pick   X: assign selection   Y: focus   release LB: select',cx,cy+22,15,'#cbd5e1','center')}

/* Four original D-pad shortcuts remain in the same order; compact screens
 * dock them above the minimap rather than drawing across unit details. */
function quickBarLayout(width,height,minimapLeft){
 const compact=width<1000;
 return {x:compact?8:Math.max(8,minimapLeft-262),y:height-(compact?212:112),w:248,h:86,compact};
}
function quickBar(){const iv=quickSelectionChoices('idle').length,mil=quickSelectionChoices('mil').length,sup=quickSelectionChoices('support').length,{x:x0,y:y0}=quickBarLayout(CW,CH,mm.x);
[[0,iv,'Idle'],[1,sup,'Support'],[2,quickSelectionChoices('tc').length,'Town C.'],[3,mil,'Military']].forEach(q=>{const d=q[0],x=x0+d*62,y=y0;X.fillStyle='rgba(20,14,8,.85)';X.fillRect(x,y,56,86);X.strokeStyle='#c9a24a';X.lineWidth=1.5;X.strokeRect(x,y,56,86);X.fillStyle='#f2c14e';const t3=[[[0,-8],[7,6],[-7,6]],[[8,0],[-6,7],[-6,-7]],[[0,8],[7,-6],[-7,-6]],[[-8,0],[6,7],[6,-7]]][d];poly(t3.map(p=>[x+28+p[0],y+18+p[1]]));X.fill();tx(q[2],x+28,y+50,12,'#cbd5e1','center');tx(String(q[1]),x+28,y+76,22,q[1]?'#fff':'#777','center')})}

