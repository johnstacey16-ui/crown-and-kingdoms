import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
// Context-loss diagnostics are the only new persistent writes permitted.
const gameStorage=storage=>JSON.stringify([...storage].filter(([key])=>!/^ck_graphics_loss_(latest|[0-3])$/.test(key)));

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const picture=readFileSync(new URL('../js/engine-picture.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
function game(sharpHud=false){
 const {source,sandbox,storage}=headlessGame();
 const events=new Map();sandbox.document.getElementById('c').addEventListener=(name,fn)=>events.set(name,fn);
 const create=sandbox.document.createElement;sandbox.document.createElement=tag=>{
  if(tag==='div')return {style:{},setAttribute(){},remove(){}};
  const element=create(tag);if(tag==='canvas')element.addEventListener=()=>{};return element;
 };
 const hud=sharpHud?sandbox.document.createElement('canvas'):null;
 if(hud){const get=sandbox.document.getElementById;sandbox.document.getElementById=id=>id==='ck-hud'?hud:get(id)}
 sandbox.document.body={appendChild(){}};
 sandbox.diplomacyMenuItems=()=>[];
 sandbox.tributeMenuItems=()=>[];
 sandbox.villagerPriorityMenuItems=()=>[];
 vm.createContext(sandbox);
 vm.runInContext(readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+'\n'+source+'\n'+ui+'\nglobalThis.evalGame=code=>eval(code);',sandbox);
 return {run:sandbox.evalGame,storage,events,hud};
}
const snap=run=>JSON.parse(run('JSON.stringify({scale:perfRenderScale,sharp:perfSharpHud,dpr:DPR,canvas:[cv.width,cv.height],logical:[CW,CH],mode,selected:currentXboxPicturePreset()})'));
function nativeRecoveryScene(run){
 run(`start();S.us=[{k:'mil',t:0,hp:10},{k:'mil',t:1,hp:10}];
  const frames=Array.from({length:8},(_,i)=>({x:i*2,y:0,w:2,h:2,ax:1,ay:1}));
  const anims={};for(const t of[0,1])for(const state of['idle','walk','attack','work'])anims['mil/'+state+'/'+t]={frames:state==='idle'?[frames[0]]:frames};
  regAtlas('recovery',{width:16,height:2},{painted:true,motion:true,anims});performance.now=()=>0;`);
}
test('offline tint interruption blocks cold draws until manual bounded retry and never auto-resumes',()=>{
 const {run,storage}=game();nativeRecoveryScene(run);
 run(`mode='pause';setXboxPicturePreset(2);globalThis.healthy=assetFrame('mil',0,0,0,0).img;queueRosterTintWarmup(S);mode='play';
  globalThis.worldDraws=0;drawWorld=()=>worldDraws++;drawXboxHudOverlays=()=>{throw Error('cold HUD')};readPad=()=>{};ctl=()=>{mode='play'};`);
 const before=run('JSON.stringify(S)'),saved=gameStorage(storage),quality=snap(run);
 assert.equal(run(`handleGraphicsTintFailure(paintedTintFailure(Error('allocation'))) `),true);
 run('for(let i=1;i<=5;i++)frame2(i*16)');
 assert.equal(run('mode'),'pause');assert.equal(run('worldDraws'),0);assert.equal(run('TINT_WARMUP.status'),'cancelled');
 assert.equal(run('GRAPHICS_RECOVERY.losses'),0);assert.equal(run('GRAPHICS_RECOVERY.tintFailures'),1);assert.equal(run('CK_ERR'),null);
 assert.equal(run('healthy.width'),2);assert.equal(run('JSON.stringify(S)'),before);assert.equal(gameStorage(storage),saved);
 assert.equal(snap(run).selected,quality.selected);assert.deepEqual(snap(run).canvas,quality.canvas);
 run(`pmItems()[0].a();globalThis.maxRetry=0;for(let i=0;TINT_WARMUP.status==='pending'&&i<30;i++){
  const prior=TEAM_FRAME_CACHE.creations;warm();maxRetry=Math.max(maxRetry,TEAM_FRAME_CACHE.creations-prior)}`);
 assert.ok(run('maxRetry')<=4);assert.equal(run('TINT_WARMUP.failed'),0);assert.equal(run('checkGraphicsRestoreReadiness()'),false);
 assert.equal(run('mode'),'pause');assert.equal(run('GRAPHICS_RECOVERY.tintFailure'),null);
 assert.equal(run('JSON.stringify(S)'),before);assert.equal(gameStorage(storage),saved);
 run('pmItems()[0].a()');assert.equal(run('mode'),'play','only a later explicit Resume action starts play');
});
test('failed manual tint preparation stays blocked without retry loops',()=>{
 const {run}=game();nativeRecoveryScene(run);
 run(`mode='play';handleGraphicsTintFailure(paintedTintFailure());paintedTeamFrame=()=>{throw paintedTintFailure()};pmItems()[0].a();
  advanceRosterTintWarmup();checkGraphicsRestoreReadiness();globalThis.attempts=TINT_WARMUP.processed;
  for(let i=0;i<8;i++){warm();checkGraphicsRestoreReadiness()}`);
 assert.equal(run('mode'),'pause');assert.equal(run('TINT_WARMUP.failed'),2);assert.equal(run('TINT_WARMUP.processed'),run('attempts'));
 assert.equal(run('graphicsRestorePending()'),true);assert.equal(run('GRAPHICS_RECOVERY.readiness.reason'),'failed');assert.equal(run('CK_ERR'),null);
});
test('a failure outside the roster plan makes one draw attempt per explicit retry',()=>{
 const {run}=game();run(`start();S.us=[];mode='play';handleGraphicsTintFailure(paintedTintFailure());
  readPad=()=>{};ctl=()=>{};globalThis.drawAttempts=0;drawWorld=()=>{drawAttempts++;throw paintedTintFailure()};`);
 const before=run('JSON.stringify(S)');run('for(let i=1;i<=4;i++)frame(i*16)');assert.equal(run('drawAttempts'),0);
 run('pmItems()[0].a();frame(80)');assert.equal(run('drawAttempts'),1);assert.equal(run('mode'),'pause');
 run('for(let i=6;i<=10;i++)frame(i*16)');assert.equal(run('drawAttempts'),1);assert.equal(run('CK_ERR'),null);
 assert.equal(run('JSON.stringify(S)'),before);assert.equal(run('GRAPHICS_RECOVERY.tintFailures'),2);
});
test('tint recovery rejects online and unrelated errors and releases stale-world gates',()=>{
 const {run}=game();run(`start();mode='play';window.CK_NET={isRunning:()=>true}`);
 assert.equal(run('handleGraphicsTintFailure(paintedTintFailure())'),false);assert.equal(run('mode'),'play');
 run('window.CK_NET=null');assert.equal(run(`handleGraphicsTintFailure(Error('bug'))`),false);
 run('handleGraphicsTintFailure(paintedTintFailure());globalThis.oldWorld=S;S={...S}');
 assert.equal(run('graphicsRestorePending()'),false);assert.equal(run('GRAPHICS_RECOVERY.tintFailure'),null);
 run('mode="title"');assert.equal(run('handleGraphicsTintFailure(paintedTintFailure())'),false);assert.equal(run('mode'),'title');
});
test('A, B and Menu all request bounded recovery and resume only after readiness',()=>{
 for(const button of[0,1,9]){
  const {run}=game();nativeRecoveryScene(run);run('mode="play";handleGraphicsTintFailure(paintedTintFailure())');
  const state=run('JSON.stringify(S)');run('E.fill(false);E['+button+']=true;ctl(0);E.fill(false)');
  assert.equal(run('mode'),'pause');assert.equal(run('GRAPHICS_RECOVERY.tintFailure'),null);assert.equal(run('TINT_WARMUP.status'),'pending');
  run('advanceRosterTintWarmup();globalThis.retryIndex=TINT_WARMUP.index;globalThis.retryJobs=TINT_WARMUP.jobs');
  assert.ok(run('TINT_WARMUP.creations')<=4);
  run('E['+button+']=true;ctl(0);E.fill(false)');
  assert.equal(run('TINT_WARMUP.index'),run('retryIndex'));assert.equal(run('TINT_WARMUP.jobs===retryJobs'),true,'repeated resume does not restart pending preparation');
  run("while(TINT_WARMUP.status==='pending')advanceRosterTintWarmup();checkGraphicsRestoreReadiness()");
  assert.equal(run('mode'),'pause');run('E['+button+']=true;ctl(0);E.fill(false)');assert.equal(run('mode'),'play');
  assert.equal(run('JSON.stringify(S)'),state);
  run('mode="pause";E['+button+']=true;ctl(0);E.fill(false)');assert.equal(run('mode'),'play','ordinary pause controls retain their existing action');
 }
});
test('back from Objectives and Technology Tree keeps the fault blocked until a separate resume press',()=>{
 for(const screen of['Objectives','Technology Tree']){
  const {run}=game();nativeRecoveryScene(run);run('mode="play";handleGraphicsTintFailure(paintedTintFailure())');
  run('pmItems().find(x=>x.n==='+JSON.stringify(screen)+').a();E.fill(false);E[1]=true;ctl(0);E.fill(false)');
  assert.equal(run('mode'),'pause');assert.equal(run('TINT_WARMUP.status'),'cancelled');assert.equal(run('graphicsRestorePending()'),true);
  run('E[1]=true;ctl(0);E.fill(false)');assert.equal(run('TINT_WARMUP.status'),'pending');assert.equal(run('mode'),'pause');
 }
});
test('leaving an active gate cancels only its old preparation source and predictions',()=>{
 for(const exit of['title','end','multiplayer','setup','camp','brief','error','online']){
  const {run}=game();nativeRecoveryScene(run);
  run(`mode='play';handleGraphicsTintFailure(paintedTintFailure());retryGraphicsRestore();advanceRosterTintWarmup(3,1);
   TINT_PREDICTION.world=S;TINT_PREDICTION.jobs.set('old',{});`);
  assert.ok(run('graphicsSurfaceEstimate().tintWarmSourceBytes')>0);
  if(exit==='online')run('window.CK_NET={isRunning:()=>true}');else run('mode='+JSON.stringify(exit));
  assert.equal(run('graphicsRestorePending()'),false);assert.equal(run('TINT_WARMUP.status'),'cancelled');assert.equal(run('TINT_WARMUP.jobs.length'),0);
  assert.equal(run('TINT_WARMUP.required.length'),0);assert.equal(run('TINT_PREDICTION.jobs.size'),0);assert.equal(run('graphicsSurfaceEstimate().tintWarmSourceBytes'),0);
 }
});
test('stale gate cleanup preserves newly planned jobs for the replacement world',()=>{
 const {run}=game();nativeRecoveryScene(run);
 run(`mode='play';handleGraphicsTintFailure(paintedTintFailure());retryGraphicsRestore();
  S={...S};queueRosterTintWarmup(S);globalThis.newJobs=TINT_WARMUP.jobs;
  TINT_PREDICTION.world=S;TINT_PREDICTION.jobs.set('new',{});`);
 const state=run('JSON.stringify(S)');assert.equal(run('graphicsRestorePending()'),false);
 assert.equal(run('TINT_WARMUP.world===S'),true);assert.equal(run('TINT_WARMUP.jobs===newJobs'),true);assert.equal(run('TINT_WARMUP.status'),'pending');
 assert.equal(run('TINT_PREDICTION.jobs.has("new")'),true);run('advanceRosterTintWarmup()');assert.equal(run('TINT_WARMUP.creations'),4);
 assert.equal(run('JSON.stringify(S)'),state);
});

test('original, balanced and smooth presets keep controller and game projection unchanged',()=>{
 const {run,storage}=game();
 run('start();mode="pause"');
 const start=snap(run);
 const controls=run('JSON.stringify([cam,cur,s2w(420,360),w2s(15,25),CW,CH])');
 assert.equal(start.scale,1);assert.equal(start.sharp,0);assert.equal(start.selected,0);
 for(const [i,scale,width,height] of [[1,.75,960,540],[2,.5,640,360],[0,1,1280,720]]){
  assert.equal(run('setXboxPicturePreset('+i+')'),true);
  const t=snap(run);
  assert.equal(t.scale,scale);assert.equal(t.sharp,i===0?0:1);
  assert.equal(t.dpr,scale);
  assert.deepEqual(t.canvas,[width,height]);
  assert.deepEqual(t.logical,[1280,720]);
  assert.equal(t.selected,i);
  assert.equal(run('JSON.stringify([cam,cur,s2w(420,360),w2s(15,25),CW,CH])'),controls);
 }
 assert.equal(storage.has('ck_set'),false,'temporary choice must not affect persistent settings');
});
test('Xbox picture preset appears in ordinary paused games and cycles via controller A and D-pad',()=>{
 const {run}=game();
 run('start();mode="pause"');
 const names=JSON.parse(run('JSON.stringify(pmItems().filter(x=>x.n==="Xbox picture preset").map(x=>x.v()))'));
 assert.deepEqual(names,['Original 100%']);
 run('pmItems().find(x=>x.n==="Xbox picture preset").r()');
 assert.equal(snap(run).selected,1);
 run('pmItems().find(x=>x.n==="Xbox picture preset").a()');
 assert.equal(snap(run).selected,2);
 run('pmItems().find(x=>x.n==="Xbox picture preset").l()');
 assert.equal(snap(run).selected,1);
 run('perfRenderScale=.62;perfSharpHud=1');
 assert.equal(run('currentXboxPicturePreset()'),-1,'diagnostics can create a custom state without a false preset label');
 run('pmItems().find(x=>x.n==="Xbox picture preset").r()');
 assert.equal(snap(run).selected,1,'custom settings cycle to Balanced predictably');
 assert.match(ui,/n:'Xbox picture preset'/);
});
test('preset cannot run outside a match or mutate ongoing benchmark, and new match resets',()=>{
 const {run}=game();
 assert.equal(run('setXboxPicturePreset(2)'),false);
 run('start();mode="pause"');
 assert.equal(run('setXboxPicturePreset(2)'),true);
 run('perfTestMatch=1;beginCanvasBenchmark()');
 assert.equal(run('setXboxPicturePreset(3)'),false);
 run('stopCanvasBenchmark(true)');
 run('mode="pause";setXboxPicturePreset(3)');
 assert.equal(snap(run).selected,3);
 assert.equal(snap(run).scale,.5,'Adaptive replaces the rejected 40% setting');
 run('start()');
 assert.equal(snap(run).selected,0);
 assert.equal(run('currentXboxPicturePreset()'),0);
 run('mode="pause";setXboxPicturePreset(2);mode="title";drawFrontEndScreen=function(){return true};draw(.016)');
 assert.equal(snap(run).selected,0);
});
test('the coloured overflow experiment is off by default, test-save-only, offline and never saved',()=>{
 const {run,storage}=game();run('start();mode="pause"');
 assert.equal(run('UNIT_TINT_WORKSPACE.enabled'),false);assert.equal(run('setUnitTintExperiment(true)'),false);
 assert.equal(run('pmItems().some(x=>x.n==="Unit tint cap test")'),false);
 run('mode="title"');assert.equal(run('loadSeriesSPerformanceSave(50)'),true);run('mode="pause"');
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage),picture=snap(run);
 run('pmItems().find(x=>x.n==="Unit tint cap test").a()');assert.equal(run('UNIT_TINT_WORKSPACE.enabled'),true);
 assert.deepEqual(snap(run),picture);assert.equal(run('JSON.stringify(S)'),state);assert.equal(gameStorage(storage),saved);
 run('canvasBenchmark={}');assert.equal(run('setUnitTintExperiment(false)'),false);run('canvasBenchmark=null');
 run('window.CK_NET={isRunning:()=>true}');assert.equal(run('beginUnitTintScope()'),false);
 run('setUnitTintExperiment(false)');assert.equal(run('setUnitTintExperiment(true)'),false);
 run('window.CK_NET=null;mode="play"');assert.equal(run('setUnitTintExperiment(true)'),false);
 run('mode="pause";perfTestMatch=0');assert.equal(run('unitTintExperimentAllowed()'),false);
});
test('picture preset temporarily yields native resolution in menu views, then restores on returning to game',()=>{
 const {run}=game();
 run('start();mode="pause";setXboxPicturePreset(2)');
 assert.equal(snap(run).selected,2);
 run('mode="tree";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('perfRenderScale'),1,'full-screen tech tree is drawn at full native resolution');
 assert.equal(run('selectedXboxPicturePreset'),2);
 run('mode="pause";drawFrontEndScreen=()=>false;drawWorld=()=>{};drawGameOverlays=()=>{};draw(.016)');
 assert.equal(snap(run).selected,2,'returning to pause restores previous clear-HUD picture preset');
 run('mode="slots";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('perfRenderScale'),1);
 run('mode="play";drawFrontEndScreen=()=>false;draw(.016)');
 assert.equal(snap(run).selected,2);
 run('mode="title";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('selectedXboxPicturePreset'),-1);
 assert.equal(snap(run).selected,0);
});
test('manual graphics diagnostics override a previously selected preset',()=>{
 const {run}=game();
 run('start();mode="pause";setXboxPicturePreset(2)');
 run('pmItems().find(x=>x.n==="Canvas pixel test").r()');
 assert.equal(run('selectedXboxPicturePreset'),-1);
 assert.equal(run('perfRenderScale'),.75);
 run('drawFrontEndScreen=()=>false;drawWorld=()=>{};drawGameOverlays=()=>{};draw(.016)');
 assert.equal(run('perfRenderScale'),.75,'manual 75 percent choice must not be undone automatically');
});
test('no saved state field, source artwork degradation, new controls or hosted services',()=>{
 assert.match(picture,/perfRenderScale=p\.scale;perfSharpHud=p\.sharp/);
 assert.match(picture,/perfFlatField=0;perfLayerMode=0/);
 assert.match(ui,/Original 100%, Balanced 75%, Smooth 50%, or optional Adaptive/);
 assert.doesNotMatch(engine,/Extra smooth 40%/);
 const setting=engine.match(/function sset\(\)\{[\s\S]*?JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(setting);
 for(const word of ['perfSharpHud','perfRenderScale','xboxPicturePreset'])assert.ok(!setting[1].includes(word));
});

test('world canvas loss pauses offline play, clears derived pixels on restoration and preserves game and saves',()=>{
 const {run,storage,events}=game();run('start();perfHud=1;perfStepPeak=208;perfDrawPeak=3427;acc=.1');
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage);let prevented=false;
 events.get('contextlost')({preventDefault(){prevented=true}});
 assert.equal(prevented,false,'Canvas2D restoration must remain enabled');assert.equal(run('mode'),'pause');assert.equal(run('acc'),0);assert.equal(run('GRAPHICS_RECOVERY.lost.size'),1);
 run('frame2(last+1000)');assert.equal(run('JSON.stringify(S)'),state);assert.equal(gameStorage(storage),saved);
 const record=JSON.parse(storage.get('ck_graphics_loss_latest'));
 assert.equal(record.loss,1);assert.equal(record.world,true);assert.ok(storage.has('ck_graphics_loss_0'));
 run('TCH.set(1,{});TEAM_FRAME_CACHE.entries.set("fake",{});TEAM_FRAME_CACHE.pixels=42');
 events.get('contextrestored')();
 assert.equal(run('GRAPHICS_RECOVERY.lost.size'),0);assert.equal(run('GRAPHICS_RECOVERY.status'),null);assert.equal(run('TCH.size+TEAM_FRAME_CACHE.entries.size+TEAM_FRAME_CACHE.pixels'),0);
 assert.equal(run('perfStepPeak+perfDrawPeak'),0);assert.equal(run('mode'),'pause');assert.equal(run('JSON.stringify(S)'),state);assert.equal(gameStorage(storage),saved);
});
test('canvas recovery never pauses or changes multiplayer simulation authority',()=>{
 const {run,events}=game();run('start();window.CK_NET={isRunning:()=>true};TINT_WARMUP.status="sentinel";');
 const state=run('JSON.stringify(S)');events.get('contextlost')({preventDefault(){}});
 assert.equal(run('mode'),'play');events.get('contextrestored')();assert.equal(run('mode'),'play');assert.equal(run('JSON.stringify(S)'),state);
 assert.equal(run('TINT_WARMUP.status'),'sentinel','multiplayer restoration does not schedule solo roster preparation');
});
test('restoration preserves every selected preset and its sharp HUD through repeated losses',()=>{
 const {run,events,hud}=game(true);run('start();mode="pause"');
 for(const preset of[0,1,2,3]){
  run('setXboxPicturePreset('+preset+')');const before=snap(run);
  for(let i=0;i<3;i++){events.get('contextlost')();events.get('contextrestored')()}
  assert.deepEqual(snap(run),before);assert.equal(run('GRAPHICS_RECOVERY.scale'),1);
  assert.deepEqual([hud.width,hud.height,hud.style.display],preset?[1280,720,'block']:[1,1,'none']);
 }
});
test('overlapping world/HUD loss restarts native roster preparation only after the final restore',()=>{
 const {run,events,storage}=game();
 nativeRecoveryScene(run);
 run('globalThis.hudEvents={};installCanvasRecovery({addEventListener:(name,fn)=>hudEvents[name]=fn});advanceRosterTintWarmup(3,1);TINT_PREDICTION.jobs.set("old",{});TINT_PREDICTION.world=S');
 assert.equal(run('TINT_WARMUP.creations'),1);assert.equal(run('!!TINT_WARMUP.source'),true);
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage);
 events.get('contextlost')();run('hudEvents.contextlost()');
 const lossCount=run('GRAPHICS_RECOVERY.losses');events.get('contextlost')();
 assert.equal(run('GRAPHICS_RECOVERY.losses'),lossCount,'duplicate loss events are ignored');
 events.get('contextrestored')();
 assert.equal(run('GRAPHICS_RECOVERY.lost.size'),1);assert.equal(run('TEAM_FRAME_CACHE.entries.size'),0,'world loss releases derived pixels before the browser restores');
 assert.equal(run('!!GRAPHICS_RECOVERY.status'),true);assert.equal(run('TINT_WARMUP.creations'),1);
 run('hudEvents.contextrestored()');
 assert.equal(run('GRAPHICS_RECOVERY.status'),null);assert.equal(run('TEAM_FRAME_CACHE.entries.size'),0);
 assert.equal(run('TINT_WARMUP.total'),2);assert.equal(run('TINT_WARMUP.status'),'pending');
 assert.equal(run('TINT_WARMUP.creations'),0);assert.equal(run('TINT_WARMUP.source'),null);
 assert.equal(run('TINT_PREDICTION.jobs.size'),0);assert.equal(run('TINT_PREDICTION.world'),null);
 events.get('contextrestored')();assert.equal(run('TINT_WARMUP.total'),2,'duplicate restores do not restart the queue');
 let callbacks=0;
 while(run('TINT_WARMUP.status')==='pending'){
  assert.ok(run('advanceRosterTintWarmup().created')<=4);callbacks++;
 }
 assert.equal(callbacks,1);assert.equal(run('TINT_WARMUP.creations'),2);assert.equal(run('TINT_WARMUP.failed'),0);
 assert.equal(run('checkGraphicsRestoreReadiness()'),false);assert.equal(run('GRAPHICS_RECOVERY.preparing'),false);
 assert.equal(run('mode'),'pause');assert.equal(run('JSON.stringify(S)'),state);assert.equal(gameStorage(storage),saved);
});
test('restore callbacks block simulation and cold world/HUD draws until native residency is verified',()=>{
 const {run,events,storage}=game(true);nativeRecoveryScene(run);
 events.get('contextlost')();events.get('contextrestored')();
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage);
 run(`globalThis.worldDraws=0;globalThis.proceduralDraws=0;
  drawWorld=()=>{worldDraws++};hud=()=>{throw Error('cold HUD draw')};drawPause=()=>{};
  readPad=()=>{};ctl=()=>{mode='play'};step=()=>{throw Error('simulation advanced')};
  WQ=[['missing',0,0,0]];spr=()=>{proceduralDraws++};`);
 for(let i=0;i<1;i++){
  run('frame2(last+1000)');assert.equal(run('mode'),'pause');assert.equal(run('acc'),0);
  assert.equal(run('perfStepCount'),0);assert.ok(run('GRAPHICS_TRACE.frame.warmCreations')<=4);
  assert.equal(run('worldDraws+proceduralDraws'),0);assert.equal(run('GRAPHICS_RECOVERY.preparing'),true);
 }
 assert.equal(run('TINT_WARMUP.status'),'drained');assert.equal(run('TINT_WARMUP.creations'),2);
 assert.equal(run('checkGraphicsRestoreReadiness()'),false);assert.equal(run('mode'),'pause','readiness never auto-resumes');
 const creations=run('TEAM_FRAME_CACHE.creations');
 run('for(const j of TINT_WARMUP.required)paintedTeamFrame(j.atlas,j.team,j.frame,j.kind)');
 assert.equal(run('TEAM_FRAME_CACHE.creations'),creations,'all required native frames are resident');
 assert.equal(run('JSON.stringify(S)'),state);assert.equal(gameStorage(storage),saved);
 run('pmItems()[0].a()');assert.equal(run('mode'),'play');
});
test('A, B and Menu cannot bypass preparation; capacity failure stays paused and can be retried',()=>{
 const {run,events}=game();nativeRecoveryScene(run);
 events.get('contextlost')();events.get('contextrestored')();
 run('readPad=()=>{};snd=0;drawWorld=()=>{throw Error("cold world draw")};drawPause=()=>{};WQ=[];globalThis.actualWarm=warm;warm=()=>{}');
 const state=run('JSON.stringify(S)');
 for(const button of[0,1,9]){
  run('E.fill(false);E['+button+']=true;frame2(last+16)');assert.equal(run('mode'),'pause');
 }
 run('warm=actualWarm;E.fill(false);TEAM_FRAME_GROUPS.troop.limit=4;queueRosterTintWarmup(S);frame2(last+16);frame2(last+16)');
 assert.equal(run('GRAPHICS_RECOVERY.readiness.reason'),'incomplete');assert.equal(run('mode'),'pause');
 assert.match(run('graphicsRestoreMessage()'),/incomplete/);
 const count=run('TINT_WARMUP.creations');run('frame2(last+16)');assert.equal(run('TINT_WARMUP.creations'),count,'blocked plans never retry automatically');
 run('TEAM_FRAME_GROUPS.troop.limit=13*1024*1024;pmItems()[0].a()');
 assert.equal(run('mode'),'pause');assert.equal(run('TINT_WARMUP.status'),'pending');
 while(run('TINT_WARMUP.status')==='pending')run('advanceRosterTintWarmup()');
 assert.equal(run('checkGraphicsRestoreReadiness()'),false);assert.equal(run('JSON.stringify(S)'),state);
});
test('leaving or replacing a match releases its restore gate without blocking the next world',()=>{
 const {run,events}=game();nativeRecoveryScene(run);
 events.get('contextlost')();events.get('contextrestored')();
 run('mode="tree";warm()');assert.equal(run('TINT_WARMUP.status'),'drained','safe menus can finish the small recovery plan');
 run('mode="title"');assert.equal(run('graphicsRestorePending()'),false);assert.equal(run('GRAPHICS_RECOVERY.world'),null);
 nativeRecoveryScene(run);events.get('contextlost')();events.get('contextrestored')();
 run('start()');assert.equal(run('graphicsRestorePending()'),false);assert.equal(run('mode'),'play');
});
test('fresh performance fixtures reset prior peaks and all isolation passes',()=>{
 const {run}=game();run('perfStepPeak=208;perfDrawPeak=3427;perfStepCount=5;perfFogMs=11;perfObjectPass=3;perfUnitPass=3;perfFrameIntervalMs=500');
 assert.equal(run('loadSeriesSPerformanceSave(50)'),true);
 assert.equal(run('perfStepPeak+perfDrawPeak+perfStepCount+perfFogMs+perfObjectPass+perfUnitPass+perfFrameIntervalMs'),0);
});

test('performance display reports unclamped RAF time through a one-second stall',()=>{
 const {run}=game();run('start();perfHud=1;perfFrameIntervalMs=1000;perfFps=0;globalThis.perfLabels=[];tx=text=>perfLabels.push(text);drawPerfOverlay(.25)');
 assert.match(run('perfLabels[0]'),/1 FPS  1000.0 ms/);
 assert.match(run('perfLabels.find(text=>text.startsWith("RAF"))'),/^RAF 1000.0 ms/,'one overlay draw reports the same frame interval in both rows');
 assert.match(run('perfLabels.find(text=>text.startsWith("SIM"))'),/0 ticks/);
 assert.match(run('perfLabels.find(text=>text.startsWith("CHUNK"))'),/FOG 0.0/);
 assert.match(run('perfLabels.find(text=>text.startsWith("CANVAS"))'),/ZOOM/);
});

test('repeated Xbox world context losses preserve chosen quality, counters, diagnostic records and the match',()=>{
 const {run,storage,events}=game();
 run('start();perfHud=1');
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage);
 const target=[1,1,1,1,1];
 for(let i=0;i<target.length;i++){
  run('mode="play"');
  events.get('contextlost')({preventDefault(){throw Error('must restore naturally')}});
  assert.equal(run('mode'),'pause');
  events.get('contextrestored')();
  assert.equal(run('GRAPHICS_RECOVERY.worldLosses'),i+1);
  assert.equal(run('GRAPHICS_RECOVERY.scale'),target[i]);
  assert.equal(run('DPR'),target[i]);
  assert.equal(snap(run).canvas[0],Math.round(1280*target[i]));
  assert.equal(run('JSON.stringify(S)'),state,'no entity or sim state is modified');
  assert.equal(gameStorage(storage),saved,'no local save or preference is rewritten');
  assert.equal(JSON.parse(storage.get('ck_graphics_loss_latest')).loss,run('GRAPHICS_RECOVERY.losses'));
 }
 run('perfFrameIntervalMs=70;perfFps=0;globalThis.perfLabels=[];tx=x=>perfLabels.push(x);mode="play";drawPerfOverlay(.07)');
 assert.match(run('perfLabels.find(x=>x.startsWith("CANVAS"))'),/SCALE 100%/);
 assert.doesNotMatch(run('perfLabels.find(x=>x.startsWith("CANVAS"))'),/SAFE/);
 for(let i=0;i<4;i++)assert.ok(storage.has('ck_graphics_loss_'+i),'four loss slots remain available');
});
test('repeated canvas resize with the same dimensions does not invalidate the drawing surface',()=>{
 const {run}=game();run('start();mode="pause"');
 run('globalThis.canvasResizeWrites=0;(()=>{let w=cv.width,h=cv.height;Object.defineProperty(cv,"width",{configurable:true,get:()=>w,set:v=>{canvasResizeWrites++;w=v}});Object.defineProperty(cv,"height",{configurable:true,get:()=>h,set:v=>{canvasResizeWrites++;h=v}})})()');
 run('rs();rs();rs()');
 assert.equal(run('canvasResizeWrites'),0,'same-size rs should not destroy the GPU backing store');
 run('perfRenderScale=.75;rs()');
 assert.equal(run('canvasResizeWrites'),2,'new pixel scale reconfigures each dimension once');
 run('rs()');
 assert.equal(run('canvasResizeWrites'),2,'unchanged new size stays allocated');
});
test('HUD-only graphics restoration keeps healthy world caches and does not lower resolution',()=>{
 const {run}=game();run('start();mode="pause"');
 run('globalThis.hudEvents={};installCanvasRecovery({addEventListener:(name,fn)=>hudEvents[name]=fn})');
 run('TCH.set(321,{cv:{width:80,height:90}});TEAM_FRAME_CACHE.entries.set("sprite",{width:40,height:50});TEAM_FRAME_CACHE.pixels=2000;TINT_WARMUP.status="sentinel"');
 run('hudEvents.contextlost();hudEvents.contextrestored()');
 assert.equal(run('GRAPHICS_RECOVERY.losses'),1);
 assert.equal(run('GRAPHICS_RECOVERY.worldLosses'),0);
 assert.equal(run('GRAPHICS_RECOVERY.scale'),1);
 assert.equal(run('TCH.size'),1);
 assert.equal(run('TEAM_FRAME_CACHE.entries.size'),1);
 assert.equal(run('TINT_WARMUP.status'),'sentinel','HUD-only restoration leaves world preparation alone');
});

test('sustained low FPS after a graphics loss never changes an unselected picture preset',()=>{
 const {run,storage,events}=game();run('start();mode="play";perfHud=1');
 const state=run('JSON.stringify(S)'),saved=gameStorage(storage);
 events.get('contextlost')({preventDefault(){throw Error('must allow Canvas2D restore')}});
 events.get('contextrestored')();
 assert.equal(run('GRAPHICS_RECOVERY.scale'),1);
 run('mode="play";perfDrawMs=46;perfGapMs=33;perfStepMs=3;for(let i=0;i<=160;i++){sampleAdaptivePicture(i*100,83);updateXboxPictureForFrame()}');
 assert.equal(run('GRAPHICS_RECOVERY.scale'),1);assert.equal(run('perfRenderScale'),1);
 assert.equal(run('DPR'),1);assert.equal(run('cv.width'),1280);
 assert.doesNotMatch(picture,/function sampleGraphicsRecovery|recoveryWindowStart|recoveryIntervals/);
 assert.doesNotMatch(engine,/sampleGraphicsRecovery/);
 assert.equal(run('JSON.stringify(S)'),state);
 assert.equal(gameStorage(storage),saved);
});

test('the real 372-unit Original-picture battle recovers without fitting every animation in the cache',()=>{
 const {run,events,storage}=game();
 const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url),'utf8'));
 for(const a of pack.atlases)run('regAtlas('+JSON.stringify(a.id)+',{},'+JSON.stringify(a.meta)+')');
 assert.equal(run('loadSeriesSLargeBattleSave()'),true);
 run('setXboxPicturePreset(0);queueRosterTintWarmup(S);performance.now=()=>0');
 assert.ok(run('TINT_WARMUP.skipped')>0,'full-animation preparation cannot fit the actual battle roster');
 const state=()=>run('JSON.stringify([S.t,S.us.map(u=>[u.netId,u.k,u.t,u.x,u.y,u.hp,u.o,u.tg?.netId]),S.bs.map(b=>[b.netId,b.k,b.t,b.x,b.y,b.hp]),S.res,S.tech])');
 const before=state(),saved=gameStorage(storage);
 events.get('contextlost')();
 assert.equal(run('TEAM_FRAME_CACHE.entries.size'),0);
 assert.equal(run('TINT_WARMUP.source'),null);
 events.get('contextrestored')();
 assert.equal(run('TINT_WARMUP.skipped'),0);
 assert.ok(run('TINT_WARMUP.total')<=44,'one ready pose for each actual kind/team, not all animation poses');
 // A late image-index refresh must not replace this with the oversized plan.
 run('rebuildAssetAnimationIndex()');assert.equal(run('TINT_WARMUP.skipped'),0);
 let frames=0;while(run('TINT_WARMUP.status')==='pending'&&frames++<50)assert.ok(run('advanceRosterTintWarmup().created')<=4);
 assert.ok(frames<=11);assert.equal(run('checkGraphicsRestoreReadiness()'),false);
 assert.equal(run('mode'),'pause');assert.equal(state(),before);assert.equal(gameStorage(storage),saved);
 assert.equal(run('currentXboxPicturePreset()'),0);assert.equal(run('perfRenderScale'),1);
 run('pmItems()[0].a()');assert.equal(run('mode'),'play','Resume is usable once the bounded plan is ready');
});
