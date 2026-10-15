function drawPerfOverlay(dt){
 if(!perfHud||mode!=='play'||!S)return;
 const instant=dt>0?1/dt:0;perfFps=perfFps?perfFps*.85+instant*.15:instant;
 const names=['Blue','Red','Purple','Gold'],w=S.teamN>2?470:365,x=12,y=62,h=64;
 X.fillStyle='rgba(5,8,14,.88)';X.fillRect(x,y,w,h);X.strokeStyle='rgba(201,162,74,.7)';X.lineWidth=1;X.strokeRect(x+.5,y+.5,w-1,h-1);
 tx('PERF  '+perfFps.toFixed(0)+' FPS  '+(dt*1000).toFixed(1)+' ms  |  '+S.us.length+' units  '+S.bs.length+' buildings',x+9,y+17,13,'#f8fafc');
 const teamCounts=new Array(S.teamN).fill(0);for(const u of S.us)if(Number.isInteger(u.t)&&u.t>=0&&u.t<S.teamN)teamCounts[u.t]++;
 let xx=x+9;for(let t=0;t<S.teamN;t++){const label=names[t]+' '+teamCounts[t];tx(label,xx,y+36,12,teamColor(t));xx+=label.length*7.2+17}
 tx('SIM '+perfStepMs.toFixed(2)+' ms (peak '+perfStepPeak.toFixed(2)+')  |  DRAW '+perfDrawMs.toFixed(2)+' ms (peak '+perfDrawPeak.toFixed(2)+')',x+9,y+54,11,'#cbd5e1');
}

const ovr=()=>{const w=Math.min(CW-80,(CH-190)*2)|0;return{x:(CW-w)/2,y:(CH-w/2)/2+12,w,h:w/2}};
function drawOv(){const o=ovr();X.fillStyle='rgba(0,0,0,.85)';X.fillRect(0,0,CW,CH);minimapDraw(o,2);tx('STRATEGIC OVERVIEW'+(S.teamN>2?'    Blue: You  Red/Purple/Gold: rivals':'')+'    A: jump camera    B or View: close',CW/2,o.y-16,S.teamN>2?17:22,'#f2c14e','center')}

/* Technology tree, objectives and controller help screens. Shared engine state is read when called. */
function treeLines(){const c=S.civ?S.civ[0]:civ,L=[['Civilization: '+CIV[c].n,CIV[c].d]];for(const k in B){const d=B[k],tr=(d.tr||[]).concat(k==='castle'?[CIV[c].uu]:[]).map(x=>U[x].n),rs=(d.rs||[]).concat(k==='castle'?[CIV[c].ut.k]:[]).map(x=>TE[x].n);L.push([d.n+(d.age?' ('+AG[d.age].n+')':' (Founding Age)'),(tr.length?'Units: '+tr.join(', ')+'. ':'')+(rs.length?'Tech: '+rs.join(', '):'')])}return L}
function drawTree(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);panel(40,40,CW-80,CH-80);tx('TECHNOLOGY TREE',CW/2,100,38,'#f2c14e','center');const TL=treeLines();for(let i=0;i<12;i++){const e=TL[tsc+i];if(!e)break;const y=160+i*Math.min(56,(CH-300)/12);tx(e[0],70,y,20,'#fde68a');tx(e[1].slice(0,Math.floor((CW-340)/9)),330,y,17,'#e2e8f0')}tx('D-pad Up/Down: scroll    A or B: back',CW/2,CH-70,18,'#9ae6b4','center')}
function drawObj(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);panel(CW/2-440,70,880,CH-140);tx('OBJECTIVES',CW/2,140,40,'#f2c14e','center');const vmx=[S.teamN>2?'Destroy every rival Town Centre.':'Destroy the enemy Town Centre.','Build a Wonder and hold it for 5 minutes. Any rival kingdom can win the same way.','Hold every relic in your Monasteries for 4 minutes. Any rival kingdom can win the same way.',S.teamN>2?'Keep your King alive and defeat every rival King.':'Keep your King alive and kill the enemy King.'][vm],p=S.pl;
tx('Primary: '+vmx,CW/2-400,220,21);tx('You: '+CIV[S.civ[0]].n+'     '+(S.teamN>2?((S.teamN-1)+' rival kingdoms'):('Enemy: '+CIV[S.civ[1]].n))+'     Difficulty: '+['Easy','Normal','Hard'][diff],CW/2-400,270,20,'#cbd5e1');tx('Time '+(S.t/60|0)+' min     Units trained '+p.tr+'     Enemies defeated '+p.kills+'     Resources gathered '+(p.gath|0),CW/2-400,312,20,'#cbd5e1');tx('Age: '+AG[S.age[0]].n+'     Population '+popOf(0)+'/'+capOf(0)+(S.teamN>2?'     Kingdoms alive: '+(new Set([...S.us.map(u=>u.t),...S.bs.map(b=>b.t)]).size):''),CW/2-400,354,20,'#cbd5e1');if(cmp)cmpObj();tx('A, B or View: back',CW/2,CH-110,20,'#9ae6b4','center')}
function drawInfo2(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);const c=inf==='c',L=c?[['Left stick','Move the cursor'],['Right stick','Pan the camera'],['A','Select / command. Hold A and drag for a selection box; double-tap for all of a type on screen'],['A (building selected)','Set its gather (rally) point'],['LT (hold)','Add to selection, place several buildings, train five at a time'],['RT (hold)','Command menu (radial). With nothing selected: site-based commands'],['Y','Shortcut: build, train or change formation. Hold Y and press D-pad Left to change it'],['LB (hold)','Control groups: left stick picks, X assigns, release selects, Y focuses'],['RB','Expand the minimap. A or Y jumps there; D-pad Up flare, Right filter, Left mode'],['D-pad','Quick select: Up idle villager, Right support, Down Town Center, Left military'],['X / B','X orders at the cursor; B cancels or deselects'],['L3 / R3','Centre camera / cycle subgroup'],['View / Menu','Objectives / Pause (options, save, remap, technology tree)']]:[['Game','Crown & Kingdoms is an original controller-first medieval RTS built from modular browser scripts.'],['Goal','Win by the victory mode you chose; the enemy follows the same rules and fog.'],['Controls','Inspired by the published Age of Empires II Xbox controller guide; some bindings are project-specific.'],['Graphics','Original local SVG sprite atlases, team colours, animation metadata and procedural fallbacks.'],['Audio','Synthesised Web Audio with spatial effects, ambience and adaptive music; browser audio may require controller input first.'],['Online','The lobby uses lightweight Supabase Realtime presence/broadcasts; it is not full authoritative match synchronisation.'],['Status','Automated source checks exist. Browser, live deployment and physical Xbox Series S testing are not yet verified.']];
tx(c?'CONTROLS':'ABOUT',CW/2,70,44,'#f2c14e','center');const sp2=Math.min(52,(CH-170)/L.length);L.forEach((e,i)=>{tx(e[0],60,130+i*sp2,20,'#fde68a');tx(e[1].slice(0,Math.floor((CW-330)/9.5)),330,130+i*sp2,19)});tx('A or B: back',CW/2,CH-40,20,'#9ae6b4','center')}

/* Pause-menu model and drawing. Controller navigation remains in js/input.js. */
const GSP=[.5,1,1.5,2,3];
function pmItems(){return[{n:'Resume',a:()=>{mode='play'}},{n:'Objectives',a:()=>{omr='pause';mode='obj'}},{n:'Technology Tree',a:()=>{tsc=0;mode='tree'}},...diplomacyMenuItems(),...tributeMenuItems(),...villagerPriorityMenuItems(),
{n:'Game speed',v:()=>gs+'x',l:()=>{gs=GSP[Math.max(0,GSP.indexOf(gs)-1)]},r:()=>{gs=GSP[Math.min(4,GSP.indexOf(gs)+1)]}},
{n:'Cursor speed',v:()=>cspd+'x',l:()=>{cspd=Math.max(.5,cspd-.25)},r:()=>{cspd=Math.min(2,cspd+.25)}},
{n:'Brightness',v:()=>br.toFixed(1),l:()=>{br=Math.max(.6,+(br-.1).toFixed(1));rs()},r:()=>{br=Math.min(1.5,+(br+.1).toFixed(1));rs()}},
{n:'UI scale',v:()=>ui+'x',l:()=>{const L=[.8,1,1.25,1.5];ui=L[Math.max(0,L.indexOf(ui)-1)];rs()},r:()=>{const L=[.8,1,1.25,1.5];ui=L[Math.min(3,L.indexOf(ui)+1)];rs()}},
{n:'Zoom',v:()=>zm.toFixed(1)+'x',l:()=>setZoom(Math.max(1,+(zm-.2).toFixed(1))),r:()=>setZoom(Math.min(2,+(zm+.2).toFixed(1)))},
{n:'Camera speed',v:()=>camspd+'x',l:()=>{camspd=Math.max(.5,camspd-.25)},r:()=>{camspd=Math.min(2,camspd+.25)}},
{n:'Left stick dead zone',v:()=>dz.toFixed(2),l:()=>{dz=Math.max(.05,dz-.05)},r:()=>{dz=Math.min(.4,dz+.05)}},
{n:'Right stick dead zone',v:()=>dzr.toFixed(2),l:()=>{dzr=Math.max(.05,dzr-.05)},r:()=>{dzr=Math.min(.4,dzr+.05)}},
{n:'Sound',v:()=>snd?'On':'Off',l:()=>{snd^=1},r:()=>{snd^=1},a:()=>{snd^=1}},{n:'Music',v:()=>mus?'On':'Off',l:()=>{mus^=1},r:()=>{mus^=1},a:()=>{mus^=1}},
{n:'Master volume',v:()=>(VOL.m*100|0)+'%',l:()=>{VOL.m=Math.max(0,+(VOL.m-.1).toFixed(1))},r:()=>{VOL.m=Math.min(1,+(VOL.m+.1).toFixed(1))}},
{n:'Music volume',v:()=>(VOL.mu*100|0)+'%',l:()=>{VOL.mu=Math.max(0,+(VOL.mu-.1).toFixed(1))},r:()=>{VOL.mu=Math.min(1,+(VOL.mu+.1).toFixed(1))}},
{n:'Effects volume',v:()=>(VOL.sf*100|0)+'%',l:()=>{VOL.sf=Math.max(0,+(VOL.sf-.1).toFixed(1))},r:()=>{VOL.sf=Math.min(1,+(VOL.sf+.1).toFixed(1))}},
{n:'Ambient volume',v:()=>(VOL.am*100|0)+'%',l:()=>{VOL.am=Math.max(0,+(VOL.am-.1).toFixed(1))},r:()=>{VOL.am=Math.min(1,+(VOL.am+.1).toFixed(1))}},
{n:'Voice / ambient audio',v:()=>'not available'},
{n:'Vibration',v:()=>rumbleOK()?(rmb?'On':'Off'):'not supported',l:()=>{rmb^=1},r:()=>{rmb^=1},a:()=>{rmb^=1}},
{n:'Graphics quality',v:()=>['Low','Medium','High'][gq],l:()=>setQ((gq+2)%3),r:()=>setQ((gq+1)%3)},
{n:'Performance overlay',v:()=>perfHud?'On':'Off',d:()=> 'Live frame rate, frame interval and unit counts. Useful for scale testing.',l:()=>{perfHud^=1;perfFps=0},r:()=>{perfHud^=1;perfFps=0},a:()=>{perfHud^=1;perfFps=0}},
{n:'Remap buttons',a:()=>{rbk='pause';mode='remap';ri=0;rw=0}},{n:'Save game',a:()=>openSlots('save','pause')},{n:'Load game',a:()=>openSlots('load','pause')},
{n:'Restart match',a:()=>{if(cmp)startScenario(cmp.i);else start()}},{n:window.CK_NET&&window.CK_NET.snapshot().roomCode?'Leave Multiplayer':'Main menu',a:()=>{if(window.CK_NET&&window.CK_NET.snapshot().roomCode)window.CK_NET.leaveToSinglePlayer();else mode='title'}}]}
function drawPause(){X.fillStyle='rgba(1,4,8,.78)';X.fillRect(0,0,CW,CH);if(!pad){tx('PAUSED',CW/2,CH*.4,56,'#f4d58b','center');tx('Controller disconnected — reconnect it to continue',CW/2,CH*.5,26,'#fca5a5','center');return}
const PI=pmItems(),w=Math.min(760,CW-36),V=Math.min(12,PI.length,Math.max(5,((CH-210)/43)|0)),rh=Math.min(43,(CH-190)/V|0),off=Math.max(0,Math.min(pm-(V>>1),PI.length-V)),y0=(CH-V*rh-116)/2|0,x=(CW-w)/2;panel(x,y0,w,V*rh+112);tx('PAUSED',CW/2,y0+42,32,'#f4d58b','center');tx('GAME MENU',x+24,y0+42,13,'#9fb2bf');X.fillStyle='rgba(217,181,104,.22)';X.fillRect(x+22,y0+53,w-44,1);
for(let j=off;j<off+V;j++){const it=PI[j],i=j,yy=y0+61+(i-off)*rh;if(i===pm){const hg=X.createLinearGradient(x,yy,x+w,yy+rh);hg.addColorStop(0,'#66502f');hg.addColorStop(.5,'#354750');hg.addColorStop(1,'#27343b');X.fillStyle=hg;X.fillRect(x+12,yy,w-24,rh-3);X.strokeStyle='#f2d28a';X.strokeRect(x+12.5,yy+.5,w-25,rh-4);X.fillStyle='#f2d28a';X.fillRect(x+20,yy+7,3,rh-16)}tx(it.n,x+32,yy+rh*.64,Math.min(21,rh*.52|0),i===pm?'#fff0c2':'#edf2f5');if(it.v)tx('‹  '+it.v()+'  ›',x+w-24,yy+rh*.64,Math.min(19,rh*.46|0),'#f4d58b','right')}
if(off>0)tx('▲ MORE ABOVE',CW/2,y0+56,10,'#c8b17e','center');if(off+V<PI.length)tx('▼ MORE BELOW  ·  '+(pm+1)+' / '+PI.length,CW/2,y0+V*rh+80,12,'#c8b17e','center');tx('D-PAD  NAVIGATE / ADJUST     A  SELECT     B OR MENU  RESUME',CW/2,y0+V*rh+99,Math.min(14,CW/65),'#c5d3dc','center')}

/* Controller-remap presentation; commands remain in js/input.js. */
const RA=[[0,'Select / command'],[1,'Back / cancel'],[2,'Extra order / assign group'],[3,'Shortcut / switch page'],[8,'Objectives'],[10,'Centre camera']];
function drawRemap(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);tx('CONTROLLER REMAP',CW/2,90,48,'#f2c14e','center');
RA.forEach(([id,l],i)=>{const y=170+i*60;if(i===ri){X.fillStyle='#2f63c4';X.fillRect(CW/2-380,y-36,760,50)}tx(l,CW/2-360,y,26);tx(rw&&i===ri?'press a button...':'Button '+(BM[id]!==undefined?BM[id]:id),CW/2+360,y,26,'#fde68a','right')});
tx('D-pad Up/Down choose   A rebind   X reset all   B or Menu back   (0=A 1=B 2=X 3=Y 4=LB 5=RB 8=View 10=L3)',CW/2,CH-50,18,'#94a3b8','center')}
