import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('js/ui-commands.js'),input=read('js/input.js');
const listUi=read('js/ui.js'),selectionPolicy=read('js/input-selection.js');
const pageStart=ui.indexOf('function radialMenuPage(m){');
const uiEnd=ui.indexOf('\nfunction drawVillagerPriorityWheel',pageStart);
const inputStart=input.indexOf('if(menu){const m=menu,{items,pr,pg,a0,n}=radialMenuPage(m);');
const inputEnd=input.indexOf('\nif(pat){',inputStart);
assert.ok(pageStart>=0&&uiEnd>pageStart,'radial menu page/render source exists');
assert.ok(inputStart>=0&&inputEnd>inputStart,'controller uses the same radial page layout');

function fixture(){
 const labels=[];
 const X={fillRect(){},beginPath(){},arc(){},fill(){},stroke(){},strokeRect(){}};
 const ctx=vm.createContext({CW:1280,CH:720,X,menu:null,DS:{},cs:()=>'',tx:s=>labels.push(String(s)),
   E:[],RE:[],ax:()=>0,yc:0});
 vm.runInContext(ui.slice(pageStart,uiEnd)+'\n'+
   'function handleMenuInput(){'+input.slice(inputStart,inputEnd)+'}\n'+
   'globalThis.page=radialMenuPage;globalThis.draw=drawRadial;globalThis.control=handleMenuInput;',ctx);
 return {ctx,labels};
}
const choice=(label='Stop')=>({l:label,c:{},lk:'',fn:()=>{}});

test('empty command menus draw a safe page and controller A/B or RT release can close them',()=>{
 const {ctx,labels}=fixture();
 for(const malformed of [
  {title:'Empty building',items:[],i:0,rad:1,pg:0},
  {title:'No commands',items:[],i:0,rad:1,pg:99,pr:[]},
  {title:'Stale selection',items:[],i:2,rad:1,pg:-4,pr:[[0,2]]},
  {title:'Broken menu',i:0,rad:1,pg:7,pr:[]}
 ]){
  ctx.menu={...malformed};
  assert.equal(ctx.page(ctx.menu).n,0);
  assert.doesNotThrow(()=>ctx.draw(),'empty/malformed menus never crash the renderer');
  assert.ok(labels.includes('No commands available — A or B to close'));
  ctx.E=[true];ctx.RE=[];assert.doesNotThrow(()=>ctx.control());
  assert.equal(ctx.menu,null,'A closes an unusable radial menu');
  ctx.menu={...malformed};ctx.E=[];ctx.RE[7]=true;ctx.control();
  assert.equal(ctx.menu,null,'RT release closes an unusable radial menu');
  ctx.menu={...malformed};ctx.RE=[];ctx.E[1]=true;ctx.control();
  assert.equal(ctx.menu,null,'B closes an unusable radial menu');
 }
});

test('valid multi-page and custom Build menus remain navigable after stale page indices',()=>{
 const {ctx}=fixture(),items=Array.from({length:27},(_,i)=>choice('Command '+i));
 ctx.menu={title:'Soldiers',items,i:0,rad:1,pg:99};
 let p=ctx.page(ctx.menu);
 assert.equal(p.pg,2);assert.equal(p.a0,24);assert.equal(p.n,3);
 assert.doesNotThrow(()=>ctx.draw());
 ctx.menu.pg=-8;p=ctx.page(ctx.menu);assert.equal(p.pg,0);assert.equal(p.n,12);
 ctx.menu.pg=0;ctx.menu.i=0;ctx.E[3]=true;ctx.control();
 assert.equal(ctx.menu.pg,1);assert.equal(ctx.menu.i,12,'Y advances to next page');
 ctx.E[3]=false;
 ctx.menu={title:'Build',items:items.slice(0,14),i:0,rad:1,pr:[[0,6],[6,14]],pg:1};
 p=ctx.page(ctx.menu);assert.equal(p.pg,1);assert.equal(p.a0,6);assert.equal(p.n,8);
 assert.doesNotThrow(()=>ctx.draw());
 ctx.menu.pr=[[80,90]];p=ctx.page(ctx.menu);
 assert.equal(p.pg,0);assert.equal(p.n,12,'invalid saved page ranges fall back to current commands');
});

test('controller A executes a valid action and safely ignores stale selection indices',()=>{
 const {ctx}=fixture();let called=0;
 ctx.menu={title:'One command',items:[{...choice(),fn:()=>called++}],i:0,rad:1,pg:0};
 ctx.E[0]=true;ctx.control();assert.equal(called,1);
 ctx.menu.i=999;ctx.control();assert.equal(called,2,'stale cursor is normalized to a valid item');
 ctx.menu.i=NaN;ctx.control();assert.equal(called,3,'noninteger cursor is normalized to a valid item');
});

test('stale and malformed radial commands render inert placeholders without crashing',()=>{
 const {ctx,labels}=fixture();let calls=0;
 const invalid=[null,undefined,42,'broken',{l:1,fn:()=>calls++},{l:'',fn:()=>calls++},{l:'No cost',c:null,lk:null,fn:()=>calls++}];
 ctx.menu={title:null,items:[...invalid,choice('Working')],i:0,rad:1,pg:0};
 assert.doesNotThrow(()=>ctx.draw(),'renderer must not trust stale command labels or costs');
 assert.ok(labels.includes('Commands'),'missing title receives a safe caption');
 assert.equal(labels.filter(x=>x==='Unavailable').length,6,'broken entries remain visible but disabled');
 assert.equal(ctx.page(ctx.menu).items.length,8,'positions must remain stable for A selection');
 ctx.E=[true];ctx.control();
 assert.equal(calls,0,'invalid menu entries cannot execute a command');
 assert.equal(ctx.menu.i,0);
 ctx.menu.i=7;assert.doesNotThrow(()=>ctx.control());
 assert.equal(calls,0,'a valid command must not invoke an invalid entry');
});

test('malformed choices preserve custom page indices and never become executable',()=>{
 const {ctx}=fixture();
 const choices=[choice('Real'),undefined,{l:'Broken action',fn:'not callable'},null];
 ctx.menu={title:'Build',items:choices,i:0,rad:1,pr:[[0,2],[2,4]],pg:1};
 const page=ctx.page(ctx.menu);
 assert.equal(page.pg,1);
 assert.equal(page.a0,2);
 assert.equal(page.n,2);
 assert.equal(page.items[2].l,'Broken action');
 assert.equal(page.items[3].l,'Unavailable');
 assert.doesNotThrow(()=>ctx.draw());
 ctx.menu.i=3;ctx.E[0]=true;
 assert.doesNotThrow(()=>ctx.control(),'A on an unusable entry is harmless');
 ctx.E=[];ctx.E[1]=true;ctx.control();assert.equal(ctx.menu,null,'B still closes stale menus');
});

test('list menu uses the same safe choices as the radial controller path',()=>{
 const begin=listUi.indexOf('if(menu&&!menu.rad){'),end=listUi.indexOf('\n\n/* Full-screen menu',begin);
 const radialEnd=ui.indexOf('\nfunction drawRadial()',pageStart);
 assert.ok(begin>=0&&end>begin&&radialEnd>pageStart);
 // The HUD owns one additional outer closing brace after its list-menu branch.
 const block=listUi.slice(begin,end),body=block.slice(0,block.lastIndexOf('\n}'));
 const labels=[];
 const ctx=vm.createContext({menu:null,CW:1280,CH:720,DS:{},X:{fillRect(){}},
  panel(){},cs:()=>'',tx:s=>labels.push(String(s))});
 vm.runInContext(ui.slice(pageStart,radialEnd)+
  '\nfunction renderList(){'+body+'}\n'+
  'globalThis.listPage=listMenuPage;globalThis.renderList=renderList;',ctx);
 for(const items of [undefined,[],[null,42,{l:'',c:null},{l:'Ready',c:{},lk:''}]]) {
  ctx.menu={rad:0,title:null,items,i:999,pg:5,pr:[[5,7]]};
  assert.doesNotThrow(()=>ctx.renderList(),'list rendering must tolerate empty, missing or corrupt entries');
  const p=ctx.listPage(ctx.menu);
  assert.ok(p.i>=0&&(!p.N||p.i<p.N));
 }
 assert.ok(labels.includes('No commands available — A or B to close'));
 ctx.menu={rad:0,title:'Production',items:[{l:'Militia',c:{},lk:''},{l:'Archer',c:{},lk:''}],i:-999};
 assert.doesNotThrow(()=>ctx.renderList());
 assert.equal(ctx.listPage(ctx.menu).i,0,'stale list cursor resolves to the first valid slot');
 assert.ok(labels.includes('Production'));
});

test('opening a radial menu never dereferences a missing contextual menu',()=>{
 const start=selectionPolicy.indexOf('function openRadial(wx,wy){');
 const end=selectionPolicy.indexOf('\nfunction openVillagerPriorityWheel()',start);
 assert.ok(start>=0&&end>start);
 const ctx=vm.createContext({S:{sel:[]},menu:null,cancelGameplayGestures(){},
  pick:()=>null,siteMenu:()=>null,openMenu(){}});
 vm.runInContext(selectionPolicy.slice(start,end)+'\nglobalThis.open=openRadial;',ctx);
 assert.doesNotThrow(()=>ctx.open(8,8));
 assert.equal(ctx.menu,null,'empty context leaves no radial menu');
 ctx.S.sel=[{t:0,k:'mil',hp:20}];
 assert.doesNotThrow(()=>ctx.open(8,8),'selection command may close without offering choices');
 assert.equal(ctx.menu,null);
 ctx.siteMenu=()=>({title:'Target',items:[]});
 ctx.S.sel=[];
 ctx.open(8,8);
 assert.equal(ctx.menu.rad,1);
 assert.equal(ctx.menu.pg,0);
});
