import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const picture = readFileSync(new URL('../js/engine-picture.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');

test('in-match presentation overlays are owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function drawGameOverlays\(dt\)\{/);
  for (const marker of [
    "if(mode==='play'){const[wx,wy]=s2w(cur.x,cur.y);hud();",
    "if(mode==='pause')drawPause()",
    "if(mode==='end'){const p=S.pl",
    "window.CK_NET.drawMatchStatus()"
  ]) assert.ok(ui.includes(marker), marker+' must remain in the UI overlay');
  assert.doesNotMatch(engine, /if\(mode==='play'\)\{const\[wx,wy\]=s2w\(cur\.x,cur\.y\);hud\(\);/);
  assert.match(render, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(picture, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(picture, /else drawGameOverlays\(dt\)/);
  assert.match(render, /drawXboxHudOverlays\(dt\)/);
});

test('extraction keeps selection, menu and match-status overlays wired', () => {
  assert.match(ui, /if\(boxR\)\{/);
  assert.match(ui, /if\(menu&&menu\.rad\)drawRadial\(\)/);
  assert.match(ui, /if\(cgo\)drawCg\(\)/);
  assert.match(ui, /if\(mode==='pause'\)drawPause\(\)/);
  assert.match(ui, /if\(mode==='end'\)\{/);
  assert.match(ui, /window\.CK_NET\.drawMatchStatus\(\)/);
});
test('stale hovered building blueprints cannot crash the live match HUD',()=>{
 const start=ui.indexOf('function drawGameOverlays(dt){');
 const end=ui.indexOf('\n// Full-screen views',start);
 assert.ok(start>=0&&end>start,'exercise the production overlay renderer');
 const labels=[];
 const ctx=vm.createContext({
  mode:'play',s2w:()=>[2,2],hud(){},ov:0,boxR:null,menu:null,cgo:null,vpWheel:null,
  pat:0,cur:{x:120,y:200},X:{beginPath(){},arc(){},moveTo(){},lineTo(){},stroke(){}},
  hover:null,pick(){return ctx.hover},tx:label=>labels.push(String(label)),
  B:{tc:{n:'Town Centre'}},U:{},NM:{},unitName:()=>'? ',mhp:()=>100,
  perfHud:false,window:{CK_NET:null}
 });
 vm.runInContext(ui.slice(start,end),ctx);
 const cases=[
  [{k:'deletedBuilding',q:[],t:0,hp:30,mh:200},'Building 30/200'],
  [{k:'__proto__',q:[],t:0,hp:18,mh:200},'Building 18/200'],
  [{k:'tc',q:[],t:0,hp:150,mh:200},'Town Centre 150/200'],
  [{k:'tc',q:[],t:1,hp:20,mh:200},'Town Centre (enemy) 20/200']
 ];
 for(const [hover,caption] of cases){
  ctx.hover=hover;labels.length=0;
  assert.doesNotThrow(()=>ctx.drawGameOverlays(1/30),'the renderer must survive '+hover.k);
  assert.ok(labels.includes(caption),'building hover preserves '+caption);
 }
 ctx.hover=null;labels.length=0;
 assert.doesNotThrow(()=>ctx.drawGameOverlays(1/30),'empty reticles remain safe');
 assert.equal(labels.length,0);
});


test('queued march preview is bounded, fog-aware and read-only while setting waypoints',()=>{
 const begin=ui.indexOf('function drawQueuedMarchPreview(){');
 const end=ui.indexOf('\n// Controller-first in-match presentation',begin);
 assert.ok(begin>=0&&end>begin,'exercise the production route preview implementation');
 const calls=[],labels=[],visited=[];
 const X={
  save(){calls.push(['save'])},restore(){calls.push(['restore'])},
  setLineDash(v){calls.push(['dash',...v])},beginPath(){calls.push(['begin'])},
  moveTo(x,y){calls.push(['move',x,y])},lineTo(x,y){calls.push(['line',x,y])},
  stroke(){calls.push(['stroke'])},arc(x,y,r){calls.push(['arc',x,y,r])}
 };
 const W=40,H=40,ex=new Uint8Array(W*H).fill(1);
 const unit={k:'mil',t:0,hp:30,x:2.5,y:2.5,o:'m',p:[[3.5,2.5],[4.5,2.5],[5.5,2.5]]};
 const S={ex,sel:[unit],us:[unit]};
 const ctx=vm.createContext({pat:5,S,W,H,X,
  w2s:(x,y)=>{visited.push([x,y]);return [x*10,y*8]},
  tx:(s,...rest)=>labels.push([s,...rest]),Math,Number,Array});
 vm.runInContext(ui.slice(begin,end),ctx);
 const snapshot=JSON.stringify(S);
 assert.doesNotThrow(()=>ctx.drawQueuedMarchPreview());
 assert.equal(calls.filter(x=>x[0]==='save').length,1);
 assert.equal(calls.at(-1)[0],'restore');
 assert.equal(calls.filter(x=>x[0]==='line').length,3,'each explored route node appears');
 assert.equal(calls.filter(x=>x[0]==='arc').length,1,'destination gets a distinct ring');
 assert.equal(labels[0][0],'MARCH END');
 assert.equal(JSON.stringify(S),snapshot,'preview cannot rewrite the live game state or its saved route');
 // A hidden segment must not be drawn as a jump across the fog.
 ex[3*W+7]=0;
 unit.p=[[6.5,3.5],[7.5,3.5],[8.5,3.5]];
 calls.length=0;labels.length=0;visited.length=0;
 ctx.drawQueuedMarchPreview();
 assert.equal(calls.filter(x=>x[0]==='line').length,1,'fog breaks rather than bridges a hidden route');
 assert.equal(labels[0][0],'MARCH END');
 assert.ok(!visited.some(p=>p[0]===7.5&&p[1]===3.5),'never project unrevealed waypoints');
 // The route can contain 512 legitimate nodes, but one render never paints 512 segments.
 unit.p=Array.from({length:512},(_,i)=>[(i%30)+.5,Math.floor(i/30)+.5]);
 calls.length=0;visited.length=0;
 ctx.drawQueuedMarchPreview();
 assert.ok(visited.length<=35,'Xbox preview has a fixed drawing budget');
 assert.ok(calls.filter(x=>x[0]==='line').length<=33,'route cannot force unbounded per-frame drawing');
});

test('queued march preview does not draw during battle, when dismissed, or for invalid selections',()=>{
 const begin=ui.indexOf('function drawQueuedMarchPreview(){');
 const end=ui.indexOf('\n// Controller-first in-match presentation',begin);
 const calls=[];
 const X={save(){calls.push('save')},restore(){calls.push('restore')},
  setLineDash(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){}};
 const unit={k:'mil',t:0,hp:30,x:2.5,y:2.5,o:'m',p:[[4.5,4.5]]};
 const S={ex:new Uint8Array(400).fill(1),sel:[unit],us:[unit]};
 const ctx=vm.createContext({pat:0,S,W:20,H:20,X,w2s:(x,y)=>[x,y],tx(){},Math,Number,Array});
 vm.runInContext(ui.slice(begin,end),ctx);
 ctx.drawQueuedMarchPreview();assert.equal(calls.length,0,'dismissed command makes no preview work');
 ctx.pat=5;unit.hp=0;ctx.drawQueuedMarchPreview();assert.equal(calls.length,0,'defeated troops are ignored');
 unit.hp=30;unit.t=1;ctx.drawQueuedMarchPreview();assert.equal(calls.length,0,'enemy commands cannot appear');
 unit.t=0;unit.o='a';ctx.drawQueuedMarchPreview();assert.equal(calls.length,0,'combat orders are not shown as march plans');
 unit.o='m';S.us=[];ctx.drawQueuedMarchPreview();assert.equal(calls.length,0,'stale selections cannot draw');
 S.us=[unit];unit.p=[[NaN,3],null,[100,100]];
 assert.doesNotThrow(()=>ctx.drawQueuedMarchPreview(),'bad saved path entries are skipped without crashing');
 assert.equal(calls.at(-1),'restore');
});
