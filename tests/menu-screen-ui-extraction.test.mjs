import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui-screens.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');

test('title, new-game setup and options screens are drawn in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/menus.js'));
  assert.match(ui, /function drawTitle\(\)\{titleBg\(\)/);
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
test('Objectives screen accurately explains all seven selectable victory conditions',()=>{
 const source=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const start=source.indexOf('function drawObj()');
 const end=source.indexOf('function drawInfo2()',start);
 assert.ok(start>=0&&end>start,'use the real in-game Objectives renderer');
 const labels=[];
 const context=vm.createContext({
  X:{fillRect(){},fillStyle:''},CW:1280,CH:720,panel(){},
  tx:(value)=>labels.push(String(value)),
  S:{teamN:2,pl:{tr:2,kills:1,gath:3},civ:[0,1,2],t:50,
     age:[0],us:[],bs:[]},
  CIV:[{n:'Blue'},{n:'Red'},{n:'Gold'}],AG:[{n:'Founding Age'}],
  difficultyName:()=> 'Normal',diff:0,popOf:()=>2,capOf:()=>15,
  cmp:null,cmpObj(){},scoreLimit:1200,vm:0
 });
 vm.runInContext(source.slice(start,end),context);
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
  const objective=labels.find(v=>v.startsWith('Primary: '));
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
 const source=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const start=source.indexOf('function drawObj()'),end=source.indexOf('function drawInfo2()',start);
 assert.ok(start>=0&&end>start);
 const labels=[];
 const ctx=vm.createContext({
  X:{fillRect(){}},CW:1280,CH:720,panel(){},
  tx:value=>labels.push(String(value)),S:{teamN:3,pl:{tr:0,kills:0,gath:0},civ:[0,1,2],t:60,age:[0],us:[],bs:[]},
  CIV:[{n:'Blue'},{n:'Red'},{n:'Gold'}],AG:[{n:'Founding Age'}],
  difficultyName:()=> 'Normal',diff:0,popOf:()=>0,capOf:()=>10,
  cmp:{i:0,d:{}},cmpObj:()=>labels.push('Mission goals shown'),
  scoreLimit:1200,vm:0
 });
 vm.runInContext(source.slice(start,end),ctx);ctx.drawObj();
 assert.ok(labels.some(s=>s.includes('Complete the required mission objectives below')));
 assert.ok(labels.some(s=>s.includes('Mission goals shown')));
 assert.equal(labels.some(s=>s.includes('Primary: Destroy every rival Town Centre')),false,
  'campaign missions can win by scripted objectives, not generic skirmish Town Centre rules');
 ctx.cmp=null;labels.length=0;ctx.drawObj();
 assert.ok(labels.some(s=>s.includes('Primary: Destroy every rival Town Centre')),
  'ordinary skirmishes keep their victory-specific guidance');
});

test('six-goal campaign displays every objective without obscuring the footer',()=>{
 const source=readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8');
 const start=source.indexOf('function cmpHud()'),end=source.indexOf('function drawCamp()',start);
 assert.ok(start>=0&&end>start,'exercise actual campaign screen renderers');
 const painted=[],boxes=[],goals=Array.from({length:6},(_,i)=>({id:'goal'+i,t:'Goal '+i}));
 const ctx=vm.createContext({
  CW:1280,CH:720,
  X:{fillRect:(...args)=>boxes.push(args)},
  tx:(label,x,y,size,color)=>painted.push({label:String(label),x,y,size,color}),
  CAMP:[{t:'Six-goal mission',goals}],cmp:{i:0,d:{}}
 });
 vm.runInContext(source.slice(start,end),ctx);
 ctx.cmpHud();
 assert.equal(painted.filter(r=>r.label.startsWith('- Goal ')).length,5,'HUD shows first five goals');
 assert.ok(painted.some(r=>r.label.includes('+1 more')&&r.label.includes('View')),
  'HUD advertises the sixth goal rather than silently hiding it');
 const height=boxes[0][3];assert.ok(height>160,'HUD backdrop reserves space for overflow hint');
 painted.length=0;ctx.cmpObj();
 const rows=painted.filter(r=>r.label.includes('Goal '));
 assert.equal(rows.length,6,'full objectives lists every campaign goal');
 assert.ok(rows.every(r=>r.y<=720-145),'last objective clears the controller footer');
 assert.ok(rows.every((r,i)=>i===0||r.y-rows[i-1].y>=20),'objectives have readable spacing');
 ctx.cmp.d.goal0=1;painted.length=0;ctx.cmpObj();
 assert.ok(painted.some(r=>r.label==='[x] Goal 0'&&r.color==='#9ae6b4'),'completed state remains visible');
});
