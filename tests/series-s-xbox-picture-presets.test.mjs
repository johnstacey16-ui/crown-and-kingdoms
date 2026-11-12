import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const picture=readFileSync(new URL('../js/engine-picture.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
function game(){
 const {source,sandbox,storage}=headlessGame();
 const events=new Map();sandbox.document.getElementById('c').addEventListener=(name,fn)=>events.set(name,fn);
 const create=sandbox.document.createElement;sandbox.document.createElement=tag=>tag==='div'?{style:{},setAttribute(){},remove(){}}:create(tag);
 sandbox.document.body={appendChild(){}};
 sandbox.diplomacyMenuItems=()=>[];
 sandbox.tributeMenuItems=()=>[];
 sandbox.villagerPriorityMenuItems=()=>[];
 vm.createContext(sandbox);
 vm.runInContext(readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+'\n'+source+'\n'+ui+'\nglobalThis.evalGame=code=>eval(code);',sandbox);
 return {run:sandbox.evalGame,storage,events};
}
const snap=run=>JSON.parse(run('JSON.stringify({scale:perfRenderScale,sharp:perfSharpHud,dpr:DPR,canvas:[cv.width,cv.height],logical:[CW,CH],mode,selected:currentXboxPicturePreset()})'));

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
 const state=run('JSON.stringify(S)'),saved=JSON.stringify([...storage]);let prevented=false;
 events.get('contextlost')({preventDefault(){prevented=true}});
 assert.equal(prevented,false,'Canvas2D restoration must remain enabled');assert.equal(run('mode'),'pause');assert.equal(run('acc'),0);assert.equal(run('GRAPHICS_RECOVERY.lost.size'),1);
 run('frame2(last+1000)');assert.equal(run('JSON.stringify(S)'),state);assert.equal(JSON.stringify([...storage]),saved);
 run('TCH.set(1,{});TEAM_FRAME_CACHE.entries.set("fake",{});TEAM_FRAME_CACHE.pixels=42');
 events.get('contextrestored')();
 assert.equal(run('GRAPHICS_RECOVERY.lost.size'),0);assert.equal(run('GRAPHICS_RECOVERY.status'),null);assert.equal(run('TCH.size+TEAM_FRAME_CACHE.entries.size+TEAM_FRAME_CACHE.pixels'),0);
 assert.equal(run('perfStepPeak+perfDrawPeak'),0);assert.equal(run('mode'),'pause');assert.equal(run('JSON.stringify(S)'),state);assert.equal(JSON.stringify([...storage]),saved);
});
test('canvas recovery never pauses or changes multiplayer simulation authority',()=>{
 const {run,events}=game();run('start();window.CK_NET={isRunning:()=>true};');
 const state=run('JSON.stringify(S)');events.get('contextlost')({preventDefault(){}});
 assert.equal(run('mode'),'play');events.get('contextrestored')();assert.equal(run('mode'),'play');assert.equal(run('JSON.stringify(S)'),state);
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

test('repeated Xbox world context losses cap only backing pixels while preserving the match',()=>{
 const {run,storage,events}=game();
 run('start();perfHud=1');
 const state=run('JSON.stringify(S)'),saved=JSON.stringify([...storage]);
 const target=[1,.75,.5];
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
  assert.equal(JSON.stringify([...storage]),saved,'no local save or preference is rewritten');
 }
 run('perfFrameIntervalMs=70;perfFps=0;globalThis.perfLabels=[];tx=x=>perfLabels.push(x);mode="play";drawPerfOverlay(.07)');
 assert.match(run('perfLabels.find(x=>x.startsWith("CANVAS"))'),/SCALE 50%.*SAFE 50%/);
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
 run('TCH.set(321,{cv:{width:80,height:90}});TEAM_FRAME_CACHE.entries.set("sprite",{width:40,height:50});TEAM_FRAME_CACHE.pixels=2000');
 run('hudEvents.contextlost();hudEvents.contextrestored()');
 assert.equal(run('GRAPHICS_RECOVERY.losses'),1);
 assert.equal(run('GRAPHICS_RECOVERY.worldLosses'),0);
 assert.equal(run('GRAPHICS_RECOVERY.scale'),1);
 assert.equal(run('TCH.size'),1);
 assert.equal(run('TEAM_FRAME_CACHE.entries.size'),1);
});

test('sustained low FPS after one graphics loss uses a non-compounding resolution cap',()=>{
 const {run,storage,events}=game();run('start();mode="play";perfHud=1');
 const state=run('JSON.stringify(S)'),saved=JSON.stringify([...storage]);
 events.get('contextlost')({preventDefault(){throw Error('must allow Canvas2D restore')}});
 events.get('contextrestored')();
 assert.equal(run('GRAPHICS_RECOVERY.scale'),1);
 run('mode="play";perfDrawMs=46;perfGapMs=33;perfStepMs=3;for(let i=0;i<=160;i++)sampleGraphicsRecovery(i*100,83)');
 assert.equal(run('GRAPHICS_RECOVERY.scale'),.5,'two sustained windows lower output to 50%');
 assert.equal(run('DPR'),.5);
 run('perfRenderScale=.5;rs()');
 assert.equal(run('DPR'),.5,'manual 50% and recovery 50% never compound to 25%');
 assert.equal(run('cv.width'),640);
 assert.equal(run('JSON.stringify(S)'),state);
 assert.equal(JSON.stringify([...storage]),saved);
});

test('two world-context losses select safe troop art without changing units, gameplay or saves',()=>{
 const {run,storage,events}=game();
 run('start();mode="play";perfHud=1');
 const before=run('JSON.stringify(S)'),saved=JSON.stringify([...storage]);
 run('globalThis.artCounts={atlas:0,procedural:0};ASSET.n=1;assetFrame=function(){artCounts.atlas++;return null};spr=function(){artCounts.procedural++;return {width:8,height:8}};blit=function(){}');
 assert.equal(run('GRAPHICS_RECOVERY.unitArtSafe'),false);
 run('drawUnit(S.us[0],new Set())');
 assert.equal(run('artCounts.atlas'),1,'healthy units still request painted atlas frames');
 for(let i=0;i<2;i++){
  events.get('contextlost')();
  events.get('contextrestored')();
  assert.equal(run('GRAPHICS_RECOVERY.unitArtSafe'),i===1);
 }
 run('drawUnit(S.us[0],new Set())');
 assert.equal(run('artCounts.atlas'),1,'safe art avoids every large painted atlas lookup');
 assert.equal(run('artCounts.procedural'),2,'safe art draws the existing team-coloured unit sprite');
 assert.equal(run('JSON.stringify(S)'),before);
 assert.equal(JSON.stringify([...storage]),saved);
 run('perfLabels=[];tx=text=>perfLabels.push(text);drawPerfOverlay(.016)');
 assert.match(run('perfLabels.find(x=>x.startsWith("CANVAS"))'),/TROOP ART SAFE/);
});
