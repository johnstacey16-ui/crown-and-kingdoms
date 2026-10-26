import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const code=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
function game(){
 const {source,sandbox,storage}=headlessGame();
 const renders={hud:0,world:0};const drawContexts=[];
 const hud={width:1,height:1,style:{},getContext(){return proxy}};
 const proxy=new Proxy({setTransform(){},clearRect(){renders.hud++}},{
  get(t,k){return k in t?t[k]:()=>{}},
  set(t,k,v){t[k]=v;return true}
 });
 const original=sandbox.document.getElementById;
 sandbox.document.getElementById=id=>id==='ck-hud'?hud:original(id);
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 return {run:sandbox.evaluate,storage,renders,hud};
}
test('optional native-resolution HUD keeps lower-pixel battlefield and stable world/cursor geometry',()=>{
 const {run,hud}=game();
 run('start();perfTestMatch=1;perfRenderScale=.5;perfSharpHud=1;rs()');
 assert.deepEqual(JSON.parse(run('JSON.stringify([CW,CH,cv.width,cv.height,hudCanvas.width,hudCanvas.height,DPR])')),
   [1280,720,640,360,1280,720,.5]);
 assert.equal(hud.style.display,'block');
 const coords=run('JSON.stringify([cam,cur,CW,CH,s2w(360,220),w2s(20,25)])');
 run('perfRenderScale=.75;rs()');
 assert.equal(run('cv.width'),960);assert.equal(hud.width,1280);
 assert.equal(run('JSON.stringify([cam,cur,CW,CH,s2w(360,220),w2s(20,25)])'),coords);
 run('perfRenderScale=1;rs()');
 assert.equal(run('cv.width'),1280);assert.equal(hud.style.display,'none');
 assert.equal(hud.width,1,'no native-size overlay allocation if the battlefield is full resolution');
});
test('world and UI render on distinct canvases when sharp HUD mode enabled and X restores',()=>{
 const {run,renders}=game();
 run('start();perfTestMatch=1;perfRenderScale=.5;perfSharpHud=1;rs()');
 run('drawFrontEndScreen=()=>false;drawWorld=()=>{};drawGameOverlays=()=>{};draw(.016)');
 // Directly execute production split branch with a safe observable overlay.
 run('drawGameOverlays=()=>{globalThis.hudUsed=(X===HUD_X)};draw(.016)');
 assert.equal(run('hudUsed'),true);
 assert.equal(run('X===WORLD_X'),true);
 assert.ok(renders.hud>=2);
 run('mode="pause";draw(.016)');
 assert.equal(run('hudUsed'),true,'pause menu also stays sharp when full-resolution HUD is enabled');
 run('perfSharpHud=0;rs();draw(.016)');
 assert.equal(run('hudUsed'),false,'HUD returns to original world canvas when disabled');
});
test("the user's automatic benchmarks exclude a second HUD layer and restore it after testing",()=>{
 const {run}=game();
 run('start();perfTestMatch=1;mode="pause";perfSharpHud=1;perfRenderScale=.5;rs()');
 assert.equal(run('beginCanvasBenchmark()'),true);
 assert.equal(run('perfSharpHud'),0);
 assert.equal(run('stopCanvasBenchmark(true)'),true);
 assert.equal(run('perfSharpHud'),1);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('perfSharpHud'),1,'in-session UI preference survives but stays inactive at full resolution');
});
test('test is opt-in, no input interception, no saved settings and reset when exiting',()=>{
 assert.match(html,/id="ck-hud" aria-hidden="true"/);
 assert.match(css,/#ck-hud[\s\S]*?pointer-events: none/);
 assert.match(ui,/perfTestMatch\?\[\{n:'Sharp HUD test'/);
 assert.match(code,/try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
 const saved=code.match(/function sset\(\)\{[\s\S]*?JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(saved);assert.ok(!saved[1].includes('perfSharpHud'));
 const {run,storage,hud}=game();
 run('start();perfTestMatch=1;mode="play";perfSharpHud=1;perfRenderScale=.5;rs()');
 run('mode="title";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('perfSharpHud'),0);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(hud.style.display,'none');
 assert.equal(storage.has('ck_set'),false);
});
