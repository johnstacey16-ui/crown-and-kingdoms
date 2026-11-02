/* Xbox picture presets, frame-pacing governor and crisp HUD policy.
 * Loaded after engine-graphics-benchmark.js, before engine.js. */
// User-selectable, session-local Xbox Edge picture presets. Backing pixels
// change, but the HUD keeps native DPR for legible Xbox menus and controls.
// Neither the original graphics tier nor the save/command format is changed.
let selectedXboxPicturePreset=-1,adaptivePictureScale=.5;
const ADAPTIVE_WINDOW_MS=8000,ADAPTIVE_WARMUP_MS=1500;
let adaptiveWindowStart=null,adaptiveSamples=[],adaptiveFastWindows=0;
function resetAdaptivePictureSampling(){adaptiveWindowStart=null;adaptiveSamples=[];adaptiveFastWindows=0}
// Optional conservative frame-pacing governor. Only when expressly selected.
// Warm up for 1.5s after each window, and resize at most once every 8s.
function sampleAdaptivePicture(now,rafMs){
 if(selectedXboxPicturePreset!==3||mode!=='play'||!S||canvasBenchmark||perfFlatField||perfLayerMode||document.hidden){
  resetAdaptivePictureSampling();return;
 }
 if(!Number.isFinite(rafMs)||rafMs<1||rafMs>1000){resetAdaptivePictureSampling();return}
 if(adaptiveWindowStart===null){adaptiveWindowStart=now;return}
 const elapsed=now-adaptiveWindowStart;
 if(elapsed>=ADAPTIVE_WINDOW_MS){
  const median=canvasBenchmarkMedian(adaptiveSamples);
  if(median!==null&&adaptiveSamples.length>=16){
   const levels=[.5,.75],index=levels.indexOf(adaptivePictureScale);
   if(median>46&&index>0){adaptivePictureScale=levels[index-1];adaptiveFastWindows=0}
   else if(median<24&&index<levels.length-1){
    if(++adaptiveFastWindows>=2){adaptivePictureScale=levels[index+1];adaptiveFastWindows=0}
   }else adaptiveFastWindows=0;
   if(perfRenderScale!==adaptivePictureScale){perfRenderScale=adaptivePictureScale;perfFps=0;rs()}
  }
  adaptiveWindowStart=now;adaptiveSamples=[];return;
 }
 if(elapsed>=ADAPTIVE_WARMUP_MS&&adaptiveSamples.length<1000)adaptiveSamples.push(rafMs);
}

const CK_XBOX_PICTURE_PRESETS=[
 {name:'Original 100%',scale:1,sharp:0},
 {name:'Balanced 75%',scale:.75,sharp:1},
 {name:'Smooth 50%',scale:.5,sharp:1},
 {name:'Adaptive (experimental)',scale:.5,sharp:1,adaptive:true}
];
function currentXboxPicturePreset(){
 if(selectedXboxPicturePreset===3&&perfSharpHud&&[.5,.75].includes(perfRenderScale))return 3;
 return CK_XBOX_PICTURE_PRESETS.findIndex(p=>!p.adaptive&&p.scale===perfRenderScale&&p.sharp===perfSharpHud);
}
function setXboxPicturePreset(index){
 if(canvasBenchmark||mode!=='play'&&mode!=='pause')return false;
 const p=CK_XBOX_PICTURE_PRESETS[index];
 if(!p)return false;
 selectedXboxPicturePreset=index;
 adaptivePictureScale=p.scale;resetAdaptivePictureSampling();
 perfRenderScale=p.scale;perfSharpHud=p.sharp;
 perfFlatField=0;perfLayerMode=0;
 perfFps=0;rs();return true;
}
function cycleXboxPicturePreset(step){
 const current=currentXboxPicturePreset();
 return setXboxPicturePreset(current<0?(step<0?0:1):(current+step+CK_XBOX_PICTURE_PRESETS.length)%CK_XBOX_PICTURE_PRESETS.length);
}
