function drawPerfOverlay(dt){
 if(!perfHud||mode!=='play'||!S)return;
 const frameMs=perfFrameIntervalMs>0?perfFrameIntervalMs:dt*1000,instant=frameMs>0?1000/frameMs:0;perfFps=perfFps?perfFps*.85+instant*.15:instant;
 const names=['Blue','Red','Purple','Gold'],w=S.teamN>2?520:480,x=12,y=62,h=(perfFlatField||perfLayerMode?226:208)+(canvasBenchmark?23:canvasBenchSummary?(canvasBenchSummary.kind==='layers'||canvasBenchSummary.kind==='pacing'||canvasBenchSummary.kind==='objects'||canvasBenchSummary.kind==='units')?68:46:0);
 X.fillStyle='rgba(5,8,14,.88)';X.fillRect(x,y,w,h);X.strokeStyle='rgba(201,162,74,.7)';X.lineWidth=1;X.strokeRect(x+.5,y+.5,w-1,h-1);
 tx('PERF  '+perfFps.toFixed(0)+' FPS  '+frameMs.toFixed(1)+' ms  |  '+S.us.length+' units  '+S.bs.length+' buildings',x+9,y+17,13,'#f8fafc');
 const teamCounts=new Array(S.teamN).fill(0);for(const u of S.us)if(Number.isInteger(u.t)&&u.t>=0&&u.t<S.teamN)teamCounts[u.t]++;
 let xx=x+9;for(let t=0;t<S.teamN;t++){const label=names[t]+' '+teamCounts[t];tx(label,xx,y+36,12,teamColor(t));xx+=label.length*7.2+17}
 tx('SIM '+perfStepMs.toFixed(2)+' ms / '+perfStepCount+' ticks (peak '+perfStepPeak.toFixed(2)+')  |  DRAW '+perfDrawMs.toFixed(2)+' ms (peak '+perfDrawPeak.toFixed(2)+')',x+9,y+54,11,'#cbd5e1');
 tx('CHUNK '+perfChunksMs.toFixed(1)+'  TILE '+perfTilesMs.toFixed(1)+'  FOG '+perfFogMs.toFixed(1)+'  WORLD '+perfObjectsMs.toFixed(1)+'  FX '+perfEffectsMs.toFixed(1)+'  UI '+perfUiMs.toFixed(1)+' ms',x+9,y+72,11,'#cbd5e1');
 tx('NODE '+perfNodeMs.toFixed(1)+' ('+perfNodeCount+')  BLD '+perfBuildingMs.toFixed(1)+' ('+perfBuildingCount+')  UNIT '+perfUnitMs.toFixed(1)+' ('+perfUnitCount+') ms',x+9,y+90,11,'#f8e6b5');
 tx('LOOP '+perfLoopMs.toFixed(1)+'  PAD '+perfPadMs.toFixed(1)+'  CTL '+perfControlMs.toFixed(1)+'  GAP '+perfGapMs.toFixed(1)+' ms',x+9,y+108,11,'#cbd5e1');
 const tab=document.visibilityState==='hidden'?'HIDDEN':document.visibilityState==='visible'?'VISIBLE':'UNKNOWN',focus=typeof document.hasFocus==='function'?(document.hasFocus()?'YES':'NO'):'?';
 tx('RAF '+perfFrameIntervalMs.toFixed(1)+' ms  |  TAB '+tab+'  FOCUS '+focus+'  LOSS '+GRAPHICS_RECOVERY.losses,x+9,y+126,11,'#cbd5e1');
 tx('CANVAS '+cv.width+'x'+cv.height+'  SCALE '+Math.round(Math.min(perfRenderScale,GRAPHICS_RECOVERY.scale)*100)+'%  DPR '+DPR.toFixed(2)+'  ZOOM '+zm.toFixed(2)+(GRAPHICS_RECOVERY.scale<1?'  SAFE '+Math.round(GRAPHICS_RECOVERY.scale*100)+'%':''),x+9,y+144,11,'#f8e6b5');
 tx('TINT  HIT '+TEAM_FRAME_CACHE.hits+'  NEW '+TEAM_FRAME_CACHE.creations+'  EVICT '+TEAM_FRAME_CACHE.evictions+'  CACHE '+(TEAM_FRAME_CACHE.pixels*4/1048576).toFixed(1)+' MiB  |  TROOP CROPS '+TROOP_TEXTURE_LRU.size,x+9,y+162,11,'#cbd5e1');
 const saveStat=perfSaveMetrics;
 tx('SAVE '+(saveStat.kind==='NONE'?'waiting for next checkpoint':saveStat.kind+' '+(saveStat.ok?'OK':'FAILED')+' '+saveStat.total.toFixed(1)+'ms  PEAK '+saveStat.peak.toFixed(1)+'ms  N '+saveStat.count+(saveStat.failures?'  ERR '+saveStat.failures:'')),x+9,y+180,11,'#f8e6b5');
 if(saveStat.kind!=='NONE')tx('JSON '+saveStat.serialize.toFixed(1)+'ms  WRITE '+saveStat.storage.toFixed(1)+'ms  SIZE '+Math.round(saveStat.bytes/1024)+'KiB',x+9,y+198,11,'#f8e6b5');
 if(!canvasBenchmark){
  if(perfFlatField)tx('TEST: FLAT FIELD - world graphics temporarily hidden',x+9,y+216,11,'#fbd38d');
  else if(perfLayerMode===1)tx('TEST: TERRAIN ONLY - units/buildings temporarily hidden',x+9,y+216,11,'#fbd38d');
  else if(perfLayerMode===2)tx('TEST: OBJECTS ONLY - terrain temporarily hidden',x+9,y+216,11,'#fbd38d');
 }
 if(canvasBenchmark){
  const b=canvasBenchmark,percent=b.start===null?0:Math.min(100,Math.max(0,(performance.now()-b.start)/CK_CANVAS_BENCH_STAGE_MS*100));
  const step=b.kind==='layers'?CK_LAYER_BENCH_STAGES[b.phase].label:b.kind==='pacing'?CK_PACING_BENCH_STAGES[b.phase].label:b.kind==='objects'?CK_OBJECT_BENCH_STAGES[b.phase].label:b.kind==='units'?CK_UNIT_BENCH_STAGES[b.phase].label:Math.round(CK_CANVAS_BENCH_STAGES[b.phase]*100)+'%';
  tx('AUTO BENCH '+(b.phase+1)+'/'+(b.kind==='layers'||b.kind==='pacing'||b.kind==='objects'||b.kind==='units'?5:4)+'  '+step+'  '+percent.toFixed(0)+'% complete | AI paused',x+9,y+216,11,'#fbd38d');
 }else if(canvasBenchSummary){
  const f=i=>{const r=canvasBenchSummary.results[i];return r&&r.ms?Math.round(1000/r.ms)+' FPS':'N/A'};
  if(canvasBenchSummary.kind==='layers'){
   tx('MEDIAN FPS: FULL '+f(0)+'  TERRAIN '+f(1)+'  OBJECTS '+f(2),x+9,y+216,11,'#fbd38d');
   tx('FLAT '+f(3)+'  FULL REPEAT '+f(4),x+9,y+234,11,'#fbd38d');
   tx('All original graphics restored | AI running',x+9,y+252,11,'#fbd38d');
  }else if(canvasBenchSummary.kind==='objects'){
   tx('MEDIAN FPS: ALL '+f(0)+'  UNITS '+f(1)+'  BUILDINGS '+f(2),x+9,y+216,11,'#fbd38d');
   tx('RESOURCES '+f(3)+'  ALL REPEAT '+f(4),x+9,y+234,11,'#fbd38d');
   tx('Original graphics restored | AI running',x+9,y+252,11,'#fbd38d');
  }else if(canvasBenchSummary.kind==='units'){
   tx('MEDIAN FPS: UNITS '+f(0)+'  SPRITES '+f(1)+'  GROUND '+f(2),x+9,y+216,11,'#fbd38d');
   tx('NONE '+f(3)+'  UNITS REPEAT '+f(4),x+9,y+234,11,'#fbd38d');
   tx('Original unit graphics restored | AI running',x+9,y+252,11,'#fbd38d');
  }else if(canvasBenchSummary.kind==='pacing'){
   tx('MEDIAN FPS: FULL '+f(0)+'  FROZEN FULL '+f(1)+'  FLAT '+f(2),x+9,y+216,11,'#fbd38d');
   tx('FROZEN FLAT '+f(3)+'  FULL REPEAT '+f(4),x+9,y+234,11,'#fbd38d');
   tx('All graphics restored | AI running',x+9,y+252,11,'#fbd38d');
  }else{
   tx('MEDIAN FPS: 100% '+f(0)+'  | 75% '+f(1)+'  | 50% '+f(2),x+9,y+216,11,'#fbd38d');
   tx('100% repeat '+f(3)+'  |  Full graphics restored',x+9,y+234,11,'#fbd38d');
  }
 }

}

const ovr=()=>{const w=Math.min(CW-80,(CH-190)*2)|0;return{x:(CW-w)/2,y:(CH-w/2)/2+12,w,h:w/2}};
function drawOv(){const o=ovr();X.fillStyle='rgba(0,0,0,.85)';X.fillRect(0,0,CW,CH);minimapDraw(o,2);tx('OVERVIEW'+(S.teamN>2?'    Blue: You  Red/Purple/Gold: rivals':'')+'    LS: cursor   Y: focus   B / RB / View: close',CW/2,o.y-16,S.teamN>2?17:22,'#f2c14e','center')}

/* Technology tree, objectives and controller help screens. Shared engine state is read when called. */
/* Display the real civilization-eligible lines, not raw generic building data.
 * The same trOf / rsOf gates protect solo and authenticated multiplayer. */
function treeLines(){
 const model=technologyTreeModel(0,S),c=CIV[model.civilizationId];
 if(!c)return [['Civilization unavailable','No technology data for this kingdom']];
 const rows=[['Civilization: '+c.n,c.d]];
 for(const entry of model.buildings){
  const tr=entry.units.map(u=>unitName(u.id,0));
  const research=entry.research.map(t=>t.name);
  rows.push([entry.name+(entry.age?' ('+AG[entry.age].n+')':' (Founding Age)'),
   (entry.reason?'Unlock: '+entry.reason+'. ':'')+
   (tr.length?'Units: '+tr.join(', ')+'. ':'')+
   (research.length?'Tech: '+research.join(', '):'')]);
 }
 return rows;
}
function treePageRows(height){
 return Math.max(4,Math.min(9,Math.floor((height-280)/44)));
}
function treeCostLabel(cost){
 return Object.entries(cost||{}).filter(([_,n])=>Number.isFinite(n)&&n>0)
  .map(([k,n])=>n+({f:'F',w:'W',g:'G',s:'S'}[k]||k)).join(' ')||'Free';
}
function treeFit(value,width,size){
 const str=String(value??''),cap=Math.max(1,Math.floor(width/(size*.58)));
 return str.length>cap?str.slice(0,Math.max(0,cap-1))+'…':str;
}
function drawTree(){
 X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);
 const margin=Math.min(40,Math.max(10,CW*.04)),left=margin+18;
 panel(margin,margin,CW-margin*2,CH-margin*2);
 tx('TECHNOLOGY TREE',CW/2,margin+52,Math.min(32,Math.max(22,CW/33)),'#f2c14e','center');
 const model=technologyTreeModel(0,S),TL=treeLines(),count=treePageRows(CH);
 const chosen=Math.min(Math.max(0,tsc),TL.length-1);
 const offset=Math.max(0,Math.min(chosen-Math.floor(count/2),TL.length-count));
 const listTop=margin+98,rowHeight=Math.min(44,(CH-300)/count);
 for(let i=0;i<count;i++){
  const index=offset+i,e=TL[index];if(!e)break;
  const y=listTop+i*rowHeight,selected=index===chosen;
  if(selected){X.fillStyle='#354651';X.fillRect(left-8,y-24,CW-2*left+16,rowHeight-2);
   X.strokeStyle='#f2c14e';X.lineWidth=2;X.strokeRect(left-7.5,y-23.5,CW-2*left+15,rowHeight-3)}
  const detailX=CW<850?left+Math.max(125,CW*.31):Math.max(left+205,CW*.34);
  tx(treeFit(e[0],detailX-left-12,16),left,y,16,selected?'#f5d27b':'#e6d4a9');
  tx(treeFit(e[1],CW-detailX-margin-28,14),detailX,y,14,selected?'#f1f5f9':'#cbd5e1');
 }
 const selected=model.buildings[chosen-1],boxY=CH-margin-151;
 panel(left-8,boxY,CW-left-margin-10,107);
 if(selected){
  const available=selected.units.slice(0,3).map(u=>u.name+(u.reason?' ('+u.reason+')':'')+' '+treeCostLabel(u.cost));
  const researched=selected.research.slice(0,3).map(t=>t.name+' ('+(t.reason||t.state)+') '+treeCostLabel(t.cost));
  tx(treeFit(selected.name+' · '+AG[selected.age].n,CW-2*left,17),left,boxY+28,17,'#f5d27b');
  tx(treeFit('Units: '+(available.join('  |  ')||'None'),CW-2*left,14),left,boxY+56,14,'#f1f5f9');
  tx(treeFit('Research: '+(researched.join('  |  ')||'None'),CW-2*left,14),left,boxY+81,14,'#cbd5e1');
 }else tx(treeFit(model.civilization||'No civilization',CW-2*left,18),left,boxY+49,18,'#f5d27b');
 tx('D-pad: select building    A/B: back    '+(chosen+1)+'/'+TL.length,
  CW/2,CH-margin-17,Math.min(16,Math.max(11,CW/33)),'#9ae6b4','center');
}
function drawObj(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);panel(CW/2-440,70,880,CH-140);tx('OBJECTIVES',CW/2,140,40,'#f2c14e','center');const vmx=[S.teamN>2?'Destroy every rival Town Centre.':'Destroy the enemy Town Centre.','Build a Wonder and hold it for 5 minutes. Any rival kingdom can win the same way.','Hold every relic in your Monasteries for 4 minutes. Any rival kingdom can win the same way.',S.teamN>2?'Keep your King alive and defeat every rival King.':'Keep your King alive and kill the enemy King.','Have the highest kingdom score when the '+Math.round(scoreLimit/60)+'-minute time limit expires.','Control the central hill with military units for 5 minutes; hostile units contest control.','Protect your starting Town Centre and destroy every hostile Town Centre. You cannot build additional Town Centres.'][vm],p=S.pl;
tx('Primary: '+(cmp?'Complete the required mission objectives below; defend your Town Centre.':vmx),CW/2-400,220,21);tx('You: '+CIV[S.civ[0]].n+'     '+(S.teamN>2?((S.teamN-1)+' rival kingdoms'):('Enemy: '+CIV[S.civ[1]].n))+'     Difficulty: '+difficultyName(diff),CW/2-400,270,20,'#cbd5e1');tx('Time '+(S.t/60|0)+' min     Units trained '+p.tr+'     Enemies defeated '+p.kills+'     Resources gathered '+(p.gath|0),CW/2-400,312,20,'#cbd5e1');tx('Age: '+AG[S.age[0]].n+'     Population '+popOf(0)+'/'+capOf(0)+(S.teamN>2?'     Kingdoms alive: '+(Array.from({length:S.teamN},(_,t)=>kingdomAlive(t)).filter(Boolean).length):''),CW/2-400,354,20,'#cbd5e1');if(cmp)cmpObj();tx('A / B / View / RB / Menu: back',CW/2,CH-110,20,'#9ae6b4','center')}
function drawInfo2(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);const c=inf==='c',L=c?[['Left stick','Pan camera to aim the centre reticle; steer wheels and expanded minimap cursor'],['Right stick','Up/down: zoom during gameplay (solo and multiplayer)'],['Minimap cursor speed','Controls expanded minimap pointer only; Camera speed changes normal panning'],['A','Select / command. Hold A and drag for a selection box; double-tap for all of a type on screen'],['Small minimap','A inside the diamond focuses the camera; outside it A selects or commands normally'],['A (production buildings selected)','Set their gather (rally) point'],['LT (hold)','Add to selection, place several buildings, train five at a time'],['RT (hold)','Command menu (radial). With nothing selected: site-based commands'],['Y','Build/train; military: Line/Split. Hold Y + D-pad Left: change shortcut.'],['LB (hold)','Control groups: left stick picks, X assigns, release selects, Y focuses'],['RB','Open minimap; left stick moves its cursor, Y focuses, B/RB/View closes'],['D-pad','Up: idle villager; Right: support; Down: Town Centre; Left: military'],['X / B','X assigns control groups in the LB wheel; B cancels or deselects'],['L3 / R3','L3 focuses camera; R3: villager priorities, Y: manual weights'],['View / Menu','View opens objectives; Menu pauses. B/RB/View exits objectives']]:[['Game','Crown & Kingdoms is an original controller-first medieval RTS built from modular browser scripts.'],['Goal','Win by the victory mode you chose; the enemy follows the same rules and fog.'],['Controls','Target: Age of Empires II: DE Xbox default controls. Full parity is still in progress.'],['Graphics','Painted medieval raster sprites, textured terrain and team-colour heraldry.'],['Audio','Synthesised Web Audio with spatial effects, ambience and adaptive music; browser audio may require controller input first.'],['Online','Multiplayer reliability and host-authoritative match state are active development goals.'],['Focus','Finish all 19 campaigns, improve AI and technology, fix naval/maps, improve graphics, measure Xbox performance and verify multiplayer.']];
tx(c?'CONTROLS':'ABOUT',CW/2,70,44,'#f2c14e','center');const sp2=Math.min(52,(CH-170)/L.length);L.forEach((e,i)=>{tx(e[0],60,130+i*sp2,20,'#fde68a');tx(e[1].slice(0,Math.floor((CW-330)/9.5)),330,130+i*sp2,19)});tx('A or B: back',CW/2,CH-40,20,'#9ae6b4','center')}

/* Pause-menu model and drawing. Controller navigation remains in js/input.js. */
const GSP=[.5,1,1.5,2,3];
function pmItems(){return[{n:'Resume',a:()=>{mode='play'}},{n:'Objectives',a:()=>{omr='pause';mode='obj'}},{n:'Technology Tree',a:()=>{tsc=0;mode='tree'}},...diplomacyMenuItems(),...tributeMenuItems(),...villagerPriorityMenuItems(),
{n:'Game speed',v:()=>gs+'x',l:()=>{gs=GSP[Math.max(0,GSP.indexOf(gs)-1)]},r:()=>{gs=GSP[Math.min(4,GSP.indexOf(gs)+1)]}},
{n:'Minimap cursor speed',v:()=>cspd+'x',l:()=>{cspd=Math.max(.5,cspd-.25)},r:()=>{cspd=Math.min(2,cspd+.25)}},
{n:'Brightness',v:()=>br.toFixed(1),l:()=>{br=Math.max(.6,+(br-.1).toFixed(1));rs()},r:()=>{br=Math.min(1.5,+(br+.1).toFixed(1));rs()}},
{n:'UI scale',v:()=>ui+'x',l:()=>{const L=[.8,1,1.25,1.5];ui=L[Math.max(0,L.indexOf(ui)-1)];rs()},r:()=>{const L=[.8,1,1.25,1.5];ui=L[Math.min(3,L.indexOf(ui)+1)];rs()}},
{n:'Zoom',v:()=>zm.toFixed(1)+'x',l:()=>setZoom(Math.max(.8,+(zm-.2).toFixed(1))),r:()=>setZoom(Math.min(3,+(zm+.2).toFixed(1)))},
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
{n:'Reduced cosmetic effects',v:()=>reducedCosmeticEffects?'On':'Off',
 d:()=> 'Hides ambient dust and smoke particles without changing combat projectiles, simulation, camera or scores. Saved locally for this browser.',
 l:()=>toggleReducedCosmeticEffects(),r:()=>toggleReducedCosmeticEffects(),a:()=>toggleReducedCosmeticEffects()},
{n:'Xbox picture preset',v:()=>selectedXboxPicturePreset===3?'Adaptive '+Math.round(adaptivePictureScale*100)+'%':CK_XBOX_PICTURE_PRESETS[currentXboxPicturePreset()]?.name||'Custom',
 d:()=> 'Original 100%, Balanced 75%, Smooth 50%, or optional Adaptive. Adaptive uses only 50%–75% battlefield detail with a sharp Xbox HUD, adjusting after sustained frame-rate measurements. 40% was removed because it looked too blurry on Xbox Series S. Not saved; no change to controls or gameplay.',
 l:()=>cycleXboxPicturePreset(-1),r:()=>cycleXboxPicturePreset(1),a:()=>cycleXboxPicturePreset(1)},
...(perfTestMatch?[
 {n:'Run Xbox FPS comparison',d:()=> 'One-click comparison of full graphics at 100%, 75%, 50%, then 100% again. Holds the test scene still for ~28 seconds, locks gameplay controls and restores the original resolution. Menu/B cancels. No saves affected.',a:()=>beginCanvasBenchmark()},
 {n:'Run Xbox graphics comparison',d:()=> 'One-click full scene, terrain only, objects only, flat field, and full-scene repeat. Holds the same scene and camera for ~35 seconds, locks gameplay controls and restores all graphics. Menu/B cancels. No saves affected.',a:()=>beginCanvasBenchmark('layers')},
 {n:'Run Xbox object breakdown',d:()=> 'Compare all objects, troops, buildings and resource nodes at 100% original pixel scale, then repeat all. About 35 seconds with frozen AI, scene and camera. Returns all graphics. No saves affected; Menu/B cancels.',a:()=>beginCanvasBenchmark('objects')},
 {n:'Run Xbox unit sprite breakdown',d:()=> 'Test-save-only comparison: full units, sprite frames without ground markings, ground markings without sprite frames, no unit painting, then full again. Same frozen scene at full resolution for about 35 seconds. No saves changed; Menu/B cancels.',a:()=>beginCanvasBenchmark('units')},
 {n:'Run Xbox frame pacing comparison',d:()=> 'Full graphics, frozen full frame, flat field, frozen flat frame, and full repeat over ~35 seconds. Frozen stages deliberately hold the picture without canvas redraw, while Xbox/RAF sampling continues. Restores graphics and game speed afterwards. Menu/B cancels. Test save only.',a:()=>beginCanvasBenchmark('pacing')}
]:[]),
...(perfTestMatch?[{n:'Sharp HUD test',v:()=>perfSharpHud?'On':'Off',d:()=> 'Optional comparison: retain original high-resolution text, buttons and controller HUD while drawing the battlefield at reduced pixel density. For ordinary games use Xbox picture preset. May be slower than a single canvas. Never saved.',a:()=>{selectedXboxPicturePreset=-1;perfSharpHud^=1;perfHud=1;rs()},l:()=>{selectedXboxPicturePreset=-1;perfSharpHud^=1;perfHud=1;rs()},r:()=>{selectedXboxPicturePreset=-1;perfSharpHud^=1;perfHud=1;rs()}}]:[]),
{n:'Canvas pixel test',v:()=>Math.round(perfRenderScale*100)+'%',d:()=> 'Xbox Edge GPU presentation test. Temporarily draw the full original scene at 100, 75 or 50 percent canvas pixels. Text and art may look softer at low settings; use 100 percent to restore. Not saved.',l:()=>{const a=[.5,.75,1],i=a.indexOf(perfRenderScale);selectedXboxPicturePreset=-1;perfRenderScale=a[Math.max(0,i-1)];perfHud=1;perfFps=0;rs()},r:()=>{const a=[.5,.75,1],i=a.indexOf(perfRenderScale);selectedXboxPicturePreset=-1;perfRenderScale=a[Math.min(2,i+1)];perfHud=1;perfFps=0;rs()},a:()=>{const a=[1,.75,.5],i=a.indexOf(perfRenderScale);selectedXboxPicturePreset=-1;perfRenderScale=a[(i+1)%3];perfHud=1;perfFps=0;rs()}},
{n:'Performance overlay',v:()=>perfHud?'On':'Off',d:()=> 'Live frame rate, frame interval and unit counts. Useful for scale testing.',l:()=>{perfHud^=1;perfFps=0},r:()=>{perfHud^=1;perfFps=0},a:()=>{perfHud^=1;perfFps=0}},
{n:'Render isolation test',v:()=>perfFlatField?'Flat field':'Normal',d:()=> 'Xbox Edge diagnostic: temporarily hide the battlefield but keep simulation and the performance HUD active. Toggle again to restore graphics. Not saved.',l:()=>{perfFlatField^=1;perfHud=1;perfFps=0;perfLayerMode=0},r:()=>{perfFlatField^=1;perfHud=1;perfFps=0;perfLayerMode=0},a:()=>{perfFlatField^=1;perfHud=1;perfFps=0;perfLayerMode=0}},
{n:'Render layer diagnosis',v:()=>['Normal','Terrain only','Objects only'][perfLayerMode],d:()=> 'Series S diagnosis: compare just the terrain with just the units/buildings; keep gameplay and HUD running. Normal restores the full scene. Not saved.',l:()=>{perfLayerMode=(perfLayerMode+2)%3;perfFlatField=0;perfHud=1;perfFps=0},r:()=>{perfLayerMode=(perfLayerMode+1)%3;perfFlatField=0;perfHud=1;perfFps=0},a:()=>{perfLayerMode=(perfLayerMode+1)%3;perfFlatField=0;perfHud=1;perfFps=0}},
{n:'Remap buttons',a:()=>{rbk='pause';mode='remap';ri=0;rw=0}},{n:'Save game',a:()=>openSlots('save','pause')},{n:'Load game',a:()=>openSlots('load','pause')},
{n:'Restart match',a:()=>{if(cmp)startScenario(cmp.i);else start()}},{n:window.CK_NET&&window.CK_NET.snapshot().roomCode?'Leave Multiplayer':'Main menu',a:()=>{if(window.CK_NET&&window.CK_NET.snapshot().roomCode)window.CK_NET.leaveToSinglePlayer();else mode='title'}}]}
function drawPause(){X.fillStyle='rgba(1,4,8,.78)';X.fillRect(0,0,CW,CH);if(!pad){tx('PAUSED',CW/2,CH*.4,56,'#f4d58b','center');tx('Controller disconnected — reconnect it to continue',CW/2,CH*.5,26,'#fca5a5','center');return}
const PI=pmItems(),w=Math.min(760,CW-36),V=Math.min(12,PI.length,Math.max(5,((CH-210)/43)|0)),rh=Math.min(43,(CH-190)/V|0),off=Math.max(0,Math.min(pm-(V>>1),PI.length-V)),y0=(CH-V*rh-128)/2|0,x=(CW-w)/2;panel(x,y0,w,V*rh+128);tx('PAUSED',CW/2,y0+42,32,'#f4d58b','center');tx('GAME MENU',x+24,y0+42,13,'#9fb2bf');X.fillStyle='rgba(217,181,104,.22)';X.fillRect(x+22,y0+53,w-44,1);
for(let j=off;j<off+V;j++){const it=PI[j],i=j,yy=y0+61+(i-off)*rh;if(i===pm){const hg=X.createLinearGradient(x,yy,x+w,yy+rh);hg.addColorStop(0,'#66502f');hg.addColorStop(.5,'#354750');hg.addColorStop(1,'#27343b');X.fillStyle=hg;X.fillRect(x+12,yy,w-24,rh-3);X.strokeStyle='#f2d28a';X.strokeRect(x+12.5,yy+.5,w-25,rh-4);X.fillStyle='#f2d28a';X.fillRect(x+20,yy+7,3,rh-16)}tx(it.n,x+32,yy+rh*.64,Math.min(21,rh*.52|0),i===pm?'#fff0c2':'#edf2f5');if(it.v)tx('‹  '+it.v()+'  ›',x+w-24,yy+rh*.64,Math.min(19,rh*.46|0),'#f4d58b','right')}
if(off>0)tx('▲ MORE ABOVE',CW/2,y0+56,10,'#c8b17e','center');if(PI[pm]?.n==='Zoom')tx('Gameplay zoom: Right stick Up/Down · Menu adjustment: D-pad Left/Right',CW/2,y0+V*rh+80,12,'#c8b17e','center');else if(off+V<PI.length)tx('▼ MORE BELOW  ·  '+(pm+1)+' / '+PI.length,CW/2,y0+V*rh+80,12,'#c8b17e','center');tx('D-PAD  NAVIGATE / ADJUST     A  SELECT     B OR MENU  RESUME',CW/2,y0+V*rh+99,Math.min(14,CW/65),'#c5d3dc','center')}

/* Controller-remap presentation; commands remain in js/input.js. */
const RA=[[0,'Select / command'],[1,'Back / cancel'],[2,'Extra order / assign group'],[3,'Shortcut / switch page'],[8,'Objectives'],[10,'Centre camera']];
function drawRemap(){X.fillStyle='#10131c';X.fillRect(0,0,CW,CH);tx('CONTROLLER REMAP',CW/2,90,48,'#f2c14e','center');
RA.forEach(([id,l],i)=>{const y=170+i*60;if(i===ri){X.fillStyle='#2f63c4';X.fillRect(CW/2-380,y-36,760,50)}tx(l,CW/2-360,y,26);tx(rw&&i===ri?'press a button...':'Button '+(BM[id]!==undefined?BM[id]:id),CW/2+360,y,26,'#fde68a','right')});
tx('D-pad Up/Down choose   A rebind   X reset all   B or Menu back   (0=A 1=B 2=X 3=Y 4=LB 5=RB 8=View 10=L3)',CW/2,CH-50,18,'#94a3b8','center')}

/* In-match HUD: resource bar, population/idle counts, selection and orders. */
function ico(k,x,y){X.save();X.translate(x,y);if(k==='f'){X.fillStyle='#d9473f';X.beginPath();X.arc(0,2,9,0,7);X.fill();X.fillStyle='rgba(255,255,255,.3)';X.beginPath();X.arc(-3,-1,3,0,7);X.fill();X.fillStyle='#3a7a2a';X.fillRect(-1,-9,3,5)}else if(k==='w'){X.fillStyle='#7a4f24';X.fillRect(-10,-6,20,12);X.fillStyle='#c79a5c';X.beginPath();X.ellipse(10,0,4,6,0,0,7);X.fill()}else if(k==='g'){X.fillStyle='#f2c14e';X.beginPath();X.arc(0,0,9,0,7);X.fill();X.strokeStyle='#a87b12';X.lineWidth=2;X.stroke();X.fillStyle='rgba(255,255,255,.4)';X.fillRect(-2,-5,3,9)}else if(k==='s'){X.fillStyle='#9aa3a8';poly([[-10,6],[-6,-6],[4,-8],[10,4],[6,8]]);X.fill();X.fillStyle='#dfe6ea';poly([[-6,-6],[4,-8],[0,0]]);X.fill()}else{X.fillStyle='#3b82f6';X.beginPath();X.arc(0,-4,5,0,7);X.fill();X.fillRect(-7,2,14,8)}X.restore()}

/* Figma-inspired top HUD geometry. Keep everything on one row at Xbox sizes;
 * use two rows on narrow browser views rather than overlapping live numbers.
 * This pure layout never changes simulation, controller inputs or saved state. */
const CK_HUD_THEME=Object.freeze({
 surface:'#202b34',text:'#f1f5f9',secondary:'#cbd5e1',gold:'#f5d27b',
 success:'#9ae6b4',accent:'#f2c14e',idle:'#ffd24a',inactive:'#667788'
});
function hudTopLayout(width){
 const w=Number.isFinite(width)?Math.max(320,width):1280,compact=w<1000;
 const edge=w<700?8:16,inner=w-2*edge;
 const resourceWidth=compact?inner*.76:Math.min(610,inner*.47);
 const popWidth=compact?inner-resourceWidth:Math.min(130,Math.max(100,inner*.09));
 const idleWidth=compact?Math.max(76,inner*.18):Math.min(114,Math.max(92,inner*.08));
 const ageWidth=compact?Math.max(96,inner*.28):Math.min(208,Math.max(150,inner*.15));
 const popX=edge+resourceWidth;
 const idleX=compact?edge+ageWidth:popX+popWidth;
 const ageX=compact?edge:idleX+idleWidth;
 const statusX=compact?idleX+idleWidth:ageX+ageWidth;
 return {
  width:w,compact,edge,height:compact?100:60,
  resourceX:edge,resourceWidth,slotWidth:resourceWidth/4,
  popX,popWidth,idleX,idleWidth,ageX,ageWidth,statusX,
  statusWidth:w-edge-statusX,firstY:compact?29:30,
  workerY:compact?45:47,summaryY:compact?84:34,
  summaryTop:compact?58:8
 };
}
function hudTopFit(value,width,font){
 const s=String(value??''),limit=Math.max(1,Math.floor(Math.max(0,width)/(font*.67)));
 return s.length<=limit?s:s.slice(0,Math.max(0,limit-1))+'…';
}
function hudTopStatus(difficulty,speed,clock,width,font){
 const d=String(difficulty??''),pace=speed===1?'':String(speed)+'x';
 const options=[d+(pace?'  '+pace:'')+'  '+clock,
  d.slice(0,6)+(pace?' '+pace:'')+' '+clock,
  (pace?pace+'  ':'')+clock,clock];
 const max=Math.max(1,Math.floor(width/(font*.67)));
 return options.find(s=>s.length<=max)||clock;
}
function topbar(r){
 const l=hudTopLayout(CW);
 panel(0,-4,CW,l.height+4);
 const gc={f:0,w:0,g:0,s:0};
 let idl=0;
 for(const u of S.us){
  if(!u||u.t!==0||u.hp<=0||u.ld)continue;
  if(u.o==='g'&&u.ct&&gc[u.ct]!==undefined)gc[u.ct]++;
  else if(u.o==='i'&&(u.k==='vil'||u.k==='fish'))idl++;
 }
 const resources=[['f',r?.f],['w',r?.w],['g',r?.g],['s',r?.s]];
 for(let i=0;i<resources.length;i++){
  const [kind,value]=resources[i],x=l.resourceX+i*l.slotWidth;
  X.fillStyle=CK_HUD_THEME.surface;
  X.fillRect(x+2,9,Math.max(0,l.slotWidth-5),43);
  ico(kind,x+15,25);
  const amount=String(Number.isFinite(value)?value|0:0);
  const size=Math.max(11,Math.min(l.compact?17:20,(l.slotWidth-38)/(Math.max(1,amount.length)*.61)));
  tx(amount,x+32,l.firstY,size,CK_HUD_THEME.text);
  tx('('+gc[kind]+')',x+32,l.workerY,l.compact?11:13,CK_HUD_THEME.secondary);
 }
 X.fillStyle=CK_HUD_THEME.surface;
 X.fillRect(l.popX+2,9,Math.max(0,l.popWidth-5),43);
 const popLabel=popOf(0)+'/'+capOf(0);
 const tinyPop=l.popWidth<104;
 if(!tinyPop)ico('p',l.popX+15,25);
 tx(hudTopFit(popLabel,l.popWidth-(tinyPop?14:37),tinyPop?14:18),
  l.popX+(tinyPop?9:32),l.firstY,tinyPop?14:18,CK_HUD_THEME.text);
 tx('POPULATION',l.popX+9,l.workerY,l.popWidth<85?10:11,CK_HUD_THEME.secondary);
 const statusTop=l.summaryTop;
 function statusChip(x,w){
  X.fillStyle=CK_HUD_THEME.surface;
  X.fillRect(x+2,statusTop,Math.max(0,w-5),l.compact?34:43);
 }
 statusChip(l.idleX,l.idleWidth);
 const idleLabel='Idle '+idl;
 // The actual worker count must survive two- and three-digit army scenes.
 // Size the label to its chip; never truncate the count to an ellipsis.
 const idleSize=Math.max(9,Math.min(l.compact?12:16,
  (l.idleWidth-27)/(Math.max(1,idleLabel.length)*.62)));
 X.fillStyle=idl?CK_HUD_THEME.idle:CK_HUD_THEME.inactive;
 X.beginPath();X.arc(l.idleX+13,l.summaryY-6,6,0,Math.PI*2);X.fill();
 tx(idleLabel,l.idleX+25,l.summaryY,idleSize,
  idl?CK_HUD_THEME.idle:CK_HUD_THEME.secondary);
 statusChip(l.ageX,l.ageWidth);
 const ageIndex=Array.isArray(S.age)?S.age[0]:0;
 const ageName=(typeof AG!=='undefined'&&AG[ageIndex]?.n)||'Age unavailable';
 const ageSize=l.compact?Math.max(10,Math.min(14,(l.ageWidth-18)/(Math.max(1,ageName.length)*.73))):Math.min(19,Math.max(15,l.ageWidth/10));
 tx(hudTopFit(ageName,l.ageWidth-18,ageSize),
  l.ageX+10,l.summaryY,ageSize,CK_HUD_THEME.gold);
 statusChip(l.statusX,l.statusWidth);
 const clock=(S.t/60|0)+':'+String(S.t%60|0).padStart(2,'0');
 const matchFont=l.compact?14:Math.min(18,Math.max(14,l.statusWidth/14));
 const matchText=hudTopStatus(difficultyName(diff),gs,clock,l.statusWidth-18,matchFont);
 tx(matchText,CW-l.edge-9,l.summaryY,matchFont,CK_HUD_THEME.secondary,'right');
}
function researchNameForHud(rs){return rs?.k==='age'?'next age':(TE[rs?.k]?.n||'unknown technology')}
/* Narrow-view HUD docking: keep selected-unit text above the quick-select
 * row, not behind its buttons or the minimap. Wide Xbox presentation retains
 * the existing layout and exact informational strings. */
function hudLowerLayout(width,height){
 const short=height<580,h=short?60:100;
 return {x:8,y:Math.max(106,height-h-224),w:Math.max(240,width-16),h,short};
}
function hudLowerLines(message,width,font,maxLines){
 const limit=Math.max(8,Math.floor(Math.max(0,width)/(Math.max(1,font)*.6)));
 const words=String(message??'').trim().split(/\s+/).filter(Boolean),result=[];
 let current='';
 for(const word of words){
  let remaining=word;
  while(remaining.length>limit){
   if(current){result.push(current);current=''}
   result.push(remaining.slice(0,limit));remaining=remaining.slice(limit);
  }
  if(!remaining)continue;
  const candidate=current?current+' '+remaining:remaining;
  if(candidate.length>limit){if(current)result.push(current);current=remaining}
  else current=candidate;
 }
 if(current)result.push(current);
 if(result.length>maxLines){
  const clipped=result.slice(0,maxLines);
  clipped[maxLines-1]=clipped[maxLines-1].slice(0,limit-1)+'…';
  return clipped;
 }
 return result;
}
function hud(){const r=S.res[0];topbar(r);if(cmp)cmpHud();{const a=vm===5?(S.kh||[]):(S.vc||[]),lead=a.reduce((best,v,i)=>v>(a[best]||0)?i:best,0),progress=a[lead]||0;if(vm===4)tx('SCORE MODE · '+Math.ceil(Math.max(0,scoreLimit-S.t)/60)+' MIN LEFT · YOUR SCORE '+((S.scoreCache||[])[0]||0),CW/2,CH-134,22,'#f2d28a','center');else if(vm===5)tx(progress>0?(lead===0?'YOUR KINGDOM':'KINGDOM '+(lead+1))+' CONTROLS THE HILL · '+Math.ceil(Math.max(0,300-progress))+'s TO WIN':'KING OF THE HILL · HOLD THE CENTRAL HILL FOR 5 MIN',CW/2,CH-134,20,progress>0?(lead===0?'#9ae6b4':'#ff9a9a'):'#f2d28a','center');else if(vm===6)tx('SUDDEN DEATH · DEFEND YOUR TOWN CENTRE',CW/2,CH-134,20,'#ff9a9a','center');else if(vm&&progress>0)tx((lead===0?'Your ':'Kingdom '+(lead+1)+' ')+(vm===1?'Wonder':'Relic')+' victory in '+Math.ceil((vm===1?300:240)-progress)+'s',CW/2,CH-134,24,lead===0?'#9ae6b4':'#ff9a9a','center')}/* Age, speed and match clock are now drawn in the responsive topbar. */
const lower=CW<1000?hudLowerLayout(CW,CH):null;
if(lower)panel(lower.x,lower.y,lower.w,lower.h);
else panel(0,CH-120,mm.x-8,120);
quickBar();
const s=Array.isArray(S.sel)?S.sel.filter(a=>a&&a.hp>0):[],queueWait=s.length===1&&Array.isArray(s[0].q)&&s[0].q.every(q=>q&&typeof q.k==='string'&&Number.isFinite(q.t))&&B[s[0].k]?.n?productionQueueWait(s[0]):null;let l='Nothing selected - left stick pans camera; A selects at centre';
if(s.length){
 const a=s[0],building=a.q!=null,queue=Array.isArray(a.q)?a.q:[],def=building&&typeof B[a.k]?.n==='string'?B[a.k]:null;
 if(building){
  l=`${def?.n||'Building'}  HP ${a.hp|0}/${a.mh||0}`;
  if(a.done&&queue.length){
   const names=queue.map(q=>q&&U[q.k]?(unitName(q.k,a.t)?.[0]||'?'):'?').join('');
   const remaining=queueWait?.label||(Number.isFinite(queue[0]?.t)?queue[0].t.toFixed(0)+'s':'time unknown');
   l+=`  Training ${names} (${remaining})`;
  }else if(!a.done)l+=def?.bt>0&&Number.isFinite(a.pr)?`  Building ${(a.pr/def.bt*100)|0}%`:'  Building (details unavailable)';
  else if(!Array.isArray(a.q))l+='  Queue unavailable';
 }else if(U[a.k]&&S.tech?.[a.t])l=`${unitName(a.k,a.t)}${s.length>1?' +'+(s.length-1)+' more':''}  HP ${a.hp|0}/${mhp(a)}  ${stt(a)}  ${TASK[a.o]||'Idle'}${a.cg&&a.cg.length?' - cargo '+a.cg.length+'/5':''}${a.car>0?' - carrying '+(a.car|0)+' '+(typeof a.ct==='string'?a.ct.toUpperCase():'resource'):''}`;
 else l='Unit stats unavailable — B Deselect';
}
const production=s.filter(b=>b&&b.t===0&&b.hp>0&&b.done&&Array.isArray(b.q)&&B[b.k]?.tr?.length);
if(Array.isArray(s[0]?.q)&&production.length>1)l=production.length+' production buildings selected · '+production.reduce((n,b)=>n+b.q.length,0)+' units queued';
const status=l+(s[0]?.rs?'  Researching '+researchNameForHud(s[0].rs)+' '+(s[0].rs.t|0)+'s':'');
if(lower){
 const size=lower.short?15:16,lines=hudLowerLines(status,lower.w-24,size,lower.short?1:2);
 lines.forEach((line,i)=>tx(line,lower.x+12,lower.y+(lower.short?23:27)+i*17,size,CK_HUD_THEME.text));
}else{
 // The four D-pad controls are painted inside the wide lower panel.
 // Wrap unit information to the actual available left-hand space.
 const available=Math.max(220,(typeof quickBarLayout==='function'?
  quickBarLayout(CW,CH,mm.x).x:mm.x-262)-36);
 hudLowerLines(status,available,19,2).forEach((line,i)=>
  tx(line,20,CH-92+i*21,19,CK_HUD_THEME.text));
}
const h=place?'A Place   LT+A Place more   B Cancel   (green = valid)':menu?'RT radial: left stick choose   A Confirm   Y Switch page   X Cancel last queued   B Close':queueWait?queueWait.hint+'  RT Command menu  LB Groups  RB Minimap  B Deselect':'A Select / command (hold: box)  RT Command menu  Y Shortcut  LB Groups  RB Minimap  D-pad Quick select  LT Modifier  B Deselect  Menu Pause';
if(lower){
 const hintLines=place?['A Place  LT+A Repeat','B Cancel']:
  menu?['RT Menu  A Confirm','B Close  X Cancel Queue']:
  queueWait?[queueWait.hint,'B Deselect']:
  ['A Select  RT Menu  LB Groups','RB Map  B Back  Menu Pause'];
 const hintSize=lower.w<430?12:13;
 if(lower.short){
  // Very short landscapes have only room for one concise caption.
  tx(hudTopFit(hintLines.join('  '),lower.w-32,hintSize),lower.x+12,
   lower.y+lower.h-20,hintSize,CK_HUD_THEME.secondary);
 }else hintLines.forEach((line,i)=>tx(line,lower.x+12,lower.y+61+i*17,
  hintSize,CK_HUD_THEME.secondary));
}else{
 const available=Math.max(220,(typeof quickBarLayout==='function'?
  quickBarLayout(CW,CH,mm.x).x:mm.x-262)-36);
 hudLowerLines(h,available,16,2).forEach((line,i)=>
  tx(line,20,CH-43+i*21,16,CK_HUD_THEME.secondary));
}

minimapDraw(mm,0);
let y=80;for(const n of notes){X.globalAlpha=Math.min(1,n.t);tx(n.s,CW/2,y,24,'#fff','center');y+=32}X.globalAlpha=1;
if(menu&&!menu.rad){
 const {items,N,i}=listMenuPage(menu),V=Math.min(Math.max(N,1),Math.max(5,((CH-200)/44)|0),11),
  off=Math.max(0,Math.min(i-(V>>1),N-V)),w=520,x=CW/2-w/2,
  rh=Math.min(56,(CH-200)/V|0),y0=Math.max(4,(CH-(V*rh+110))/2|0),fs=Math.min(24,rh*.5|0);
 panel(x,y0,w,V*rh+110);
 if(!N)tx('No commands available — A or B to close',x+20,y0+V*rh+92,18,'#cbd5e1');
 else tx(DS[items[i].l]||'',x+20,y0+V*rh+92,18,'#cbd5e1');
 tx((typeof menu.title==='string'?menu.title:'Commands')+(N>V?'  ('+(i+1)+'/'+N+')':''),x+20,y0+40,28,'#f2c14e');
 for(let j=off;j<off+Math.min(V,N);j++){
  const it=items[j],yy=y0+60+(j-off)*rh;
  if(j===i){X.fillStyle='#2f63c4';X.fillRect(x+10,yy,w-20,rh-6)}
  tx(it.l,x+24,yy+rh*.65,fs,it.lk?'#888':'#fff');
  tx(it.lk||cs(it.c),x+w-24,yy+rh*.65,fs-4,it.lk?'#f99':'#cbd5e1','right')
 }
}
}

/* Full-screen menu and campaign views: js/ui-screens.js. */

/* Controller command overlays: js/ui-commands.js. */

/* Shared canvas text primitive used by menus, HUD and engine overlays. */
function tx(s,x,y,sz=20,c='#fff',al='left'){X.font=`bold ${sz}px system-ui,sans-serif`;X.fillStyle=c;X.textAlign=al;X.fillText(s,x,y)}

/* Draw only the selected first march, only while adding waypoints.
 * Original A* waypoints stay on the unit and in saves; this read-only preview
 * samples at most 34 points and never reveals a fogged-out tile. B and the
 * original Xbox command mapping remain owned by the input module. */
function drawQueuedMarchPreview(){
 if(pat!==5||!S||!Array.isArray(S.sel)||!Array.isArray(S.us))return;
 const unit=S.sel.find(u=>u&&u.t===0&&u.hp>0&&!u.ld&&u.o==='m'&&
  Array.isArray(u.p)&&u.p.length>0&&S.us.includes(u));
 if(!unit)return;
 const route=unit.p,step=Math.max(1,Math.ceil(route.length/32)),samples=[[unit.x,unit.y]];
 for(let i=0;i<route.length;i+=step)samples.push(route[i]);
 if((route.length-1)%step)samples.push(route[route.length-1]);
 const screenPoint=p=>{
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return null;
  const [x,y]=p;
  if(x<0||y<0||x>=W||y>=H||S.ex&&!S.ex[(y|0)*W+(x|0)])return null;
  const screen=w2s(x,y);
  return Array.isArray(screen)&&screen.length===2&&screen.every(Number.isFinite)?screen:null;
 };
 X.save();
 try{
  X.lineWidth=2;X.strokeStyle='rgba(255,210,74,.85)';X.setLineDash([7,5]);X.beginPath();
  let pen=false,segments=0;
  for(const sample of samples){
   const point=screenPoint(sample);
   if(!point){pen=false;continue}
   if(!pen)X.moveTo(point[0],point[1]);else{X.lineTo(point[0],point[1]);segments++}
   pen=true;
  }
  if(segments)X.stroke();
  X.setLineDash([]);
  const end=screenPoint(route[route.length-1]);
  if(end){
   X.beginPath();X.arc(end[0],end[1],9,0,Math.PI*2);X.stroke();
   tx('MARCH END',end[0]+13,end[1]-10,13,'#ffdb74');
  }
 }finally{X.restore()}
}

// Controller-first in-match presentation. Simulation and controller state remain owned by engine.js/input.js.
function drawGameOverlays(dt){if(mode==='play'){const[wx,wy]=s2w(cur.x,cur.y);hud();if(pat===5)drawQueuedMarchPreview();if(ov)drawOv();if(boxR){X.strokeStyle='#8cff3c';X.lineWidth=2;X.setLineDash([7,5]);X.strokeRect(Math.min(boxR.x0,boxR.x1),Math.min(boxR.y0,boxR.y1),Math.abs(boxR.x1-boxR.x0),Math.abs(boxR.y1-boxR.y0));X.setLineDash([]);X.fillStyle='rgba(140,255,60,.12)';X.fillRect(Math.min(boxR.x0,boxR.x1),Math.min(boxR.y0,boxR.y1),Math.abs(boxR.x1-boxR.x0),Math.abs(boxR.y1-boxR.y0))}if(menu&&menu.rad)drawRadial();if(cgo)drawCg();if(vpWheel)drawVillagerPriorityWheel();const h=pick(wx,wy);
X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.arc(cur.x,cur.y,12,0,7);X.moveTo(cur.x-20,cur.y);X.lineTo(cur.x+20,cur.y);X.moveTo(cur.x,cur.y-20);X.lineTo(cur.x,cur.y+20);X.stroke();X.lineWidth=1;if(pat)tx(pat===2?'ATTACK MOVE: A set point, B cancel':pat===3?'FOLLOW: select a friendly target, B cancel':pat===4?'GUARD: select a friendly target, B cancel':pat===5?'WAYPOINT: A add next point, B finish':'PATROL: A set point, B cancel',cur.x+22,cur.y+30,20,'#ffd24a');
if(h&&!(menu&&menu.rad)&&!cgo&&!vpWheel)tx(h.rl?'Relic':h.q?(B[h.k]?.n||'Building')+(h.t?' (enemy)':'')+' '+(h.hp|0)+'/'+h.mh:h.k in NM&&!U[h.k]?(h.fi?'Fish':h.an?'Deer':h.fm?'Farm':NM[h.k])+' '+(h.amt|0):(h.t?'Enemy ':'')+unitName(h.k,h.t)+' '+(h.hp|0)+'/'+mhp(h),cur.x+22,cur.y-14,20,h.t?'#f99':'#fff')}
else hud();
if(mode==='pause')drawPause();if(perfHud)drawPerfOverlay(dt);
if(mode==='end'){const p=S.pl;shade(S.over==='win'?(cmp?'MISSION COMPLETE':'VICTORY'):S.over==='draw'?'DRAW':'DEFEAT',[...(S.why?[S.why]:[]),`Time ${(S.t/60|0)}:${String(S.t%60|0).padStart(2,'0')}   Units trained ${p.tr}   Enemies defeated ${p.kills}`,`Buildings built ${p.bl}   Resources gathered ${p.gath|0}`],cmp?(S.over==='win'?(nextCampaignMission(cmp.i)!==null?'A Next mission    B Mission list':'A Mission list    B Main menu'):'A Retry mission    B Mission list'):(window.CK_NET&&window.CK_NET.snapshot().roomCode?'A or B: leave multiplayer and return to title':'A Play again    B Main menu'),S.over==='win'?'#9ae6b4':S.over==='draw'?'#f2d28a':'#f99')}if(window.CK_NET&&(mode==='play'||mode==='pause'))window.CK_NET.drawMatchStatus()}

// Full-screen views are presentation-owned; return true when a view handled this frame.
function drawFrontEndScreen(){if(mode==='title'){drawTitle();return true}if(mode==='multiplayer'){if(window.CK_NET)window.CK_NET.drawLobby();else drawTitle();return true}if(mode==='remap'){drawRemap();return true}if(mode==='info'){drawInfo2();return true}if(mode==='setup'){drawSetup();return true}if(mode==='opts'){drawOpts();return true}if(mode==='slots'){drawSlots();return true}if(mode==='camp'){drawCamp();return true}if(mode==='brief'){drawBrief();return true}if(mode==='obj'){drawObj();return true}if(mode==='tree'){drawTree();return true}return false}
