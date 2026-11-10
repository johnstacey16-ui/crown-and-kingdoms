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
 const themeStart=ui.indexOf('const CK_HUD_THEME='),themeEnd=ui.indexOf('function hudTopLayout(',themeStart);
 const layoutStart=ui.indexOf('function hudLowerLayout(');
 assert.ok(themeStart>=0&&themeEnd>themeStart&&layoutStart>themeEnd&&layoutStart<start);
 vm.runInContext(ui.slice(themeStart,themeEnd),ctx);
 vm.runInContext(ui.slice(layoutStart,start),ctx);
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

test('resource and status groups use bounded responsive HUD geometry at console and narrow widths',()=>{
 const start=ui.indexOf('const CK_HUD_THEME='),end=ui.indexOf('function researchNameForHud(',start);
 assert.ok(start>0&&end>start,'shared top bar geometry must stay in js/ui.js');
 const painted=[],drawn=[];
 const context=vm.createContext({
  CW:1280,S:{us:[],res:[{f:840,w:1125,g:325,s:100}],age:[2],t:94},
  X:{
   fillRect:(...a)=>drawn.push(a),
   beginPath(){},arc(){},fill(){},
   set fillStyle(_v){},
  },
  AG:[{n:'Dark Age'},{n:'Feudal Age'},{n:'Castle Age'},{n:'Imperial Age'}],
  popOf:()=>62,capOf:()=>90,gs:1,diff:2,difficultyName:()=>'Moderate',
  panel:(...a)=>drawn.push(['panel',...a]),
  ico:()=>{},tx:(s,x,y,sz,_c,align)=>painted.push({s:String(s),x,y,sz,align})
 });
 vm.runInContext(ui.slice(start,end),context);
 for(const width of [360,480,720,960,1000,1280,1920]){
  const l=context.hudTopLayout(width);
  assert.ok(l.height===60||l.height===100);
  assert.ok(l.slotWidth>=50,'four resource slots must have space for values');
  assert.ok(Math.abs(l.popX-(l.resourceX+l.resourceWidth))<.01);
  assert.ok(l.popX+l.popWidth<=width-l.edge+.01);
  assert.ok(l.ageX+l.ageWidth<=l.statusX+.01,'status cannot overlap age');
  assert.ok(l.statusWidth>=70,'clock always has a usable slot');
  assert.ok(l.statusX+l.statusWidth<=width-l.edge+.01);
  assert.ok(l.height+8<175,'campaign objective overlay stays on screen');
  context.CW=width;painted.length=0;drawn.length=0;
  assert.doesNotThrow(()=>context.topbar(context.S.res[0]));
  for(const label of ['840','1125','325','100','62/90','Castle Age','1:34']){
   assert.ok(painted.some(p=>p.s.includes(label)),
    'top bar at '+width+'px must show '+label);
  }
  assert.ok(drawn.some(p=>p[0]==='panel'&&p[4]===l.height+4));
  assert.ok(painted.filter(p=>p.align==='right').every(p=>p.x<=width));
 }
 assert.equal(context.hudTopLayout(1280).compact,false,'720p Xbox is single row');
 assert.equal(context.hudTopLayout(720).compact,true,'narrow browser uses two rows');
 // Tests intentionally use a malformed loading-game state, as controller fixtures may
 // render a resource bar before the first full age array is initialized.
 context.S.age=undefined;context.CW=1280;painted.length=0;
 assert.doesNotThrow(()=>context.topbar(context.S.res[0]));
 assert.ok(painted.some(p=>p.s.includes('Age unavailable')||p.s.includes('Dark Age')),
  'incomplete pre-match age data must not crash the HUD');
 context.S.age=[2];
});

test('campaign HUD clears both single and two-row resource headers',()=>{
 const screens=readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8');
 const begin=screens.indexOf('function cmpHud()'),end=screens.indexOf('function cmpObj()',begin);
 assert.ok(begin>=0&&end>begin);
 const bounds=[],ctx=vm.createContext({
  X:{fillRect:(...args)=>bounds.push(args)},CW:720,
  CAMP:[{t:'Mission',goals:[{id:'a',t:'Secure the hill'}]}],
  cmp:{i:0,d:{}},tx(){},
  hudTopLayout:width=>({height:width<1000?100:60})
 });
 vm.runInContext(screens.slice(begin,end),ctx);
 ctx.cmpHud();
 assert.equal(bounds[0][1],108,'campaign begins below a compact 100px header');
 bounds.length=0;ctx.CW=1280;ctx.cmpHud();
 assert.equal(bounds[0][1],68,'console objectives begin after the 60px header');
});

test('compact lower HUD keeps selected information above D-pad shortcuts and the minimap',()=>{
 const begin=ui.indexOf('function hudLowerLayout('),end=ui.indexOf('\n/* Full-screen menu',begin);
 assert.ok(begin>0&&end>begin,'use the live lower HUD layout and renderer');
 const painted=[],panels=[];
 const ctx=vm.createContext({
  CW:480,CH:720,mm:{x:326},X:{globalAlpha:1},
  S:{res:[{f:200,w:200,g:200,s:200}],sel:[{k:'tc',hp:100,mh:200,q:[],done:true,t:0}],vc:[],tech:[{}]},
  cmp:null,vm:0,scoreLimit:1200,topbar(){},difficultyName:()=>'Normal',diff:0,gs:1,
  panel:(...args)=>panels.push(args),quickBar:()=>{},minimapDraw:()=>{},notes:[],
  place:null,menu:null,productionQueueWait:()=>null,
  B:{tc:{n:'Town Centre',tr:['vil']}},U:{vil:{n:'Villager'}},
  tx:(s,...args)=>painted.push([String(s),...args]),
  hudTopFit:(s)=>String(s)
 });
 vm.runInContext(ui.slice(ui.indexOf('const CK_HUD_THEME='),ui.indexOf('function hudTopLayout(')),ctx);
 vm.runInContext(ui.slice(begin,end),ctx);
 for(const [width,height] of [[360,720],[480,720],[720,720],[960,720],[480,480]]){
  const g=ctx.hudLowerLayout(width,height);
  assert.ok(g.x>=0&&g.x+g.w<=width,'lower panel must fit the viewport');
  assert.ok(g.y>=100,'lower panel never touches the compact top header');
  assert.ok(g.y+g.h<=height-212-8,'quick-select strip stays below unit details');
  const lines=Array.from(ctx.hudLowerLines('Town Centre has a very long training and research description that must be bounded to two readable lines',g.w-24,16,2));
  assert.ok(lines.length<=2);
  assert.ok(lines.every(line=>line.length<=Math.floor((g.w-24)/(16*.6))));
 }
 ctx.CW=480;ctx.CH=720;painted.length=0;panels.length=0;
 assert.doesNotThrow(()=>ctx.hud());
 const lower=ctx.hudLowerLayout(480,720);
 assert.ok(panels.some(([x,y,w,h])=>x===lower.x&&y===lower.y&&w===lower.w&&h===lower.h));
 assert.ok(painted.some(([s])=>s.includes('Town Centre')),'selected building stays identified');
 assert.ok(painted.some(([s])=>s.includes('A Select')),'essential controls remain visible');
 assert.ok(painted.every(([s,x,y])=>Number.isFinite(x)&&Number.isFinite(y)));
});

test('quick-select strip retains four controller choices without overlapping compact unit details',()=>{
 const commands=readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8');
 const begin=commands.indexOf('function quickBarLayout('),end=commands.indexOf('\nfunction quickBar()',begin);
 assert.ok(begin>=0&&end>begin);
 const layout=vm.runInNewContext(commands.slice(begin,end)+'\nquickBarLayout;');
 for(const [w,h,mmx] of [[360,720,206],[480,480,326],[720,720,490],[960,720,658],[1280,720,966]]){
  const p=layout(w,h,mmx),compact=w<1000;
  assert.equal(p.compact,compact);
  assert.ok(p.x>=0&&p.x+p.w<=w,'all four quick-select buttons are in view');
  assert.ok(p.y>=0&&p.y+p.h<=h);
  assert.equal(p.y,h-(compact?212:112));
  if(compact){
   const info=vm.runInNewContext(ui.slice(ui.indexOf('function hudLowerLayout('),ui.indexOf('function hudLowerLines('))+'\nhudLowerLayout;')(w,h);
   assert.ok(info.y+info.h<=p.y-8,'status text must not overlap quick-select choices');
  }
 }
 const expectedOrder=commands.slice(commands.indexOf('function quickBar(){'));
 assert.ok(expectedOrder.includes("['Idle']")===false);
 assert.ok(expectedOrder.includes("'Idle'"));
 assert.ok(expectedOrder.includes("'Support'"));
 assert.ok(expectedOrder.includes("'Town C.'"));
 assert.ok(expectedOrder.includes("'Military'"));
});

test('large-screen selected details and action hints reserve space for the four D-pad buttons',()=>{
 const hudSource=ui.slice(ui.indexOf('function hud(){'),ui.indexOf('\n/* Full-screen menu',ui.indexOf('function hud(){')));
 assert.ok(hudSource.includes("hudLowerLines(status,available,19,2)"));
 assert.ok(hudSource.includes("hudLowerLines(h,available,16,2)"));
 assert.ok(hudSource.includes("quickBarLayout(CW,CH,mm.x).x"));
 const sample=Array.from({length:2},()=>null);
 assert.ok(sample.length===2);
});

test('compact controller hints keep back/map instructions on a separate visible line',()=>{
 const src=ui.slice(ui.indexOf('function hud(){'),ui.indexOf('\n/* Full-screen menu',ui.indexOf('function hud(){')));
 assert.ok(src.includes("['A Select  RT Menu  LB Groups','RB Map  B Back  Menu Pause']"));
 assert.ok(src.includes('lower.y+61+i*17'));
 assert.ok(src.includes('if(lower.short)'));
});
