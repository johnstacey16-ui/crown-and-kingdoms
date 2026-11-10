import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const picture = readFileSync(new URL('../js/engine-picture.js', import.meta.url), 'utf8');

test('resource bar and in-match HUD have one owner in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function ico\(k,x,y\)\{/);
  assert.match(ui, /function topbar\(r\)\{/);
  assert.match(ui, /function hud\(\)\{/);
  assert.doesNotMatch(engine, /function ico\(k,x,y\)\{/);
  assert.doesNotMatch(engine, /function topbar\(r\)\{/);
  assert.doesNotMatch(engine, /function hud\(\)\{/);
  assert.match(ui, /function drawGameOverlays\(dt\)\{if\(mode==='play'\)\{const\[wx,wy\]=s2w\(cur\.x,cur\.y\);hud\(\);/);
  assert.match(render, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(picture, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(picture, /else drawGameOverlays\(dt\)/);
  assert.match(render, /drawXboxHudOverlays\(dt\)/);
});

test('victory-mode status remains part of the extracted HUD', () => {
  assert.match(ui, /SCORE MODE · /);
  assert.match(ui, /KING OF THE HILL · HOLD THE CENTRAL HILL FOR 5 MIN/);
  assert.match(ui, /SUDDEN DEATH · DEFEND YOUR TOWN CENTRE/);
  assert.match(ui, /minimapDraw\(mm,0\)/);
});

test('research status label safely handles absent or stale technology definitions',()=> {
  const begin=ui.indexOf('function researchNameForHud('),end=ui.indexOf('\nfunction hud(){',begin);
  assert.ok(begin>=0&&end>begin,'the HUD owns its research label formatter');
  const research=vm.runInNewContext(ui.slice(begin,end)+';researchNameForHud;',{
    TE:{known:{n:'Steelwork'}}
  });
  assert.equal(research({k:'age',t:20}),'next age');
  assert.equal(research({k:'known',t:10}),'Steelwork');
  for(const stale of [null,{}, {k:'deleted',t:5}, {k:'__proto__',t:3}])
    assert.equal(research(stale),'unknown technology');
  assert.match(ui,/researchNameForHud\(s\[0\]\.rs\)/,'live selected-building HUD uses the guard');
});
test('selected HUD safely renders stale buildings, corrupted queues and null/dead selection entries',()=>{
 const start=ui.indexOf('function hud(){'),end=ui.indexOf('\n/* Full-screen menu',start);
 assert.ok(start>=0&&end>start,'exercise real in-game HUD renderer');
 const labels=[],state={res:[{f:0,w:0,g:0,s:0}],age:[0],tech:[{}],sel:[],t:42,vc:[]};
 const ctx=vm.createContext({
  S:state,topbar(){},cmp:null,cmpHud(){},vm:0,scoreLimit:1200,CW:1280,CH:720,AG:[{n:'Dark Age'}],
  difficultyName:()=>'Easy',diff:0,gs:1,panel(){},quickBar(){},place:null,menu:null,
  mm:{x:1000},notes:[],X:{globalAlpha:1},tx:label=>labels.push(String(label)),
  minimapDraw(){},B:{tc:{n:'Town Centre',bt:80,tr:['vil']}},U:{vil:{n:'Villager'},mil:{n:'Militia'}},
  unitName:k=>k==='vil'?'Villager':k==='mil'?'Militia':'Unknown',
  mhp:()=>50,stt:()=>'Standing',TASK:{},productionQueueWait:()=>null,researchNameForHud:()=>'Steelwork'
 });
 vm.runInContext(ui.slice(start,end),ctx);
 const expect=(selection,caption)=>{
  state.sel=selection;labels.length=0;
  assert.doesNotThrow(()=>ctx.hud(),'stale selections must not interrupt the main render');
  assert.ok(labels.some(x=>x.includes(caption)), 'HUD should show '+caption);
 };
 expect([{k:'tc',t:0,hp:100,mh:200,q:[],done:true}], 'Town Centre  HP 100/200');
 expect([{k:'deleted',t:0,hp:5,mh:200,q:[],done:false,pr:20}], 'Building (details unavailable)');
 expect([{k:'tc',t:0,hp:5,mh:200,q:[null,{k:'vil',t:'bad'}],done:true}], 'time unknown');
 expect([null,{k:'tc',t:0,hp:0,mh:200,q:[]},{k:'mil',t:0,hp:22,o:'unknown',car:3,ct:null}], 'carrying 3 resource');
 expect(null,'Nothing selected');
 expect([{k:'tc',t:0,hp:100,mh:200,q:[],done:true},{k:'tc',t:0,hp:100,mh:200,q:[],done:true}], '2 production buildings selected');

 // Use the actual production unit-stat formatter, and deliberately make the
 // max-HP helper throw for invalid data. The HUD must guard both paths.
 const commands=readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8');
 const sttStart=commands.indexOf('function stt(a){');
 const sttEnd=commands.indexOf('\n// The radial renderer',sttStart);
 assert.ok(sttStart>=0&&sttEnd>sttStart);
 ctx.S.tech=[{}];
 ctx.U.mil={n:'Militia',hp:50,rng:1,dmg:4};
 ctx.mhp=a=>ctx.U[a.k].hp+(ctx.S.tech[a.t].hpb?.[a.k]||0);
 ctx.meleeResearchAttackBonus=()=>0;ctx.arrowBonus=()=>0;
 ctx.combatArmor=()=>0;ctx.attackRange=()=>3;ctx.conversionRange=()=>6;
 vm.runInContext(commands.slice(sttStart,sttEnd),ctx);
 expect([{k:'mil',t:0,hp:22,o:'i'}], 'Militia  HP 22/50  Atk 4');
 expect([{k:'obsolete-unit',t:0,hp:12,o:'i'}], 'Unit stats unavailable');
 expect([{k:'mil',t:7,hp:12,o:'i'}], 'Unit stats unavailable');
 assert.equal(ctx.stt({k:'obsolete-unit',t:0}),'Stats unavailable');
 assert.equal(ctx.stt({k:'mil',t:7}),'Stats unavailable');
});
