/* Optional Xbox Edge graphics benchmark. No save, simulation, or controller bindings are changed by this module. */
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
