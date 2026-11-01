import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('js/ui.js'),engine=read('engine.js');
const pageStart=ui.indexOf('function radialMenuPage(m){');
const uiEnd=ui.indexOf('\nfunction drawVillagerPriorityWheel',pageStart);
const inputStart=engine.indexOf('if(menu){const m=menu,{items,pr,pg,a0,n}=radialMenuPage(m);');
const inputEnd=engine.indexOf('\nif(pat){',inputStart);
assert.ok(pageStart>=0&&uiEnd>pageStart,'radial menu page/render source exists');
assert.ok(inputStart>=0&&inputEnd>inputStart,'controller uses the same radial page layout');

function fixture(){
 const labels=[];
 const X={fillRect(){},beginPath(){},arc(){},fill(){},stroke(){},strokeRect(){}};
 const ctx=vm.createContext({CW:1280,CH:720,X,menu:null,DS:{},cs:()=>'',tx:s=>labels.push(String(s)),
   E:[],RE:[],ax:()=>0,yc:0});
 vm.runInContext(ui.slice(pageStart,uiEnd)+'\n'+
   'function handleMenuInput(){'+engine.slice(inputStart,inputEnd)+'}\n'+
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
