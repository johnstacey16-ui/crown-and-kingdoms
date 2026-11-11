
'use strict';
const cv=document.getElementById('c'),WORLD_X=cv.getContext('2d'),
  hudCanvas=document.getElementById('ck-hud'),HUD_X=hudCanvas?.getContext('2d')||null;
let X=WORLD_X,CW=0,CH=0,DPR=1,gq=1,ui=1,br=1,mm={x:0,y:0,w:216};
// Only reallocate Canvas2D backing stores when dimensions change. Reassigning
// the same size destroys GPU contents and can trigger black flashes on Xbox Edge.
const rs=()=>{
 const hudDpr=Math.min(window.devicePixelRatio||1,[1,1.25,1.5][gq]);
 DPR=hudDpr*Math.min(perfRenderScale,GRAPHICS_RECOVERY.scale);
 CW=innerWidth/ui|0;CH=innerHeight/ui|0;
 const w=Math.max(1,Math.round(CW*DPR)),h=Math.max(1,Math.round(CH*DPR));
 if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
 cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
 cv.style.filter=br===1?'none':'brightness('+br+')';
 if(hudCanvas&&HUD_X){
  // Repeated context losses disable the extra full-size HUD backing store;
  // gamepad coordinates, UI scale, simulation and saved preferences stay put.
  const sharp=!!perfSharpHud&&perfRenderScale<1&&GRAPHICS_RECOVERY.scale===1;
  hudCanvas.style.display=sharp?'block':'none';
  const hw=sharp?Math.max(1,Math.round(CW*hudDpr)):1;
  const hh=sharp?Math.max(1,Math.round(CH*hudDpr)):1;
  if(hudCanvas.width!==hw)hudCanvas.width=hw;
  if(hudCanvas.height!==hh)hudCanvas.height=hh;
  if(sharp){
   hudCanvas.style.width=innerWidth+'px';hudCanvas.style.height=innerHeight+'px';
   hudCanvas.style.filter=cv.style.filter;
  }
 }
 const m=Math.max(140,Math.min(300,CH*.45|0,CW*.3|0));
 mm={x:CW-m-14,y:CH-(m>>1)-14,w:m,h:m>>1};
};let resizeTimer=0;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(rs,80)});rs();
/* ===== GAME STATE / MAP ===== */
/* ===== GENERATED MAP CONNECTIVITY AUDIT =====
   Terrain semantics: wt=0 land, wt=1 navigable water, wt=2 shallow ford.
   Buildings/resources are intentionally excluded: this audits the generated terrain
   before placement, not temporary gameplay obstructions. */
/* ===== GENERATED MAP CONNECTIVITY AUDIT =====
   Terrain semantics: wt=0 land, wt=1 navigable water, wt=2 shallow ford.
   Buildings/resources are intentionally excluded: this audits generated terrain
   before placement, not temporary gameplay obstructions. */

/* World construction is owned by js/mapgen.js. */
const w2s=(x,y)=>[(x-y)*TW/2-cam.x,(x+y)*TH/2-cam.y];
const s2w=(sx,sy)=>{const u=(sx+cam.x)/(TW/2),v=(sy+cam.y)/(TH/2);return[(u+v)/2,(v-u)/2]};
function clampCam(){const[x,y]=s2w(CW/2,CH/2),cx=cl(x,1,W-1),cy=cl(y,1,H-1);cam.x=(cx-cy)*TW/2-CW/2;cam.y=(cx+cy)*TH/2-CH/2}
const ctr=(x,y)=>{cam.x=(x-y)*TW/2-CW/2;cam.y=(x+y)*TH/2-CH/2;clampCam()};
function start(){if(canvasBenchmark)stopCanvasBenchmark(true);canvasBenchSummary=null;selectedXboxPicturePreset=-1;resetAdaptivePictureSampling();
if(perfRenderScale!==1||perfSharpHud){perfRenderScale=1;perfSharpHud=0;rs()}
perfTestMatch=0;lastAutoSaveAt=-60000;resetSavePerformanceMetrics();newGame();if(!cmp&&gameMode===1){for(let t=0;t<S.teamN;t++){S.res[t]={f:2000,w:2000,g:2000,s:2000};S.age[t]=3;grp(t,'knight',6);grp(t,'arc',8);grp(t,'ram',2)}}else if(!cmp&&gameMode===2){for(let t=0;t<S.teamN;t++){S.res[t]={f:500,w:500,g:500,s:500};grp(t,'vil',5)}}if(!cmp&&startArmy>0){for(let t=0;t<S.teamN;t++){if(startArmy===1)grp(t,'scout',2);else if(startArmy===2){grp(t,'mil',3);grp(t,'arc',2)}else if(startArmy===3){grp(t,'mil',4);grp(t,'arc',4);grp(t,'ram',1)}}}if(vm===3)for(let t=0;t<S.teamN;t++){const tc=S.bs.find(b=>b.t===t&&b.k==='tc');if(!tc)continue;const p=spawnPos(tc);if(p)addU(t,'king',p[0],p[1])}mode='play';menu=place=null;fx=[];corp=[];rub=[];notes=[];idleI=0;queueWarm();PT.length=0;note('Left stick moves the cursor, A selects, hold RT for the command menu, D-pad quick-selects');note('You lead the '+CIV[S.civ[0]].n+(S.teamN>2?' against '+(S.teamN-1)+' rival kingdoms':' vs the '+CIV[S.civ[1]].n)+': '+CIV[S.civ[0]].d);if(vm===6)note('Sudden Death: protect your starting Town Centre; losing it eliminates your kingdom and extra Town Centres are disabled')}
const vis=e=>e.t===0||S.vs[(e.y|0)*W+(e.x|0)];
/* Civilization roster/unique technologies: js/civilizations.js. */
/* Xbox picture presets and adaptive frame sampling: js/engine-picture.js. */
function setQ(v){gq=v;rs();sset()}
function autoPause(){if(mode==='play'){if(typeof canvasBenchmark!=='undefined'&&canvasBenchmark)stopCanvasBenchmark(true);cancelGameplayGestures();if((typeof perfTestMatch==='undefined'||!perfTestMatch)&&!(window.CK_NET&&window.CK_NET.isRunning()))saveG(true);mode='pause';pm=0}}
/* ===== CONTROLLER INPUT ===== */
const GAR={tc:15,castle:20,tower:5},MT=[{n:'Arabia',l:1,f:1,m:1},{n:'Black Forest',l:.4,f:3,m:.8},{n:'Lakes',l:3,f:.7,m:1},{n:'Open Plains',l:.3,f:.25,m:1.5},{n:'Desert Oasis',l:.5,f:.3,m:1.2,pal:1},{n:'Frozen North',l:1.3,f:1.2,m:1,pal:2},{n:'Coastal',l:.3,f:.6,m:1.2,cs:1},{n:'Mediterranean',l:.2,f:.7,m:1.2,rv:0,sea:1},{n:'Gold Rush',l:.4,f:.5,m:2.6,gd:1,rv:0},{n:'Highland Pass',l:.3,f:.6,m:1.6,rg:1,rv:0,pal:3},{n:'Scattered Lakes',l:.2,f:.7,m:1.5,arch:1,rv:0},{n:'Twin Lakes',l:.6,f:.8,m:1.1,lake:1,rv:0}];
const MA={mil:0,spear:0,knight:2,gal:1,cata:2,ele:3,tk:5,saml:1,eled:2,bers:0,fish:1,trn:2,eagle:0,cavarch:0,turtle:2},PRA={mil:1,scout:2,knight:2,skirm:3,ram:50,gal:3,trn:2,camel:0,cata:3,ele:2,tk:2,saml:1,eled:2,fish:2,eagle:3,cavarch:0,turtle:7};
/* Blacksmith armour applies by unit class, including unique units; keep these sets explicit because the roster is data-driven. */
const INFARM=new Set(['mil','spear','tk','woad','bers','saml','huskarl','jaguar','kamayuk','shotel','axe','gbeto','eagle']);
const ARCHARM=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','jan','hcan','conq','wagon','eled','mgd','cavarch']);
const CAVARM=new Set(['scout','knight','camel','mamel','cata','ele','mgd','eled','conq','boyar','tarkan']);
Object.assign(MA,{boyar:3,tarkan:2,huskarl:1,kamayuk:1,huszar:1,wagon:1});Object.assign(PRA,{boyar:3,tarkan:2,huskarl:6,kamayuk:2,huszar:2,wagon:3,jaguar:1,gbeto:1});

/* ===== MAIN LOOP (fixed 30Hz step, clamped delta for tab suspension) ===== */
/* Runtime exceptions used to be painted as a thin red strip while the same failing simulation kept running every frame. Halt immediately and expose useful diagnostics instead of repeatedly executing a broken step. */
let CK_ERR=null;
// Centralize the same snapshot for frame, timer and uncaught browser errors.
// Do not erase the first failure with a secondary canvas/audio exception.
function recordGameFailure(e){
 if(mode==='error')return false;
 CK_ERR={message:String(e&&e.message||e),stack:String(e&&e.stack||''),
  time:typeof S!=='undefined'&&S?S.t:0,
  units:typeof S!=='undefined'&&S&&S.us?S.us.length:0,
  buildings:typeof S!=='undefined'&&S&&S.bs?S.bs.length:0,
  map:typeof W!=='undefined'?W+'x'+H:'unknown',mode};
 mode='error';acc=0;return true
}
function recordAsyncGameFailure(e){
 // Asset, lobby and platform errors outside a live game are not fatal.
 return (mode==='play'||mode==='pause')&&recordGameFailure(e)
}
function frame(now){requestAnimationFrame(frame);try{frame2(now)}catch(e){recordGameFailure(e);try{drawError()}catch(_){X.fillStyle='#400';X.fillRect(0,0,CW,CH);X.fillStyle='#fff';X.fillText('Runtime error — simulation stopped',20,40)}}}
let lastAutoSaveAt=-60000;
/* Frame delta spans the *previous* game callback and browser time before this
 * callback. The residual is unattributed (vsync, compositor/GPU, throttling,
 * unrelated tasks); it is NOT proof that the browser sat idle. */
/* Controller-friendly Xbox Edge experiment: median RAF intervals over a
 * fixed scene. Run only in the offline bundled test match, never in multiplayer.
 * Freeze simulation during measurements, not the visual renderer. Save and
 * restore prior game speed; comparison is invalidated if the tab is hidden. */
function frame2(now){
 const timing=!!perfHud,loopStart=timing?performance.now():0,rafMs=Math.max(0,now-last);
 if(timing){perfFrameIntervalMs=rafMs;perfGapMs=outsideGameLoopMs(rafMs,perfLoopMs)}
 else perfLoopMs=0;
 try{
  const dt=Math.min(.25,(now-last)/1000);last=now;
  if(canvasBenchmark)sampleCanvasBenchmark(now,rafMs);
  else{sampleAdaptivePicture(now,rafMs);sampleGraphicsRecovery(now,rafMs)}
  const padStart=timing?performance.now():0;
  readPad();
  if(timing)perfPadMs=performance.now()-padStart;
  if(mode==='error'){
   if(E[0]||E[1]){if(window.CK_NET&&window.CK_NET.snapshot().roomCode)window.CK_NET.leaveToTitle();else mode='title';menu=place=null;CK_ERR=null;acc=0}
   drawError();return;
  }
  if(GRAPHICS_RECOVERY.lost.size&&!window.CK_NET?.isRunning?.()){acc=0;return}
  const controlStart=timing?performance.now():0;
  ctl(dt);
  if(timing)perfControlMs=performance.now()-controlStart;
  const simStart=performance.now();perfStepCount=0;
  if(mode==='play'){
   acc+=dt*gs;
   while(acc>=DT&&mode==='play'){
    step(DT);perfStepCount++;if(window.CK_NET&&typeof window.CK_NET.onSimulationStep==='function')window.CK_NET.onSimulationStep();acc-=DT;
   }
   if(S&&!perfTestMatch&&!(window.CK_NET&&window.CK_NET.isRunning())&&now-lastAutoSaveAt>=60000){lastAutoSaveAt=now;saveG(true)}
  }
  perfStepMs=performance.now()-simStart;perfStepPeak=Math.max(perfStepPeak,perfStepMs);
  // During the opt-in pacing test keep RAF, controller reads and sampling active,
  // but issue absolutely no Canvas2D updates for frozen stages. This reveals
  // whether slow callbacks persist without any game canvas redraw/presentation.
  const frozenCanvas=canvasBenchmark?.kind==='pacing'&&CK_PACING_BENCH_STAGES[canvasBenchmark.phase]?.skip;
  const drawStart=performance.now();
  if(frozenCanvas||GRAPHICS_RECOVERY.lost.size)perfDrawMs=0;
  else{draw(dt);perfDrawMs=performance.now()-drawStart;perfDrawPeak=Math.max(perfDrawPeak,perfDrawMs)}
 }finally{if(timing)perfLoopMs=performance.now()-loopStart}
}
function sset(){try{localStorage.setItem('ck_set',JSON.stringify({ui,br,msz,diff,aiDifficultyVersion:2,vm,scoreLimit,mt,mapLayout,civ,zm,gq,aip,kingdoms,startRes,startArmy,startAge,startVillagers,gameMode,perfHud,vol:VOL,rmb,snd,mus}))}catch(e){}}
try{hs=[0,1,2].some(n=>!!localStorage.getItem(skey(n)))||!!localStorage.getItem('ck_autosave');BM=JSON.parse(localStorage.getItem('ck_map'))||{};const st=JSON.parse(localStorage.getItem('ck_set')||'null');if(st){ui=[.8,1,1.25,1.5].includes(st.ui)?st.ui:1;br=cl(+st.br||1,.6,1.5);msz=cl(st.msz|0,0,3);diff=cl(st.aiDifficultyVersion===2?(st.diff|0):[1,2,4][cl(st.diff|0,0,2)],0,5);vm=cl(st.vm|0,0,6);scoreLimit=SCORE_LIMITS.includes(st.scoreLimit)?st.scoreLimit:1200;mt=cl(st.mt|0,0,MT.length-1);mapLayout=cl(st.mapLayout|0,0,13);if(mapLayout)applyMapLayout();civ=cl(st.civ|0,0,CIV.length-1);zm=cl(+st.zm||1.4,.8,3);TW=64*zm;TH=32*zm;gq=cl(st.gq===undefined?1:st.gq|0,0,2);if(st.vol){const v01=x=>{x=+x;return x>=0&&x<=1?x:1};VOL={m:v01(st.vol.m),mu:v01(st.vol.mu),sf:v01(st.vol.sf),am:v01(st.vol.am)}}aip=cl(st.aip|0,0,6);kingdoms=[2,3,4].includes(st.kingdoms)?st.kingdoms:4;startRes=cl(st.startRes|0,0,5);startArmy=cl(st.startArmy|0,0,3);startAge=cl(st.startAge|0,0,3);startVillagers=st.startVillagers===undefined?1:cl(st.startVillagers|0,0,3);gameMode=cl(st.gameMode|0,0,2);perfHud=st.perfHud?1:0;rmb=st.rmb===0?0:1;snd=st.snd===0?0:1;mus=st.mus===0?0:1;}}catch(e){}
rs();
if(window.CK_STORAGE)window.CK_STORAGE.restoreMissing().then(()=>refreshSlots()).catch(()=>{});
try{if('serviceWorker' in navigator&&window.location&&window.location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{})}catch(e){}
try{const ael=document.getElementById('ck-assets');if(ael&&ael.textContent&&ael.textContent.trim()!=='{}')loadAssetPack(JSON.parse(ael.textContent));if(window.CK_ASSETS)loadAssetPack(window.CK_ASSETS)}catch(e){};fetch('./assets/atlas-manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Asset manifest unavailable');return r.json()}).then(pack=>{if(pack&&typeof pack==='object')loadAssetPack(pack)}).catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause()});addEventListener('blur',autoPause);
addEventListener('keydown',e=>{if(e.target?.closest?.('.ck-room-overlay'))return;if(e.key&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Tab','PageUp','PageDown'].includes(e.key))e.preventDefault()},{passive:false});
addEventListener('contextmenu',e=>{if(!e.target?.closest?.('.ck-room-overlay'))e.preventDefault()});addEventListener('wheel',e=>{if(!e.target?.closest?.('.ck-room-overlay'))e.preventDefault()},{passive:false});
// Exceptions in event/microtask and audio callbacks do not enter the RAF
// try/catch. Surface a single diagnostic rather than silently abandoning play.
addEventListener('error',e=>{recordAsyncGameFailure(e?.error||new Error(e?.message||'Uncaught browser error'))});
addEventListener('unhandledrejection',e=>{if(recordAsyncGameFailure(e?.reason||new Error('Unhandled promise rejection')))e.preventDefault?.()});
setInterval(()=>{try{aTick()}catch(e){if(!recordAsyncGameFailure(e))console.error('[Crown & Kingdoms] Audio tick error',e)}},120);
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(aInit()&&AC.state==='suspended')AC.resume().catch(()=>{})},{passive:true}));
requestAnimationFrame(frame);

installCanvasRecovery(cv);installCanvasRecovery(hudCanvas);
