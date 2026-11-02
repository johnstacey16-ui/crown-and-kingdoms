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
function setupCanvasBenchmarkStage(b){
 const mode=b.kind==='layers'?CK_LAYER_BENCH_STAGES[b.phase]:null;
 perfRenderScale=mode?1:CK_CANVAS_BENCH_STAGES[b.phase];
 perfFlatField=mode?mode.flat:0;perfLayerMode=mode?mode.layer:0;
 perfFps=0;rs();
}
let canvasBenchmark=null,canvasBenchSummary=null;
function canvasBenchmarkMedian(values){
 if(!values.length)return null;
 const v=values.slice().sort((a,b)=>a-b),m=v.length>>1;
 return v.length%2?v[m]:(v[m-1]+v[m])/2;
}
function stopCanvasBenchmark(abort=false){
 const b=canvasBenchmark;if(!b)return false;
 canvasBenchmark=null;gs=b.oldSpeed;acc=0;perfRenderScale=1;perfFlatField=0;perfLayerMode=0;perfSharpHud=b.oldSharpHud||0;rs();perfFps=0;
 if(abort)canvasBenchSummary=null;
 return true;
}
function beginCanvasBenchmark(kind='pixels'){
 if(mode!=='pause'||!S||!perfTestMatch||window.CK_NET?.isRunning?.())return false;
 if(kind!=='layers')kind='pixels';
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
  const stage=b.kind==='layers'?CK_LAYER_BENCH_STAGES[b.phase]:null;
  b.results.push(stage?{label:stage.label,layer:stage.layer,flat:stage.flat,ms:median,n:b.intervals.length}
    :{scale:CK_CANVAS_BENCH_STAGES[b.phase],ms:median,n:b.intervals.length});
  b.phase++;
  if(b.phase===(b.kind==='layers'?CK_LAYER_BENCH_STAGES.length:CK_CANVAS_BENCH_STAGES.length)){
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
function loadSeriesSPerformanceSave(){
 if(mode!=='title'||window.CK_NET?.isRunning?.())return false;
 const previous={seedOv,mapLayout,mt,msz,kingdoms,startAge,startRes,startVillagers,
  startArmy,gameMode,vm,cmp,civ,aiCiv,diff,aip};
 try{
  cmp=null;seedOv=202697;mapLayout=0;mt=3;msz=1;kingdoms=2;
  startAge=3;startRes=5;startVillagers=2;startArmy=0;gameMode=0;
  vm=0;civ=0;aiCiv=1;diff=0;aip=0;
  start();
  // Two built-out settlements: around 28 buildings and 20-25 units per team.
  // The screenshot overlay displays totals across the entire map.
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
   for(let i=0;i<16;i++){
    const k=['mil','spear','arc','knight'][i%4],p=findPlace(1);
    if(!p)throw Error('No room for test soldier');
    const u=addU(t,k,p[0]+.5,p[1]+.5);
    usedSoldierTiles.add(p[1]*W+p[0]);
    // Soldiers are map-aware but do not need to receive commands to render.
    if(!u)throw Error('Could not create test soldier');
   }
   S.res[t]={f:5000,w:5000,g:5000,s:5000};
  }
  // Show the settlement and preserve normal fog-of-war authority.
  fog();mmUp();const home=S.bs.find(b=>b.t===0&&b.k==='tc');
  ctr(home.x+5,home.y+5);S.sel=[];
  perfHud=1;perfFps=0;perfFlatField=0;perfLayerMode=0;
  const saved=saveG(false,CK_SERIES_S_SAMPLE_KEY);
  if(saved){if(!loadG(false,CK_SERIES_S_SAMPLE_KEY))throw Error('Fixture failed save validation')}
  // Xbox browser storage can be blocked; an in-memory sample remains playable.
  perfTestMatch=1;mode='play';lastAutoSaveAt=0;
  note(saved?'Xbox FPS test save loaded - Menu: Render layer diagnosis':'Xbox FPS test ready (browser storage unavailable)');
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
