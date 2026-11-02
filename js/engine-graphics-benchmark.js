/* Xbox Edge graphics benchmark and opt-in reproducible performance test save.
 * Preserve the sample's separate key and never overwrite the owner's saves. */
const CK_CANVAS_BENCH_STAGES=[1,.75,.5,1],CK_CANVAS_BENCH_WARM_MS=1000,CK_CANVAS_BENCH_STAGE_MS=7000;
const CK_LAYER_BENCH_STAGES=[
 {label:'Normal',layer:0,flat:0},
 {label:'Terrain only',layer:1,flat:0},
 {label:'Objects only',layer:2,flat:0},
 {label:'Flat field',layer:0,flat:1},
 {label:'Normal repeat',layer:0,flat:0}
];
// Session-only object isolation: 0 all, 1 units, 2 buildings, 3 resources.
const CK_OBJECT_BENCH_STAGES=[
 {label:'Objects full',pass:0},
 {label:'Units only',pass:1},
 {label:'Buildings only',pass:2},
 {label:'Resources only',pass:3},
 {label:'Objects repeat',pass:0}
];
let perfObjectPass=0;
// Session-only unit painting isolation (0 normal, 1 sprites, 2 ground, 3 none).
const CK_UNIT_BENCH_STAGES=[
 {label:'Units full',pass:0},
 {label:'Sprites only',pass:1},
 {label:'Ground only',pass:2},
 {label:'No unit paint',pass:3},
 {label:'Units repeat',pass:0}
];
let perfUnitPass=0;
// The diagnostic preserves the last canvas frame during frozen stages: no
// Canvas2D commands, HUD draws or canvas resizes. RAF/input sampling continue.
// Compare full/flat redraw against the same scene without any canvas writes.
const CK_PACING_BENCH_STAGES=[
 {label:'Full',flat:0,skip:false},
 {label:'Frozen full',flat:0,skip:true},
 {label:'Flat field',flat:1,skip:false},
 {label:'Frozen flat',flat:1,skip:true},
 {label:'Full repeat',flat:0,skip:false}
];
function setupCanvasBenchmarkStage(b){
 const mode=b.kind==='layers'?CK_LAYER_BENCH_STAGES[b.phase]:null;
 const pacing=b.kind==='pacing'?CK_PACING_BENCH_STAGES[b.phase]:null;
 const objects=b.kind==='objects'?CK_OBJECT_BENCH_STAGES[b.phase]:null;
 const units=b.kind==='units'?CK_UNIT_BENCH_STAGES[b.phase]:null;
 perfRenderScale=mode||pacing||objects||units?1:CK_CANVAS_BENCH_STAGES[b.phase];
 perfFlatField=mode?mode.flat:pacing?pacing.flat:0;perfLayerMode=mode?mode.layer:objects||units?2:0;
 perfObjectPass=objects?objects.pass:units?1:0;
 perfUnitPass=units?units.pass:0;
 perfFps=0;
 // A resize clears the canvas. Keep the existing image for frozen phases.
 if(!pacing||b.phase===0)rs();
}
let canvasBenchmark=null,canvasBenchSummary=null;
function canvasBenchmarkMedian(values){
 if(!values.length)return null;
 const v=values.slice().sort((a,b)=>a-b),m=v.length>>1;
 return v.length%2?v[m]:(v[m-1]+v[m])/2;
}
function stopCanvasBenchmark(abort=false){
 const b=canvasBenchmark;if(!b)return false;
 canvasBenchmark=null;gs=b.oldSpeed;acc=0;perfRenderScale=1;perfFlatField=0;perfLayerMode=0;perfObjectPass=0;perfUnitPass=0;perfSharpHud=b.oldSharpHud||0;rs();perfFps=0;
 if(abort)canvasBenchSummary=null;
 return true;
}
function beginCanvasBenchmark(kind='pixels'){
 if(mode!=='pause'||!S||!perfTestMatch||window.CK_NET?.isRunning?.())return false;
 if(kind!=='layers'&&kind!=='pacing'&&kind!=='objects'&&kind!=='units')kind='pixels';
 stopCanvasBenchmark(true);
 canvasBenchSummary=null;selectedXboxPicturePreset=-1;resetAdaptivePictureSampling();canvasBenchmark={phase:0,start:null,intervals:[],results:[],oldSpeed:gs,oldSharpHud:perfSharpHud,kind};
 gs=0;acc=0;perfHud=1;perfSharpHud=0;setupCanvasBenchmarkStage(canvasBenchmark);
 mode='play';return true;
}
function sampleCanvasBenchmark(now,rafMs){
 const b=canvasBenchmark;if(!b)return;
 if(mode!=='play'||!perfTestMatch||window.CK_NET?.isRunning?.()||document.hidden){stopCanvasBenchmark(true);return}
 if(b.start===null){b.start=now;return}
 const elapsed=Math.max(0,now-b.start);
 if(elapsed>=CK_CANVAS_BENCH_STAGE_MS){
  const median=canvasBenchmarkMedian(b.intervals);
  const stage=b.kind==='layers'?CK_LAYER_BENCH_STAGES[b.phase]:
    b.kind==='pacing'?CK_PACING_BENCH_STAGES[b.phase]:
    b.kind==='objects'?CK_OBJECT_BENCH_STAGES[b.phase]:b.kind==='units'?CK_UNIT_BENCH_STAGES[b.phase]:null;
  b.results.push(stage?{label:stage.label,flat:stage.flat,...(b.kind==='layers'?{layer:stage.layer}:b.kind==='objects'?{objectPass:stage.pass}:b.kind==='units'?{unitPass:stage.pass}:{skip:stage.skip}),ms:median,n:b.intervals.length}
    :{scale:CK_CANVAS_BENCH_STAGES[b.phase],ms:median,n:b.intervals.length});
  b.phase++;
  if(b.phase===(b.kind==='layers'?CK_LAYER_BENCH_STAGES.length:
    b.kind==='pacing'?CK_PACING_BENCH_STAGES.length:
    b.kind==='objects'?CK_OBJECT_BENCH_STAGES.length:b.kind==='units'?CK_UNIT_BENCH_STAGES.length:CK_CANVAS_BENCH_STAGES.length)){
   canvasBenchSummary={kind:b.kind,results:b.results.slice()};
   stopCanvasBenchmark(false);
  }else{
   b.start=now;b.intervals=[];setupCanvasBenchmarkStage(b);
  }
  return;
 }
 // Ignore initial canvas reset and GPU texture warmup at each resolution.
 if(elapsed>=CK_CANVAS_BENCH_WARM_MS&&Number.isFinite(rafMs)&&rafMs>=1&&rafMs<=3000)
  b.intervals.push(rafMs);
}

/* Built-in, reproducible Series S render performance SAVE.
 * Uses the production save serializer and loader, under a key reserved for the
 * sample. Never uses a manual slot or ck_autosave and never starts online play.
 * All generated entities are legal free land placements and have stable IDs. */
const CK_SERIES_S_SAMPLE_KEY='ck_series_s_fps_fixture_v1';
const CK_SERIES_S_UNIT_LOADS=[50,100,200];
let selectedXboxPerformanceLoad=50,xboxPerformanceUnitLoad=0;
function cycleXboxPerformanceLoad(direction){
 const i=CK_SERIES_S_UNIT_LOADS.indexOf(selectedXboxPerformanceLoad);
 selectedXboxPerformanceLoad=CK_SERIES_S_UNIT_LOADS[(i+(direction<0?-1:1)+CK_SERIES_S_UNIT_LOADS.length)%CK_SERIES_S_UNIT_LOADS.length];
 return selectedXboxPerformanceLoad;
}
function loadSeriesSPerformanceSave(unitLoad=selectedXboxPerformanceLoad){
 if(mode!=='title'||window.CK_NET?.isRunning?.()||!CK_SERIES_S_UNIT_LOADS.includes(unitLoad))return false;
 const previous={seedOv,mapLayout,mt,msz,kingdoms,startAge,startRes,startVillagers,
  startArmy,gameMode,vm,cmp,civ,aiCiv,diff,aip};
 try{
  cmp=null;seedOv=202697;mapLayout=0;mt=3;msz=1;kingdoms=2;
  startAge=3;startRes=5;startVillagers=2;startArmy=0;gameMode=0;
  vm=0;civ=0;aiCiv=1;diff=0;aip=0;
  start();
  // Two built-out settlements. Use EXACTLY half the requested units per team
  // to compare 50, 100 and 200 across the same deterministic map and art.
  // The screenshot HUD displays total units across the entire map.
  const roster=['house','house','bar','rng','stable','smith',
   'market','tower','house','house','mill','lumber','mine','house','house',
   'bar','rng','stable','house','outpost','house','tower','house',
   'house','castle','house','house'];
  for(let t=0;t<S.teamN;t++){
   const tc=S.bs.find(b=>b.t===t&&b.k==='tc');
   if(!tc)throw Error('Performance fixture needs both Town Centres');
   const cx=tc.x+1,cy=tc.y+1,usedSoldierTiles=new Set();
   function openFootprint(x,y,size){
    if(x<2||y<2||x+size>=W-2||y+size>=H-2)return false;
    for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++)
     if(S.g[yy*W+xx]||S.wt[yy*W+xx])return false;
    return true;
   }
   function findPlace(size){
    for(let radius=4;radius<31;radius++){
     for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
      const x=cx+dx,y=cy+dy;
      if(openFootprint(x,y,size)&&!(size===1&&usedSoldierTiles.has(y*W+x)))return[x,y];
     }
    }
    return null;
   }
   for(const k of roster){
    const d=B[k],p=d&&findPlace(d.s);
    if(!p)throw Error('No room for test '+k);
    addB(t,k,p[0],p[1],true);
   }
   const existing=S.us.filter(u=>u.t===t&&u.hp>0).length;
   const soldierCount=unitLoad/2-existing;
   if(soldierCount<0)throw Error('Starting units exceed requested Xbox sample load');
   for(let i=0;i<soldierCount;i++){
    const k=['mil','spear','arc','knight'][i%4],p=findPlace(1);
    if(!p)throw Error('No room for test soldier');
    const u=addU(t,k,p[0]+.5,p[1]+.5);
    usedSoldierTiles.add(p[1]*W+p[0]);
    // Soldiers are map-aware but do not need to receive commands to render.
    if(!u)throw Error('Could not create test soldier');
   }
   S.res[t]={f:5000,w:5000,g:5000,s:5000};
  }
  if(S.us.length!==unitLoad)throw Error('Xbox sample count differs from requested unit load');
  // Show the settlement and preserve normal fog-of-war authority.
  fog();mmUp();const home=S.bs.find(b=>b.t===0&&b.k==='tc');
  ctr(home.x+5,home.y+5);S.sel=[];
  perfHud=1;perfFps=0;perfFlatField=0;perfLayerMode=0;
  const saved=saveG(false,CK_SERIES_S_SAMPLE_KEY);
  if(saved){if(!loadG(false,CK_SERIES_S_SAMPLE_KEY))throw Error('Fixture failed save validation')}
  // Xbox browser storage can be blocked; an in-memory sample remains playable.
  perfTestMatch=1;xboxPerformanceUnitLoad=unitLoad;mode='play';lastAutoSaveAt=0;
  note(saved?'Xbox FPS '+unitLoad+'-unit save loaded - Menu: Render layer diagnosis':'Xbox FPS '+unitLoad+'-unit test ready (storage unavailable)');
  return true;
 }catch(error){
  console.warn('[Crown & Kingdoms] Built-in performance test failed',error);
  perfTestMatch=0;mode='title';note('Could not load Xbox FPS test');return false;
 }finally{
  ({seedOv,mapLayout,mt,msz,kingdoms,startAge,startRes,startVillagers,
    startArmy,gameMode,civ,aiCiv,aip}=previous);
  // Runtime victory/difficulty values come from the loaded sample save;
  // the user's stored setup preferences in ck_set remain untouched.
 }
}

/* One-click four-kingdom stress save just BEFORE an actual clash.
 * Four built towns, 372 genuine production units and 238 legal buildings.
 * The scene is paused so the controller owner decides when combat begins.
 * This uses a separate test slot, never the owner's manual or autosaves.
 */
const CK_SERIES_S_BATTLE_KEY='ck_series_s_prebattle_fixture_v1';
function loadSeriesSLargeBattleSave(){
 if(mode!=='title'||window.CK_NET?.isRunning?.())return false;
 const previous={seedOv,mapLayout,mt,msz,kingdoms,startAge,startRes,startVillagers,
  startArmy,gameMode,vm,cmp,civ,aiCiv,diff,aip};
 try{
  cmp=null;seedOv=202692;mapLayout=0;mt=3;msz=2;kingdoms=4;
  startAge=3;startRes=5;startVillagers=2;startArmy=0;gameMode=0;
  vm=0;civ=0;aiCiv=1;diff=1;aip=0;start();
  if(S.teamN!==4)throw Error('Large battle requires four kingdoms');
  const targets=[60,60,59,59];
  // Build around each established Town Centre, preserving unobstructed
  // terrain and never placing a building over any previous footprint.
  const roster=['house','house','bar','rng','stable','smith','market',
   'tower','mill','lumber','mine','outpost','house','house','castle',
   'house','house','bar','rng','stable','house','house','tower','house'];
  for(let t=0;t<4;t++){
   const home=S.bs.find(b=>b.t===t&&b.k==='tc'),seedX=home?.x+1,seedY=home?.y+1;
   if(!home)throw Error('Missing large battle Town Centre');
   let placed=0;
   function available(x,y,size){
    if(x<2||y<2||x+size>=W-2||y+size>=H-2)return false;
    // No structures in the central troop staging arena.
    if(Math.hypot(x+size/2-W/2,y+size/2-H/2)<W*.21)return false;
    for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++)
     if(S.g[yy*W+xx]||S.wt[yy*W+xx])return false;
    return true;
   }
   function footprint(size){
    for(let radius=5;radius<=48;radius++)for(let dy=-radius;dy<=radius;dy++)
     for(const dx of[-radius,radius]){
      const x=seedX+dx,y=seedY+dy;
      if(available(x,y,size))return [x,y];
     }
    for(let radius=5;radius<=48;radius++)for(let dx=-radius;dx<=radius;dx++)
     for(const dy of[-radius,radius]){
      const x=seedX+dx,y=seedY+dy;
      if(available(x,y,size))return [x,y];
     }
    return null;
   }
   while(S.bs.filter(b=>b.t===t).length<targets[t]){
    const k=roster[placed++%roster.length],p=footprint(B[k].s);
    if(!p)throw Error('No legal large battle building footprint: '+k+' team '+t);
    addB(t,k,p[0],p[1],true);
   }
   S.res[t]={f:10000,w:10000,g:10000,s:10000};
  }
  // Four real armies at the centre; no fake sprites, collision-overlaps,
  // miniature proxies, or stripped-down terrain. Unit locations are shared
  // across the four factions and all land cells are genuine traversable tiles.
  const staging=[[-12,9],[12,-9],[-12,-9],[12,9]];
  const occupied=new Set();
  const kinds=['mil','spear','arc','xbow','knight','scout','skirm','camel','ram','mang'];
  const targetTeams=[2,3,0,1];
  for(let t=0;t<4;t++){
   const [dx,dy]=staging[t],ox=(W/2|0)+dx,oy=(H/2|0)+dy;
   function stagingTile(){
    for(let radius=0;radius<=22;radius++)for(let yy=-radius;yy<=radius;yy++)
     for(let xx=-radius;xx<=radius;xx++){
      if(Math.max(Math.abs(xx),Math.abs(yy))!==radius)continue;
      const x=ox+xx,y=oy+yy,index=y*W+x;
      if(x<2||y<2||x>=W-2||y>=H-2||occupied.has(index)||S.g[index]||S.wt[index])continue;
      occupied.add(index);return [x+.5,y+.5];
     }
    return null;
   }
   const initial=S.us.filter(u=>u.t===t&&u.hp>0).length;
   for(let i=0;i<93-initial;i++){
    const p=stagingTile(),kind=kinds[i%kinds.length];
    if(!p)throw Error('No clear large battle staging tile: '+t);
    addU(t,kind,p[0],p[1]);
   }
  }
  if(S.bs.length!==238||S.us.length!==372)throw Error('Wrong large battle scene size');
  // Genuine hostile attack orders survive normal save/reload. After the
  // owner resumes, each army advances to meet its counterpart.
  for(let t=0;t<4;t++){
   const enemies=S.us.filter(u=>u.t===targetTeams[t]&&u.k!=='vil'&&u.hp>0);
   const army=S.us.filter(u=>u.t===t&&u.k!=='vil'&&u.hp>0);
   if(!enemies.length||!army.length)throw Error('Missing large battle opponents');
   for(let i=0;i<army.length;i++){
    const unit=army[i];unit.o='a';unit.tg=enemies[i%enemies.length];
    unit.p=[];unit.rp=0;
   }
  }
  fog();mmUp();ctr(W/2,H/2);S.sel=[];
  perfHud=1;perfFps=0;perfFlatField=0;perfLayerMode=0;
  const saved=saveG(false,CK_SERIES_S_BATTLE_KEY);
  if(saved&&!loadG(false,CK_SERIES_S_BATTLE_KEY))throw Error('Battle test save failed validation');
  // Never resume the combat until the owner presses A/B on Resume.
  perfTestMatch=1;mode='pause';pm=0;lastAutoSaveAt=0;
  note(saved?'Large Battle Test saved: 372 units, 238 buildings - resume when ready':
   'Large Battle Test ready in memory: 372 units, 238 buildings');
  return true;
 }catch(error){
  console.warn('[Crown & Kingdoms] Large battle test failed',error);
  perfTestMatch=0;mode='title';note('Could not prepare Large Battle Test');return false;
 }finally{
  ({seedOv,mapLayout,mt,msz,kingdoms,startAge,startRes,startVillagers,
   startArmy,gameMode,civ,aiCiv,aip}=previous);
 }
}
