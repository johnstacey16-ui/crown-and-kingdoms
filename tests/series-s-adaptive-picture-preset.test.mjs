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
 vm.runInContext(source+'\n'+ui+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 return {run:sandbox.evaluate,storage};
}
function phase(run,now,ms){
 run('sampleAdaptivePicture('+now+','+ms+')');
 for(let i=1;i<=34;i++)run('sampleAdaptivePicture('+(now+1800+i*170)+','+ms+')');
 run('sampleAdaptivePicture('+(now+8001)+','+ms+')');
}
test('adaptive starts with sharp 50 percent and never reduces image quality below that',()=>{
 const {run,storage}=game();
 run('start();mode="pause";setXboxPicturePreset(3);mode="play"');
 assert.equal(run('perfRenderScale'),.5);
 assert.equal(run('perfSharpHud'),1);
 assert.equal(run('currentXboxPicturePreset()'),3);
 phase(run,10000,65);
 assert.equal(run('perfRenderScale'),.5,'sustained slow frames cannot force blurry 40%');
 phase(run,18002,65);
 assert.equal(run('perfRenderScale'),.5);
 assert.equal(run('cv.width'),640);
 assert.equal(run('currentXboxPicturePreset()'),3);
 assert.equal(storage.has('ck_set'),false);
});
test('adaptive requires two fast windows to upscale and drops to 50 when slow',()=>{
 const {run}=game();
 run('start();mode="pause";setXboxPicturePreset(3);mode="play"');
 phase(run,10000,65);assert.equal(run('perfRenderScale'),.5);
 phase(run,18002,18);assert.equal(run('perfRenderScale'),.5);
 phase(run,26004,18);assert.equal(run('perfRenderScale'),.75);
 phase(run,34006,18);phase(run,42008,18);
 assert.equal(run('perfRenderScale'),.75);
 phase(run,50010,65);
 assert.equal(run('perfRenderScale'),.5);
});
test('pauses, background stalls and manual preset override cannot influence FPS windows',()=>{
 const {run,storage}=game();
 run('start();mode="pause";setXboxPicturePreset(3);mode="play"');
 const snapshot=run('JSON.stringify([cam,cur,S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])');
 run('sampleAdaptivePicture(1000,65);sampleAdaptivePicture(3500,65)');
 run('mode="pause";sampleAdaptivePicture(10000,65)');
 assert.equal(run('adaptiveWindowStart'),null);
 run('mode="play";document.hidden=true;sampleAdaptivePicture(20000,65)');
 assert.equal(run('adaptiveWindowStart'),null);
 run('document.hidden=false;sampleAdaptivePicture(21000,65);sampleAdaptivePicture(31000,1200)');
 assert.equal(run('adaptiveWindowStart'),null);
 run('mode="pause";setXboxPicturePreset(2);mode="play"');
 phase(run,40000,65);
 assert.equal(run('perfRenderScale'),.5);
 assert.equal(run('JSON.stringify([cam,cur,S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])'),snapshot);
 assert.equal(storage.has('ck_set'),false);
});
test('temporary full-screen tree/view restores selected adaptive detail, title clears it',()=>{
 const {run}=game();
 run('start();mode="pause";setXboxPicturePreset(3);mode="play"');
 phase(run,10000,65);assert.equal(run('perfRenderScale'),.5);
 run('mode="tree";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('perfRenderScale'),1);
 run('mode="pause";drawFrontEndScreen=()=>false;drawWorld=()=>{};drawGameOverlays=()=>{};draw(.016)');
 assert.equal(run('perfRenderScale'),.5);
 assert.equal(run('perfSharpHud'),1);
 run('mode="title";drawFrontEndScreen=()=>true;draw(.016)');
 assert.equal(run('selectedXboxPicturePreset'),-1);
 assert.equal(run('perfRenderScale'),1);
});
test('Xbox pause menu displays adaptive percentage and game saving ignores resolution',()=>{
 const {run}=game();
 run('start();mode="pause";setXboxPicturePreset(3)');
 assert.equal(run('pmItems().find(x=>x.n==="Xbox picture preset").v()'),'Adaptive 50%');
 assert.match(ui,/40% was removed because it looked too blurry/);
 assert.equal(run('CK_XBOX_PICTURE_PRESETS.length'),4);
 assert.match(engine,/ADAPTIVE_WINDOW_MS=8000/);
 assert.match(engine,/else sampleAdaptivePicture\(now,rafMs\)/);
 const cfg=engine.match(/function sset\(\)\{[\s\S]*?JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(cfg);
 assert.ok(!cfg[1].includes('adaptivePicture'));
});
