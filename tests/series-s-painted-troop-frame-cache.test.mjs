import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const code=readFileSync(new URL('../js/render-troops.js',import.meta.url),'utf8');
const beg=code.indexOf('const TROOP_TEXTURE_PIXEL_LIMIT='),end=code.indexOf('function drawPaintedTroop(',beg);
assert.ok(beg>=0&&end>beg,'the original production cache and troop painter are present');
const production=code.slice(beg,end);

function scene(){
 const crops=[],contexts=[],calls=[];let fail=false;
 const X={save(){calls.push(['save'])},restore(){calls.push(['restore'])},
  translate(...a){calls.push(['translate',...a])},
  scale(...a){calls.push(['scale',...a])},
  rotate(...a){calls.push(['rotate',...a])},
  drawImage(...a){calls.push(['draw',...a])}};
 const context={document:{createElement(kind){
  assert.equal(kind,'canvas');
  const canvas={width:0,height:0,getContext(type){
   assert.equal(type,'2d');
   if(fail)return null;
   const context={drawImage(...a){crops.push(a)}};contexts.push(context);return context;
  }};
  return canvas;
 }}};
 const fn=vm.runInNewContext(production+'\n({troopFrameTexture,TROOP_TEXTURE_LRU,TROOP_TEXTURE_PIXEL_LIMIT})',context);
 return {...fn,X,calls,crops,contexts,setFail(v){fail=v}};
}
test('unit animated frames use one exact 1:1 crop each and reuse it for identical soldiers',()=>{
 const s=scene(),img={},f={x:15,y:26,w:230,h:246,ax:75,ay:240},art={img,f};
 const first=s.troopFrameTexture(art);
 assert.equal(first.width,230);assert.equal(first.height,246);
 assert.equal(s.troopFrameTexture(art),first);
 assert.equal(s.crops.length,1,'one atlas sample rather than one sample per soldier');
 assert.deepEqual(s.crops[0].slice(1),[15,26,230,246,0,0,230,246]);
 assert.equal(s.TROOP_TEXTURE_LRU.size,1);
 assert.notEqual(s.troopFrameTexture({img,f:{...f,x:50}}),first,'next movement frame receives its own crop');
 assert.notEqual(s.troopFrameTexture({img:{},f}),first,'team image or new atlas invalidates old cache');
});
test('cache stays within its global original RGBA pixel budget and evicts least-recent frames',()=>{
 const s=scene(),img={},f={x:0,y:0,w:300,h:300};
 const first=s.troopFrameTexture({img,f});
 for(let i=1;i<110;i++)s.troopFrameTexture({img,f:{...f,x:i*300}});
 assert.ok(s.TROOP_TEXTURE_LRU.size<=160);
 const retained=[...s.TROOP_TEXTURE_LRU.values()].reduce((n,frame)=>n+frame.width*frame.height,0);
 assert.ok(retained<=s.TROOP_TEXTURE_PIXEL_LIMIT);
 assert.ok(![...s.TROOP_TEXTURE_LRU.values()].includes(first),'oldest cached sprite frame is evicted');
 assert.ok(s.troopFrameTexture({img,f}), 'evicted frame is regenerated on demand');
});
test('on canvas allocation failure, the existing atlas source can still render',()=>{
 const s=scene();s.setFail(true);
 assert.equal(s.troopFrameTexture({img:{},f:{x:1,y:2,w:30,h:50}}),null);
 assert.equal(s.TROOP_TEXTURE_LRU.size,0);
});
test('painted troop painter retains original source dimensions, flip, anchor and animation',()=>{
 const painterBeg=code.indexOf('function drawPaintedTroop('),painterEnd=code.indexOf('/* In-match troop drawing and researched equipment cues. */',painterBeg);
 assert.ok(painterEnd>painterBeg);
 const calls=[];const img={},f={x:20,y:30,w:120,h:170,ax:60,ay:166};
 const productionPainter=code.slice(painterBeg,painterEnd);
 const functionSrc=productionPainter+'\ndrawPaintedTroop';
 const stage={troopFrameTexture:()=>({width:120,height:170}),PAINT_SECONDARY:{},paintedSecondaryPose:()=>null,
  Math,Number};
 const draw=vm.runInNewContext(functionSrc,stage);
 const g={save(){calls.push('save')},restore(){calls.push('restore')},
  translate(...a){calls.push(['translate',...a])},
  scale(...a){calls.push(['scale',...a])},
  rotate(...a){calls.push(['rotate',...a])},
  drawImage(...a){calls.push(['draw',...a])}};
 draw(g,{img,f,animated:true,referenceHeight:170},100,200,.5,1,1,false,'mil');
 assert.equal(calls[0],'save');
 assert.deepEqual(calls.filter(x=>Array.isArray(x)&&x[0]==='translate')[0],['translate',100,200]);
 const rect=calls.find(x=>Array.isArray(x)&&x[0]==='draw');
 assert.deepEqual(rect.slice(2),[-30,-83,60,85],'original frame anchor and dimensions retained');
 assert.equal(calls.at(-1),'restore');
 calls.length=0;
 draw(g,{img,f,animated:true,referenceHeight:170},100,200,.5,1,1,true,'mil');
 assert.ok(calls.some(x=>Array.isArray(x)&&x[0]==='scale'&&x[1]===-1),'face mirroring preserved');
});
test('production unit renderer remains atlas-first, with procedural fallback and model-free cropping',()=>{
 assert.match(code,/af=ASSET\.n\?assetFrame\(k,u\.t,st/);
 assert.match(code,/c=af\?null:spr\(/);
 assert.match(code,/const frame=troopFrameTexture\(art\)/);
 assert.match(code,/else g\.drawImage\(art\.img,f\.x,f\.y,f\.w,f\.h/);
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalGame=code=>eval(code);',sandbox);
 const run=sandbox.evalGame;
 run('start()');
 const before=run('JSON.stringify({us:S.us.map(u=>[u.id,u.k,u.x,u.y,u.hp]),s:S.t})');
 run('const u=S.us[0];if(u){unitVisualPose(u,S.t);}');
 assert.equal(run('JSON.stringify({us:S.us.map(u=>[u.id,u.k,u.x,u.y,u.hp]),s:S.t})'),before);
});


test('an already prepared native tint frame draws directly without a redundant texture copy',()=>{
 const s=scene(),img={width:230,height:246,paintedSourceFrame:{x:15,y:26,w:230,h:246}},f={x:0,y:0,w:230,h:246,ax:75,ay:240};
 assert.equal(s.troopFrameTexture({img,f}),img);assert.equal(s.crops.length,0);assert.equal(s.TROOP_TEXTURE_LRU.size,0);
 assert.notEqual(s.troopFrameTexture({img,f:{...f,w:229}}),img,'a different source rectangle still follows the ordinary crop path');
});

test('painted troop art, its pixel budget and unit dispatcher have exactly one offline runtime owner',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
 assert.ok(html.indexOf('./js/render-procedural-units.js')<html.indexOf('./js/render-troops.js'));
 assert.ok(html.indexOf('./js/render-troops.js')<html.indexOf('./js/ui.js'));
 assert.ok(sw.includes("'./js/render-troops.js'"));
 for(const marker of ['function unitVisualPose(','function paintedSecondaryPose(','function troopFrameTexture(','function drawPaintedTroop(','function drawUnit(','const TROOP_TEXTURE_PIXEL_LIMIT=']){
  assert.ok(code.includes(marker),'troop module owns '+marker);
  assert.ok(!render.includes(marker),'world renderer does not duplicate '+marker);
 }
 assert.ok(render.includes('function drawWorld()'),'original world sort remains in place');
});

test('native high-quality forward-facing motion frames render at identical absolute coordinates without canvas transforms',()=>{
 const start=code.indexOf('function drawPaintedTroop('),end=code.indexOf('/* In-match troop drawing and researched equipment cues. */',start);
 assert.ok(start>=0&&end>start);
 const frame={width:120,height:170},calls=[];
 const g={imageSmoothingEnabled:true,imageSmoothingQuality:'high',
  save(){throw Error('no unnecessary canvas save')},restore(){throw Error('no unnecessary canvas restore')},
  translate(){throw Error('no unnecessary translate')},scale(){throw Error('no unnecessary scale')},
  drawImage(...args){calls.push(args)}};
 const stage={troopFrameTexture:()=>frame,PAINT_SECONDARY:{},paintedSecondaryPose:()=>null,Math,Number};
 const painter=vm.runInNewContext(code.slice(start,end)+'\n;drawPaintedTroop;',stage);
 const f={x:18,y:19,w:120,h:170,ax:60,ay:165};
 painter(g,{img:{},f,animated:true,referenceHeight:170},200,320,.5,1,7,false,'mil');
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],frame);
 assert.deepEqual(calls[0].slice(1),[170,237.5,60,85],
  'cached motion texture retains its original anchor, draw position and rendered dimensions');
 painter(g,{img:{},f,animated:true,referenceHeight:170},200,320,.5,0,7,false,'mil');
 assert.deepEqual(calls[1].slice(1),[170,237.5,60,85]);
});
test('unprepared frames still use exact original atlas crops on the high-quality direct path',()=>{
 const start=code.indexOf('function drawPaintedTroop('),end=code.indexOf('/* In-match troop drawing and researched equipment cues. */',start);
 const calls=[],stage={troopFrameTexture:()=>null,PAINT_SECONDARY:{},paintedSecondaryPose:()=>null,Math,Number};
 const painter=vm.runInNewContext(code.slice(start,end)+'\n;drawPaintedTroop;',stage);
 const g={imageSmoothingEnabled:true,imageSmoothingQuality:'high',drawImage(...args){calls.push(args)},
 save(){throw Error('unexpected transform')},restore(){throw Error('unexpected transform')},
 translate(){throw Error('unexpected transform')},scale(){throw Error('unexpected transform')}};
 const img={},f={x:12,y:26,w:80,h:96,ax:38,ay:93};
 painter(g,{img,f,animated:true,referenceHeight:96},100,200,1,0,0,false,'mil');
 assert.deepEqual(calls[0],[img,12,26,80,96,62,107,80,96]);
});
test('Xbox performance HUD reports bounded team tint and original-size troop frame reuse',()=>{
 const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 assert.match(ui,/TEAM_FRAME_CACHE\.hits/);
 assert.match(ui,/TEAM_FRAME_CACHE\.creations/);
 assert.match(ui,/TEAM_FRAME_CACHE\.evictions/);
 assert.match(ui,/TEAM_FRAME_CACHE\.pixels\*4\/1048576/);
 assert.match(ui,/TROOP_TEXTURE_LRU\.size/);
 assert.match(code,/g\.imageSmoothingQuality==='high'/);
});
