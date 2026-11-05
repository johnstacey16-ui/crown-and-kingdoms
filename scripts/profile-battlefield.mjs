/* Manual matched browser profiling. Never interpret synthetic CPU throttling
 * or headless SwiftShader FPS as physical Xbox results. No hosted schedule. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFile,mkdir} from 'node:fs/promises';
import {createApplication} from '../server/app.mjs';
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8)||'profile';
if(!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Use a simple lowercase profile label');
const output='artifacts/browser-profile/'+label;await mkdir(output,{recursive:true});
const application=createApplication(),server=createServer((req,res)=>application.emit('request',req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1800,height:886},deviceScaleFactor:1.2});
const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.profileRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[{index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}]});window.profileLongTasks=[];new PerformanceObserver(list=>{for(const e of list.getEntries())if(profileLongTasks.length<1000)profileLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})});
const result={scope:'Local Chromium; CPU throttling is synthetic, not Xbox emulation. Accelerated fixed-step progression is not real-time FPS.',viewport:[1800,886],deviceScaleFactor:1.2,cases:[],progression:[],errors};
try{
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle'});await page.waitForFunction(()=>ASSET.n===57&&PAINT.terrain);
 result.browser=browser.version();const bc=await browser.newBrowserCDPSession();result.gpu=(await bc.send('SystemInfo.getInfo')).gpu.devices;
 for(let repeat=0;repeat<2;repeat++){
  result.progression.push(await page.evaluate(repeat=>{mode='title';const t=performance.now();if(!loadSeriesSLargeBattleSave())throw Error('fixture failed');snd=mus=0;return {repeat,fixtureMs:performance.now()-t,units:S.us.length,buildings:S.bs.length}},repeat));
  for(const phase of [0,60,180]){
   while(await page.evaluate(()=>S.t)<phase-.01){await page.evaluate(target=>{for(let i=0;i<90&&S.t<target-.01&&S.us.length;i++){step(DT);gt+=DT}},phase)}
   result.progression.push(await page.evaluate(({repeat,phase})=>({repeat,phase,time:S.t,units:S.us.length,buildings:S.bs.length,hash:CK_SIM_SYNC.worldCheckpoint(S,1).hash}),{repeat,phase}));
   for(const zoom of [.8,1.96])for(const rate of [1,4]){
    await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    const profile=repeat===0&&phase===180&&zoom===.8&&rate===4;if(profile){await cdp.send('Profiler.enable');await cdp.send('Profiler.start')}
    const sample=await page.evaluate(async({repeat,phase,zoom,rate})=>{
     zm=zoom;TW=64*zm;TH=32*zm;ctr(W/2,H/2);mode='play';gs=0;perfHud=1;acc=0;last=performance.now();
     const before=CK_SIM_SYNC.worldCheckpoint(S,1).hash,values=[],newBefore=TEAM_FRAME_CACHE.creations;
     for(let i=0;i<90;i++){
      const now=await new Promise(resolve=>profileRAF(resolve));frame2(now);
      if(i>=30)values.push({raf:perfFrameIntervalMs,draw:perfDrawMs,loop:perfLoopMs,chunk:perfChunksMs,tile:perfTilesMs,fog:perfFogMs,objects:perfObjectsMs,unit:perfUnitMs,nodes:perfNodeMs,ui:perfUiMs,visibleUnits:perfUnitCount});
     }
     mode='pause';
     const med=a=>{a.sort((a,b)=>a-b);return a[a.length>>1]},metrics={};for(const k of Object.keys(values[0]))metrics[k]={median:med(values.map(v=>v[k])),max:Math.max(...values.map(v=>v[k]))};
     return {repeat,phase,zoom,rate,metrics,hash:before,after:CK_SIM_SYNC.worldCheckpoint(S,1).hash,tintCreations:TEAM_FRAME_CACHE.creations-newBefore,tintPixels:TEAM_FRAME_CACHE.pixels,fogCacheHits:FOG_MASK_CACHE.hits,fogCacheBuilds:FOG_MASK_CACHE.builds,fogCachePixels:(FOG_MASK_CACHE.canvas?.width||0)*(FOG_MASK_CACHE.canvas?.height||0),losses:GRAPHICS_RECOVERY.losses};
    },{repeat,phase,zoom,rate});
    if(profile){const {profile:p}=await cdp.send('Profiler.stop');await writeFile(output+'/wide.cpuprofile',JSON.stringify(p));const nodes=new Map(p.nodes.map(n=>[n.id,n.callFrame])),self=new Map();p.samples?.forEach((id,i)=>self.set(id,(self.get(id)||0)+(p.timeDeltas?.[i]||0)));result.topCPU=[...self].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([id,time])=>({...nodes.get(id),selfMs:time/1000}));}
    result.cases.push(sample);console.log(JSON.stringify({repeat,phase,zoom,rate,raf:sample.metrics.raf,draw:sample.metrics.draw,tile:sample.metrics.tile,fog:sample.metrics.fog}));
    if(sample.hash!==sample.after)throw Error('Frozen render comparison mutated world');
    if(rate===1)await page.screenshot({path:output+`/battle-${repeat}-${phase}-${zoom}.png`});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
   }
  }
 }
 // Natural real-time simulation, fresh fixture at each zoom. Audio API
 // scheduling/clock progress is checked; headless output is not audible Xbox QA.
 result.live=[];
 for(const zoom of [.8,1.96]){
  const live=await page.evaluate(async zoom=>{
   mode='title';if(!loadSeriesSLargeBattleSave())throw Error('Live fixture failed');
   zm=zoom;TW=64*zm;TH=32*zm;ctr(W/2,H/2);mode='play';gs=1;acc=0;last=performance.now();
   snd=mus=1;const audioReady=aInit();if(audioReady)await AC.resume();
   const started=performance.now(),audioStart=AC?.currentTime||0,frames=[],stateStart=S.t;
   while(performance.now()-started<30000){
    const now=await new Promise(resolve=>profileRAF(resolve));frame2(now);
    if(mode==='error')throw Error('Game error in live battle');
    frames.push({raf:perfFrameIntervalMs,draw:perfDrawMs,sim:perfStepMs,ticks:perfStepCount});
   }
   mode='pause';const metrics={};for(const k of Object.keys(frames[0])){const values=frames.map(f=>f[k]).sort((a,b)=>a-b);metrics[k]={median:values[values.length>>1],max:values.at(-1)}}
   return {zoom,wallMs:performance.now()-started,simulatedSeconds:S.t-stateStart,units:S.us.length,buildings:S.bs.length,metrics,audioReady,audioState:AC?.state,audioSeconds:(AC?.currentTime||0)-audioStart,losses:GRAPHICS_RECOVERY.losses};
  },zoom);
  result.live.push(live);console.log('LIVE '+JSON.stringify(live));
 }
 result.longTasks=await page.evaluate(()=>profileLongTasks);await writeFile(output+'/result.json',JSON.stringify(result,null,2));
 if(errors.length||result.cases.some(c=>c.hash!==c.after||c.losses)||result.live.some(c=>c.losses||!c.audioReady||c.audioState!=='running'||c.audioSeconds<28||c.simulatedSeconds<28))throw Error('Browser profile acceptance failed; inspect '+output+'/result.json');
 console.log('COMPLETE '+result.cases.length+' matched frozen-view cases; errors '+errors.length);
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
