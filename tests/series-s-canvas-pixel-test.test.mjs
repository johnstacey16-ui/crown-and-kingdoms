import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');

function game(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);globalThis.drawFrontEndScreen=()=>true;',sandbox);
 return {run:sandbox.evaluate,storage};
}
test('pixel scales 100, 75 and 50 percent change backing pixel work only',()=>{
 const {run}=game();
 assert.equal(run('perfRenderScale'),1);
 assert.deepEqual(JSON.parse(run('JSON.stringify([CW,CH,cv.width,cv.height,DPR,cv.style.width,cv.style.height])')),
  [1280,720,1280,720,1,'1280px','720px']);
 run('perfRenderScale=.75;rs()');
 assert.deepEqual(JSON.parse(run('JSON.stringify([CW,CH,cv.width,cv.height,DPR,cv.style.width,cv.style.height])')),
  [1280,720,960,540,.75,'1280px','720px']);
 run('perfRenderScale=.5;rs()');
 assert.deepEqual(JSON.parse(run('JSON.stringify([CW,CH,cv.width,cv.height,DPR,cv.style.width,cv.style.height])')),
  [1280,720,640,360,.5,'1280px','720px']);
 run('perfRenderScale=1;rs()');
 assert.deepEqual(JSON.parse(run('JSON.stringify([CW,CH,cv.width,cv.height,DPR,cv.style.width,cv.style.height])')),
  [1280,720,1280,720,1,'1280px','720px']);
});
test('quality, brightness, logical world projection and cursor retain their original semantics',()=>{
 const {run}=game();
 run('start();window.devicePixelRatio=2;gq=2;perfRenderScale=.75;rs()');
 assert.equal(run('DPR'),1.125,'diagnostic scale multiplies existing quality ceiling');
 assert.equal(run('cv.width'),1440);
 assert.equal(run('cv.height'),810);
 const before=run('JSON.stringify([cam,cur,s2w(400,300),w2s(20,30),CW,CH])');
 run('perfRenderScale=.5;rs()');
 assert.equal(run('JSON.stringify([cam,cur,s2w(400,300),w2s(20,30),CW,CH])'),before,
  'changing the backing pixel density cannot change gameplay world coordinates');
 assert.equal(run('DPR'),.75);
 run('br=.8;rs()');assert.equal(run('cv.style.filter'),'brightness(0.8)');
});
test('leaving a match restores full resolution even if front-end draw returns early',()=>{
 const {run,storage}=game();
 run('start();mode="pause";perfRenderScale=.5;perfHud=1;rs()');
 assert.equal(run('cv.width'),640);
 run('mode="title";draw(.033)');
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('cv.width'),1280);
 assert.equal(run('mode'),'title');
 assert.equal(storage.has('ck_set'),false,'diagnostic cannot silently persist to settings');
});
test('Xbox menu test uses explicit controller choices, labels physical pixels and does not write to saves',()=>{
 assert.match(ui,/n:'Canvas pixel test'/);
 assert.match(ui,/a=\[\.5,\.75,1\]/);
 assert.match(ui,/a=\[1,\.75,\.5\]/);
 assert.match(ui,/SCALE '\+Math\.round\(perfRenderScale\*100\)/);
 assert.match(ui,/cv\.width\+'x'\+cv\.height/);
 assert.match(engine,/DPR=Math\.min\(window\.devicePixelRatio\|\|1,\[1,1\.25,1\.5\]\[gq\]\)\*perfRenderScale/);
 const save=engine.match(/function sset\(\)\{[\s\S]*?JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(save);
 assert.ok(!save[1].includes('perfRenderScale'));
 assert.match(engine,/if\(mode!=='play'&&mode!=='pause'&&perfRenderScale!==1\)\{perfRenderScale=1;rs\(\)\}/);
});
