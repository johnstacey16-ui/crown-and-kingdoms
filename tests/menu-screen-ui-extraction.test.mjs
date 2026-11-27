import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');

test('title, new-game setup and options screens are drawn in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/menus.js'));
  assert.match(ui, /function drawTitle\(\)\{\s*titleScene\(\)/);
  assert.match(ui, /function drawSetup\(\)\{titleBg\(\);drawList\('NEW GAME'/);
  assert.match(ui, /function drawOpts\(\)\{titleBg\(\);drawList\('OPTIONS'/);
  for (const name of ['drawTitle','drawSetup','drawOpts']) {
    assert.ok(!menus.includes('function '+name+'('), name+' drawing should not be duplicated in menus.js');
  }
});

test('menu models, option state and controller handlers remain in js/menus.js', () => {
  assert.match(menus, /const setRows=\(\)=>/);
  assert.match(menus, /const optsItems=\(\)=>/);
  assert.match(menus, /function titleCtl\(\)\{/);
  assert.match(menus, /function setupCtl\(\)\{/);
  assert.match(menus, /function optsCtl\(\)\{/);
  assert.match(ui, /drawList\('NEW GAME',setRows\(\),si/);
  assert.match(ui, /drawList\('OPTIONS',optsItems\(\),oi/);
});

test('Menu/Start performs the advertised back action in setup, options, slots and campaign screens',()=>{
 const extract=(source,name)=>{
  const at=source.indexOf('function '+name+'(){');
  assert.ok(at>=0,'production handler '+name+' exists');
  const opening=source.indexOf('{',at);
  let depth=0;
  for(let i=opening;i<source.length;i++){
   if(source[i]==='{')depth++;
   else if(source[i]==='}'&&!--depth)return source.slice(at,i+1);
  }
  throw Error('Unclosed handler '+name);
 };
 const save=readFileSync(new URL('../js/save.js',import.meta.url),'utf8');
 const campaign=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
 const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
 const ctx=vm.createContext({
  E:[],mode:'setup',si:0,oi:0,ci:0,sb:'pause',sm:'save',
  overwriteSlotTarget:null,deleteSlotTarget:null,slot:0,SI:[],
  setRows:()=>[{}],optsItems:()=>[{}],slotItems:()=>[{}],campItems:()=>[{}],
  sset(){},leaveCampaign(){ctx.mode='title';ctx.exits++},exits:0,
  saveG(){throw Error('Menu button must never save')},
  deleteSavedGame(){throw Error('Menu button must never delete')},
  refreshSlots(){throw Error('Menu button must never refresh a deleted slot')}
 });
 const declarations=['setupCtl','optsCtl'].map(x=>extract(menus,x)).join('\n')+
  ['slotsCtl'].map(x=>extract(save,x)).join('\n')+
  ['campCtl','briefCtl'].map(x=>extract(campaign,x)).join('\n');
 vm.runInContext(declarations,ctx);
 ctx.E[9]=true;
 for(const [mode,handler,expected] of [
  ['setup','setupCtl','title'],['opts','optsCtl','title'],
  ['slots','slotsCtl','pause'],['camp','campCtl','title'],
  ['brief','briefCtl','camp']
 ]){
  ctx.mode=mode;ctx[handler]();assert.equal(ctx.mode,expected,mode+' Menu/Start back');
 }
 assert.equal(ctx.exits,1,'campaign exit uses the normal leave handler');
 ctx.mode='slots';ctx.overwriteSlotTarget=1;ctx.slotsCtl();
 assert.equal(ctx.overwriteSlotTarget,null,'Menu cancels an overwrite confirmation');
 assert.equal(ctx.mode,'slots','cancel does not close the slots screen');
 ctx.deleteSlotTarget=2;ctx.slotsCtl();
 assert.equal(ctx.deleteSlotTarget,null,'Menu cancels deletion without deleting any save');
 ctx.E[9]=false;ctx.E[1]=true;
 ctx.mode='setup';ctx.setupCtl();assert.equal(ctx.mode,'title','existing B back still works');
 assert.match(input,/mode!=='title'\)uis\('back'\)/,
  'title screen no longer plays a back sound for an unavailable action');
});
const objectivesUi=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const objectiveCode=[
 objectivesUi.slice(objectivesUi.indexOf('let objectivePage='),objectivesUi.indexOf('function drawInfo2()')),
 objectivesUi.slice(objectivesUi.indexOf('function infoWrap('),objectivesUi.indexOf('function infoPages(')),
 ui.slice(ui.indexOf('function menuMeasure('),ui.indexOf('function menuFit(')),
 ui.slice(ui.indexOf('function cmpObj()'),ui.indexOf('function drawCamp()'))
].join('\n');

test('Objectives screen accurately explains all seven selectable victory conditions',()=>{
 const labels=[];
 const context=vm.createContext({
  X:{fillRect(){},fillStyle:''},CW:1280,CH:720,panel(){},
  tx:(value)=>labels.push(String(value)),
  S:{teamN:2,pl:{tr:2,kills:1,gath:3},civ:[0,1,2],t:50,
     age:[0],us:[],bs:[]},
  CIV:[{n:'Blue'},{n:'Red'},{n:'Gold'}],AG:[{n:'Founding Age'}],
  difficultyName:()=> 'Normal',diff:0,popOf:()=>2,capOf:()=>15,
  cmp:null,cmpObj(){},kingdomAlive:()=>true,scoreLimit:1200,vm:0
 });
 vm.runInContext(objectiveCode,context);
 const expected=[
  /Destroy the enemy Town Centre/,
  /Wonder.*5 minutes/,
  /relic.*4 minutes/i,
  /King alive.*enemy King/i,
  /highest kingdom score.*20-minute time limit/i,
  /central hill.*military units.*5 minutes.*contest/i,
  /starting Town Centre.*hostile Town Centre.*cannot build additional Town Centres/i
 ];
 for(let mode=0;mode<7;mode++){
  labels.length=0;context.vm=mode;context.drawObj();
  const objective=context.objectiveRows()[0][0];
  assert.ok(objective, 'mode '+mode+' must display its primary objective');
  assert.doesNotMatch(objective,/undefined|null/,'mode '+mode+' must show a valid objective');
  assert.match(objective,expected[mode],'mode '+mode+' must match its actual victory rules');
  assert.ok(labels.some(v=>v.includes('A / B / View / RB / Menu: back')),'screen keeps controller close guidance');
 }
 context.vm=4;context.scoreLimit=600;labels.length=0;context.drawObj();
 assert.ok(labels.some(v=>v.includes('10-minute time limit')),'Score mode reflects selected duration');
 context.vm=0;context.S.teamN=3;labels.length=0;context.drawObj();
 assert.ok(labels.some(v=>v.includes('Destroy every rival Town Centre')),'multiplayer objective includes all rivals');
});
test('campaign Objectives use mission goals instead of the skirmish victory rule',()=>{
 const labels=[];
 const ctx=vm.createContext({
  X:{fillRect(){}},CW:1280,CH:720,panel(){},
  tx:value=>labels.push(String(value)),S:{teamN:3,pl:{tr:0,kills:0,gath:0},civ:[0,1,2],t:60,age:[0],us:[],bs:[]},
  CIV:[{n:'Blue'},{n:'Red'},{n:'Gold'}],AG:[{n:'Founding Age'}],
  difficultyName:()=> 'Normal',diff:0,popOf:()=>0,capOf:()=>10,
  cmp:{i:0,d:{}},CAMP:[{t:'Border watch',goals:[{id:'tower',t:'Build a Tower'}]}],kingdomAlive:()=>true,
  scoreLimit:1200,vm:0
 });
 vm.runInContext(objectiveCode,ctx);ctx.drawObj();
 assert.ok(labels.some(s=>s.includes('0 / 1 required goals met')));
 assert.ok(labels.some(s=>s.includes('Build a Tower')));
 assert.equal(labels.some(s=>s.includes('Primary: Destroy every rival Town Centre')),false,
  'campaign missions can win by scripted objectives, not generic skirmish Town Centre rules');
 ctx.cmp=null;labels.length=0;ctx.drawObj();
 assert.ok(labels.some(s=>s.includes('Primary: Destroy every rival Town Centre')),
  'ordinary skirmishes keep their victory-specific guidance');
});

test('six-goal campaign paginates at narrow layouts and returns to its parent',()=>{
 const start=ui.indexOf('function cmpHud()'),end=ui.indexOf('function cmpObj()',start);
 const painted=[],boxes=[];
 const goals=Array.from({length:6},(_,i)=>({
  id:'goal'+i,t:'Goal '+i+' Secure the distant narrow crossing and keep it clear until relief arrives',
  optional:i===5
 }));
 const ctx=vm.createContext({
  CW:390,CH:360,X:{fillRect:(...args)=>boxes.push(args)},panel(){},
  tx:(label,x,y,size,color)=>painted.push({label:String(label),x,y,size,color}),
  CAMP:[{t:'Six-goal mission',goals}],cmp:{i:0,d:{goal0:1}},E:[],mode:'play',omr:'play',
  S:{teamN:2,pl:{tr:0,kills:0,gath:0},civ:[0,1],t:50,age:[0]},
  CIV:[{n:'Blue'},{n:'Red'}],AG:[{n:'Founding Age'}],
  difficultyName:()=> 'Normal',diff:0,popOf:()=>2,capOf:()=>15
 });
 vm.runInContext(objectiveCode+'\n'+ui.slice(start,end),ctx);
 // Keep one extra goal pending to exercise the existing five-goal HUD limit.
 ctx.cmp.d.goal0=0;
 ctx.cmpHud();
 assert.equal(painted.filter(r=>r.label.startsWith('- Goal ')).length,5);
 assert.ok(painted.some(r=>r.label.includes('+1 more')&&r.label.includes('View')));
 assert.ok(boxes[0][3]>160);
 ctx.cmp.d.goal0=1;
 ctx.openObjectives('pause');
 const first=ctx.objectiveLayout();
 assert.ok(first.count>1);
 const rows=[];
 for(let index=0;index<first.count;index++){
  painted.length=0;ctx.drawObj();
  const layout=ctx.objectiveLayout();
  assert.equal(layout.page,index);
  assert.ok(layout.rows.every(row=>ctx.menuMeasure(row.value,layout.size)<=layout.textWidth));
  assert.ok(painted.filter(r=>r.y>=layout.y+86).every(r=>r.y<360));
  assert.ok(painted.some(r=>r.label.includes('Left/Right: pages')));
  const optional=layout.rows.findIndex(r=>r.value.startsWith('[ ] Optional: Goal 5'));
  if(optional>=0)assert.ok(layout.rows.slice(optional).some(r=>r.value.endsWith('relief arrives')),
   'a wrapped goal stays together on one page');
  rows.push(...layout.rows);
  ctx.E[15]=true;ctx.objectiveCtl();ctx.E[15]=false;
 }
 assert.equal(ctx.objectiveLayout().page,first.count-1,'last page clamps');
 assert.equal(rows.filter(r=>r.value.includes('Goal ')).length,6);
 assert.ok(rows.some(r=>r.value.includes('1 / 5 required goals met')));
 assert.ok(rows.some(r=>r.value.startsWith('[x] Goal 0')&&r.color==='#9ae6b4'));
 assert.ok(rows.some(r=>r.value.startsWith('[ ] Optional: Goal 5')));
 ctx.E[14]=true;ctx.objectiveCtl();ctx.E[14]=false;
 assert.equal(ctx.objectiveLayout().page,first.count-2);
 ctx.E[5]=true;ctx.objectiveCtl();ctx.E[5]=false;
 assert.equal(ctx.mode,'pause');
 ctx.openObjectives('play');
 assert.equal(ctx.objectiveLayout().page,0);
 ctx.E[8]=true;ctx.objectiveCtl();
 assert.equal(ctx.mode,'play');
});
test('multi-kingdom Objectives show only kingdoms with living units or buildings',()=>{
 const victory=readFileSync(new URL('../js/simulation-victory.js',import.meta.url),'utf8');
 const alive=victory.match(/function kingdomAlive\(t\)\{[^}]*\}/);
 assert.ok(alive,'exercise the real Objectives renderer and survival rule');
 const labels=[];
 const ctx=vm.createContext({
  X:{fillRect(){}},CW:1280,CH:720,panel(){},tx:value=>labels.push(String(value)),
  S:{teamN:3,civ:[0,1,2],age:[0],t:100,
    pl:{tr:0,kills:0,gath:0},us:[],bs:[]},
  CIV:[{n:'Blue'},{n:'Red'},{n:'Gold'}],AG:[{n:'Founding Age'}],
  diff:0,difficultyName:()=> 'Normal',popOf:()=>0,capOf:()=>20,
  cmp:null,cmpObj(){},scoreLimit:1200,vm:0
 });
 vm.runInContext(alive[0]+'\n'+objectiveCode,ctx);
 const readCount=()=>{
  labels.length=0;ctx.drawObj();
  const row=labels.find(t=>t.includes('Kingdoms alive:'));
  assert.ok(row,'three-kingdom match should display a living-kingdom count');
  const count=row.match(/Kingdoms alive: (\d+)/);
  assert.ok(count);return Number(count[1]);
 };
 ctx.S.us=[{t:0,hp:10},{t:1,hp:0},{t:2,hp:20}];
 ctx.S.bs=[{t:1,hp:0}];
 assert.equal(readCount(),2,'dead units/buildings cannot keep a kingdom alive');
 ctx.S.us[2].hp=0;
 assert.equal(readCount(),1,'a second defeated rival is removed from the count');
 ctx.S.bs.push({t:1,hp:30});
 assert.equal(readCount(),2,'surviving buildings keep a kingdom alive');
 ctx.S.bs[1].hp=0;
 assert.equal(readCount(),1,'destroying its final building eliminates that kingdom');
 ctx.S.teamN=2;labels.length=0;ctx.drawObj();
 assert.equal(labels.some(t=>t.includes('Kingdoms alive:')),false,
  'two-kingdom Objectives retain the existing simpler layout');
});

test('cinematic title layout keeps the selected action visible at console and compact resolutions',()=>{
 const source=ui.slice(ui.indexOf('const CK_TITLE_OPTIONS='),ui.indexOf('function drawSetup(){'));
 const ctx=vm.createContext({});
 vm.runInContext(source,ctx);
 for(const [w,h] of [[1920,1080],[1280,720],[854,480],[640,360],[390,700]]){
  for(let i=0;i<9;i++){
   const l=ctx.titleLayout(w,h,i);
   assert.ok(l.start<=i&&i<l.start+l.visible,'selected row must be visible');
   assert.ok(l.top+l.rh*l.visible<=l.detailY-10,'rows must clear description');
   assert.ok(l.x>=0&&l.x+l.w<=w,'rows must stay within safe horizontal bounds');
   assert.ok(l.detailY<l.footer&&l.footer+11<=h,'footer stays within viewport');
  }
 }
 assert.equal(vm.runInContext('CK_TITLE_OPTIONS.length',ctx),9,'preserve every menu action');
});
test('cinematic title caches the static scene and paints every existing action without a splash delay',()=>{
 const source=ui.slice(ui.indexOf('const CK_TITLE_OPTIONS='),ui.indexOf('function drawSetup(){'));
 let created=0,blits=0,gradientCount=0;const labels=[];
 const gradient=()=>{gradientCount++;return {addColorStop(){}}};
 const drawing=()=>({fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},arc(){},save(){},restore(){},scale(){},fillText(s){labels.push(s)},drawImage(){blits++},createLinearGradient:gradient,createRadialGradient:gradient});
 const X=drawing(),ctx=vm.createContext({X,CW:1280,CH:720,ti:0,hs:true,pad:{id:'Xbox'},gpErr:'',selectedXboxPerformanceLoad:100,
  document:{createElement(){created++;return {getContext:()=>drawing()}}},
  matchMedia:()=>({matches:true}),performance:{now:()=>1000},
  tx:s=>labels.push(s),menuFit:s=>s});
 vm.runInContext(source,ctx);
 ctx.drawTitle();
 for(const name of ['New Game','Campaign','Continue','Options','Controls','About','Multiplayer','Xbox FPS Test · 100 units','Large Battle Test Save'])assert.ok(labels.includes(name),name+' is immediately available');
 assert.ok(labels.includes('CROWN &')&&labels.includes('KINGDOMS'));
 const first=gradientCount;ctx.drawTitle();
 assert.equal(created,1);assert.equal(blits,2);assert.ok(gradientCount-first<=4,'static valley is not redrawn each frame');
 ctx.CW=640;ctx.CH=360;ctx.ti=8;labels.length=0;ctx.drawTitle();assert.ok(labels.includes('Large Battle Test Save'));
 ctx.hs=false;ctx.ti=2;labels.length=0;ctx.drawTitle();assert.ok(labels.includes('Continue  ·  NO SAVE'));
});

test('Controls and About paginate every description without losing words and preserve back actions',()=>{
 const source=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const ctx=vm.createContext({menuMeasure:(s,size)=>String(s).length*size*.53,menuFit:s=>s,E:[],mode:'info',inf:'c',CW:390,CH:720});
 vm.runInContext(source.slice(source.indexOf('function drawInfo2()'),source.indexOf('/* Pause-menu model')),ctx);
 for(const [w,h] of [[1920,1080],[1280,720],[640,360],[390,844]]){
  const l=ctx.infoLayout(w,h);
  for(const controls of [true,false]){
   const pages=ctx.infoPages(controls,l),rows=pages.flat();
   assert.ok(pages.every(p=>p.reduce((sum,row)=>sum+row.height,0)<=l.body));
   assert.ok(rows.every(row=>row.lines.every(line=>ctx.menuMeasure(line,l.size)<=l.textWidth)));
   assert.equal(rows.map(row=>Array.from(row.lines).join(' ')).join(' '),ctx.infoEntries(controls).map(row=>row[1]).join(' '));
  }
 }
 ctx.E[15]=true;ctx.infoCtl();assert.equal(vm.runInContext('infoPage',ctx),1);
 ctx.E=[];ctx.E[14]=true;ctx.infoCtl();assert.equal(vm.runInContext('infoPage',ctx),0);
 ctx.E=[];ctx.E[1]=true;ctx.infoCtl();assert.equal(ctx.mode,'title');
});

test('kingdom vista artwork is deterministic, crops without distortion and honors reduced motion',()=>{
 const source=ui.slice(ui.indexOf('const CK_TITLE_OPTIONS='),ui.indexOf('function drawSetup(){'));
 const ctx=vm.createContext({});vm.runInContext(source,ctx);
 const paint=()=>{
  const calls=[];
  const c={fillStyle:'',fillRect(...v){calls.push(['rect',this.fillStyle?.spec??this.fillStyle,...v])},beginPath(){},moveTo(...v){calls.push(['move',...v])},lineTo(...v){calls.push(['line',...v])},closePath(){},fill(){calls.push(['fill',this.fillStyle?.spec??this.fillStyle])},arc(...v){calls.push(['arc',...v])}};
  // Store gradient identity as serializable geometry and stops, never as mock function references.
  const gradient=(...v)=>{
   const spec={geometry:v,stops:[]};
   return {spec,addColorStop(...s){spec.stops.push(s);calls.push(['stop',...v,...s])}};
  };
  c.createLinearGradient=gradient;c.createRadialGradient=gradient;
  ctx.paintTitleValley(c);return calls;
 };
 assert.deepEqual(paint(),paint(),'cached artwork uses a private fixed seed, not live simulation RNG');
 for(const [w,h] of [[1920,1080],[1280,720],[390,844]]){
  const g=ctx.titleSceneGeometry(w,h);
  assert.equal(g.sx,g.sy);assert.ok(g.dx<=0&&g.dx+g.w>=w-1e-8&&g.dy<=0&&g.dy+g.h>=h-1e-8);
 }
 assert.deepEqual(ctx.titleSceneMotion(0,true),ctx.titleSceneMotion(30000,true));
 assert.notDeepEqual(ctx.titleSceneMotion(0,false),ctx.titleSceneMotion(30000,false));
 for(let time=0;time<60000;time+=173){
  const m=ctx.titleSceneMotion(time,false);assert.ok(m.light>=.74&&m.light<=.92&&Math.abs(m.banner)<=1&&Math.abs(m.mist)<=1);
 }
});

test('front-end scene reveal is brief, non-blocking, screen-specific and reduced-motion safe',()=>{
 const source=ui.slice(ui.indexOf('const CK_TITLE_OPTIONS='),ui.indexOf('function drawSetup(){'));
 const ctx=vm.createContext({});vm.runInContext(source,ctx);
 const state={screen:null,started:0,last:0};
 assert.equal(ctx.titleRevealAlpha(state,'title',100,false),.22);
 assert.ok(ctx.titleRevealAlpha(state,'title',240,false)<.07);
 assert.equal(ctx.titleRevealAlpha(state,'title',380,false),0);
 assert.equal(ctx.titleRevealAlpha(state,'setup',400,false),.22);
 assert.equal(ctx.titleRevealAlpha(state,'setup',700,false),0);
 assert.equal(ctx.titleRevealAlpha(state,'info:c',720,true),0);
 assert.equal(ctx.titleRevealAlpha(state,'info:a',740,true),0);
 assert.equal(ctx.titleRevealAlpha(state,'info:a',760,false),0,'disabling reduced motion does not replay transition');
 assert.equal(ctx.titleRevealAlpha(state,'title',1700,false),.22,'returning after gameplay reveals scene again');
 assert.equal(ctx.titleRevealAlpha(state,'title',1980,false),0);
});

test('setup and options controllers recover stale selections and empty models',()=>{
 for(const [handler,index,model,screen] of [
  ['setupCtl','si','setRows','setup'],['optsCtl','oi','optsItems','opts']
 ]){
  let rows=[],actions=0,saves=0;
  const ctx=vm.createContext({E:[],mode:screen,[index]:0,[model]:()=>rows,sset(){saves++}});
  const start=menus.indexOf('function '+handler+'(){');
  assert.ok(start>=0);
  const end=menus.indexOf('\n',start);
  vm.runInContext(menus.slice(start,end<0?menus.length:end),ctx);
  rows=[{a(){actions++}},{a(){actions+=10}}];
  for(const invalid of [-1,2,NaN,Infinity,0.5,undefined]){
   ctx[index]=invalid;ctx.E=[];ctx.E[0]=true;ctx.mode=screen;
   const before=actions;ctx[handler]();
   assert.equal(ctx[index],0);assert.equal(actions,before+1);
  }
  ctx[index]=0;ctx.E=[];ctx.E[12]=true;ctx[handler]();assert.equal(ctx[index],1);
  ctx.E=[];ctx.E[13]=true;ctx[handler]();assert.equal(ctx[index],0);
  rows=[];ctx.E=[];ctx.E[0]=true;ctx.mode=screen;
  const before=[actions,saves];ctx[handler]();
  assert.equal(ctx.mode,'title');assert.deepEqual([actions,saves],before);
 }
});
