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
