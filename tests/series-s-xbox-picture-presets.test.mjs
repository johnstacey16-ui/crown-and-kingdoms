import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
function game(){
 const {source,sandbox,storage}=headlessGame();
 sandbox.diplomacyMenuItems=()=>[];
 sandbox.tributeMenuItems=()=>[];
 sandbox.villagerPriorityMenuItems=()=>[];
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+ui+'\nglobalThis.evalGame=code=>eval(code);',sandbox);
 return {run:sandbox.evalGame,storage};
}
const snap=run=>JSON.parse(run('JSON.stringify({scale:perfRenderScale,sharp:perfSharpHud,dpr:DPR,canvas:[cv.width,cv.height],logical:[CW,CH],mode,selected:currentXboxPicturePreset()})'));

test('original, balanced, smooth and extra-smooth presets keep controller and game projection unchanged',()=>{
 const {run,storage}=game();
 run('start();mode="pause"');
 const start=snap(run);
 const controls=run('JSON.stringify([cam,cur,s2w(420,360),w2s(15,25),CW,CH])');
 assert.equal(start.scale,1);assert.equal(start.sharp,0);assert.equal(start.selected,0);
 for(const [i,scale,width,height] of [[1,.75,960,540],[2,.5,640,360],[3,.4,512,288],[0,1,1280,720]]){
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
 assert.match(engine,/perfRenderScale=p\.scale;perfSharpHud=p\.sharp/);
 assert.match(engine,/perfFlatField=0;perfLayerMode=0/);
 assert.match(ui,/Original 100%, Balanced 75%, Smooth 50%, Extra smooth 40%/);
 const setting=engine.match(/function sset\(\)\{[\s\S]*?JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(setting);
 for(const word of ['perfSharpHud','perfRenderScale','xboxPicturePreset'])assert.ok(!setting[1].includes(word));
});
