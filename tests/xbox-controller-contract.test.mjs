import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

function fixture() {
  const {source,sandbox,listeners}=headlessGame();
  sandbox.fireEvent=(name,event)=>listeners.get(name)?.(event);
  vm.createContext(sandbox);vm.runInContext(source+'\n'+readFileSync(new URL('../js/ui.js',import.meta.url),'utf8'),sandbox);
  vm.runInContext(`
    mode='play';S={us:[],bs:[],sel:[],vp:createVillagerPriority()};
    pad={axes:[0,0,0,0],buttons:[]};
    clampCam=()=>{};
    cur={x:100,y:100};
    globalThis.orders=0;orderSel=()=>{globalThis.orders++;return true;};
    globalThis.run=(edges=[],held=[],released=[])=>{E=edges;P=held;RE=released;playCtl(0);};
    globalThis.state=()=>({selection:S.sel.map(e=>e.netId),automation:S.vp.enabled,zoom:zm,
      groups:(S.cg||[]).map(g=>g.map(e=>e.netId)),radial:cgo?.sel??null,camera:{...cam},formation:fm,
      overview:ov,filter:mmF,mapMode:mmM,flare:S.flare,gesture:!!aDown,box:!!boxR,shortcutHeld:yDown,shortcut:ysc.vb});
  `,sandbox);
  return sandbox;
}
const button=i=>Object.assign([],{[i]:true});

test('LT+A adds a clicked unit without toggling automation or replacing selection',()=>{
  const c=fixture();
  vm.runInContext(`
    const first={netId:'first',t:0,k:'vil',hp:25,x:3,y:3};
    const second={netId:'second',t:0,k:'vil',hp:25,x:10,y:10};
    S.us=[first,second];S.sel=[first];pick=()=>second;
  `,c);
  const before=c.state().automation;
  c.run(button(0),Object.assign(button(0),{6:true}));
  c.run([],button(6),button(0));
  assert.deepEqual(Array.from(c.state().selection),['first','second']);
  assert.equal(c.state().automation,before);assert.equal(c.orders,0);
});

test('removed solo shortcuts cannot issue a generic X order, cycle R3 subgroups or change LT targets',()=>{
  const c=fixture();
  vm.runInContext(`globalThis.subgroups=0;subg=()=>{globalThis.subgroups++;};`,c);
  const zoom=c.state().zoom;
  for(const key of [2,11])c.run(button(key),button(key));
  for(const key of [12,13,14,15,2,1])c.run(button(key),Object.assign(button(key),{6:true}));
  assert.equal(c.orders,0);assert.equal(c.subgroups,0);assert.equal(c.state().zoom,zoom);
});

test('solo D-pad categories select idle villagers, support, town centres and military',()=>{
  const c=fixture();
  vm.runInContext(`
    S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3},
      {netId:'support',t:0,k:'mon',hp:25,x:4,y:4},
      {netId:'army',t:0,k:'mil',hp:40,x:5,y:5},
      {netId:'enemy',t:1,k:'vil',hp:25,o:'i',x:6,y:6}];
    S.bs=[{netId:'town',t:0,k:'tc',hp:100,done:true,x:7,y:7,s:3,q:[]}];
  `,c);
  for(const [key,id] of [[12,'worker'],[15,'support'],[13,'town'],[14,'army']]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),[id]);
  }
});

function openGroup(c){
  c.run(button(4),button(4));
  vm.runInContext('pad.axes=[0,-1,0,0];',c);
  c.run([],button(4));assert.equal(c.state().radial,0);
  vm.runInContext('pad.axes=[0,0,0,0];',c);
}

test('LB/X assigns only distinct living owned world entities, including buildings',()=>{
  const c=fixture();
  vm.runInContext(`
    const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};
    const town={netId:'town',t:0,k:'tc',hp:100,x:10,y:10,s:3,q:[]};
    const enemy={...own,netId:'enemy',t:1},dead={...own,netId:'dead',hp:0};
    const loaded={...own,netId:'loaded',ld:town},stale={...own,netId:'stale'};
    S.us=[own,enemy,dead,loaded];S.bs=[town];S.sel=[own,own,town,enemy,dead,loaded,stale];
  `,c);
  const selection=Array.from(c.state().selection);
  openGroup(c);c.run(button(2),button(4));c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().groups[0]),['own','town']);
  assert.deepEqual(Array.from(c.state().selection),selection,'assigning is not recalling');
  assert.equal(c.orders,0);assert.equal(c.state().radial,null);
});

test('LB release checks current ownership and world membership; unloaded units become available again',()=>{
  const c=fixture();
  vm.runInContext(`
    const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};
    const converted={...own,netId:'converted'},removed={...own,netId:'removed'};
    const dead={...own,netId:'dead'},loaded={...own,netId:'loaded'};
    S.us=[own,converted,removed,dead,loaded];S.sel=S.us.slice();
  `,c);
  openGroup(c);c.run(button(2),button(4));c.run([],[],button(4));
  vm.runInContext(`converted.t=1;S.us=S.us.filter(u=>u!==removed);dead.hp=0;loaded.ld={};S.sel=[];`,c);
  const camera=c.state().camera;
  openGroup(c);c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own']);
  assert.deepEqual(Array.from(c.state().groups[0]),['own','converted','removed','dead','loaded'],'recalling does not rewrite the assigned group');
  assert.deepEqual(c.state().camera,camera,'recall alone does not use the Y focus action');
  vm.runInContext(`converted.t=0;loaded.ld=null;`,c);
  openGroup(c);c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own','converted','loaded'],'availability is checked against current ownership and garrison state');
  assert.equal(c.orders,0);
});

test('LB/Y focuses a valid group and releasing Y cannot trigger a gameplay shortcut',()=>{
  const c=fixture();
  vm.runInContext(`
    const town={netId:'town',t:0,k:'tc',hp:100,x:20,y:20,s:3,q:[]};
    S.bs=[town];S.cg=[[town]];S.sel=[];
    globalThis.shortcutCalls=0;yShort=()=>{globalThis.shortcutCalls++;};
  `,c);
  const camera=c.state().camera;
  openGroup(c);c.run(button(3),Object.assign(button(4),{3:true}));
  assert.deepEqual(Array.from(c.state().selection),['town']);
  assert.notDeepEqual(c.state().camera,camera);
  c.run([],button(3),button(4));c.run([],[],button(3));
  assert.equal(c.shortcutCalls,0);assert.equal(c.orders,0);
});

test('B cancels the group wheel and an empty group never replaces a valid selection',()=>{
  const c=fixture();
  vm.runInContext(`const own={netId:'own',t:0,k:'mil',hp:40,x:8,y:8};S.us=[own];S.sel=[own];S.cg=[[]];`,c);
  openGroup(c);c.run(button(1),button(4));c.run([],[],button(4));
  assert.deepEqual(Array.from(c.state().selection),['own']);assert.equal(c.state().radial,null);
  openGroup(c);c.run(button(3),Object.assign(button(4),{3:true}));
  c.run([],[],button(4));c.run([],[],button(3));
  assert.deepEqual(Array.from(c.state().selection),['own']);assert.equal(c.orders,0);
});

test('D-pad quick selection skips dead, garrisoned, foreign and unfinished entities in every category',()=>{
  const c=fixture();
  vm.runInContext(`
    const unit=(id,k,extra={})=>({netId:id,t:0,k,hp:25,o:'i',x:3,y:3,...extra});
    S.us=[];
    for(const [prefix,kind] of [['worker','vil'],['support','mon'],['army','mil']]){
      S.us.push(unit(prefix+'-dead',kind,{hp:0}),unit(prefix+'-loaded',kind,{ld:{}}),
        unit(prefix+'-foreign',kind,{t:1}),unit(prefix,kind));
    }
    S.us.push(unit('busy-worker','vil',{o:'g'}),unit('trade-cart','cart'),unit('trade-ship','cog'),
      unit('transport','trn'),unit('king','king'),unit('fish','fish',{o:'g'}));
    const town=(id,extra={})=>({netId:id,t:0,k:'tc',hp:100,done:true,x:7,y:7,s:3,q:[],...extra});
    S.bs=[town('dead-town',{hp:0}),town('unfinished-town',{done:false}),town('foreign-town',{t:1}),town('town')];
  `,c);
  for(const [key,ids] of [[12,['worker']],[15,['support']],[13,['town']],[14,['army']]]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),ids);
  }
  vm.runInContext(`
    globalThis.hudText=[];X.fillText=s=>hudText.push(String(s));quickBar();
  `,c);
  assert.deepEqual(Array.from(c.hudText),['Idle','1','Support','1','Town C.','1','Military','1'],'HUD counts match selectable entities');
  vm.runInContext(`hudText.length=0;topbar({f:0,w:0,g:0,s:0});`,c);
  assert.ok(c.hudText.includes('Idle 1'),'top-bar idle count excludes dead or loaded workers');
  assert.equal(c.orders,0);
});

test('quick selection checks fresh availability and leaves selection and camera alone when a category is empty',()=>{
  const c=fixture();
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,o:'i',x:3,y:3};
    const b={...a,netId:'b',x:8,y:8};S.us=[a,b];S.sel=[];
  `,c);
  c.run(button(12),button(12));assert.deepEqual(Array.from(c.state().selection),['a']);
  vm.runInContext('a.hp=0;',c);
  c.run(button(12),button(12));assert.deepEqual(Array.from(c.state().selection),['b']);
  vm.runInContext('b.ld={};',c);
  const camera=c.state().camera;
  for(const key of [12,13,14,15]){
    c.run(button(key),button(key));assert.deepEqual(Array.from(c.state().selection),['b']);
    assert.deepEqual(c.state().camera,camera);
  }
  vm.runInContext('b.ld=null;',c);c.run(button(12),button(12));
  assert.deepEqual(Array.from(c.state().selection),['b']);assert.equal(c.orders,0);
});

test('expanded minimap focuses with Y, ignores A and consumes Y release before gameplay shortcuts',()=>{
  const c=fixture();
  vm.runInContext(`
    S.sel=[{netId:'selected',t:0,k:'vil',hp:25,x:3,y:3}];
    globalThis.shortcutCalls=0;yShort=()=>{globalThis.shortcutCalls++;};
  `,c);
  c.run(button(5),button(5));assert.equal(c.state().overview,1);
  const before=c.state().camera;
  c.run(button(0),button(0));c.run([],[],button(0));
  assert.equal(c.state().overview,1);assert.deepEqual(c.state().camera,before);assert.equal(c.orders,0);
  c.run(button(3),button(3));assert.equal(c.state().overview,0);
  assert.notDeepEqual(c.state().camera,before);
  c.run([],[],button(3));assert.equal(c.shortcutCalls,0);
  assert.deepEqual(Array.from(c.state().selection),['selected']);assert.equal(c.orders,0);
});

test('expanded minimap D-pad actions do not leak into unit selection and cancellation does not focus',()=>{
  const c=fixture();
  vm.runInContext(`S.t=10;S.sel=[{netId:'selected',t:0,k:'mil',hp:25,x:3,y:3}];`,c);
  c.run(button(5),button(5));const camera=c.state().camera;
  c.run(button(12),button(12));assert.equal(c.state().flare.t,10);
  for(const expected of [1,2,0]){
    c.run(button(15),button(15));assert.equal(c.state().filter,expected);
    c.run(button(14),button(14));assert.equal(c.state().mapMode,expected);
  }
  assert.deepEqual(Array.from(c.state().selection),['selected']);assert.deepEqual(c.state().camera,camera);
  c.run(button(1),button(1));assert.equal(c.state().overview,0);
  assert.deepEqual(c.state().camera,camera);assert.equal(c.orders,0);
});

test('minimap overlay and controller help advertise Y for camera focus',()=>{
  const c=fixture();
  vm.runInContext(`
    globalThis.helpText=[];X.fillText=s=>helpText.push(String(s));
    minimapDraw=()=>{};S.teamN=2;drawOv();drawInfo2();
  `,c);
  assert.ok(c.helpText.some(s=>s.includes('Y: jump camera')));
  assert.ok(c.helpText.some(s=>s.includes('Y jumps there')));
  assert.equal(c.helpText.some(s=>s.includes('A: jump camera')||s.includes('A or Y jumps there')),false);
});

function buildFixture(){
  const c=fixture();
  vm.runInContext(`
    setSize(32);S.age=[3,3];S.tech=[{},{}];S.res=[{f:1000,w:1000,g:1000,s:1000},{f:1000,w:1000,g:1000,s:1000}];
    S.g=new Uint8Array(W*H);S.wt=new Uint8Array(W*H);S.ex=new Uint8Array(W*H).fill(1);S.nd=[];S.nodes=[];
    globalThis.worker={netId:'worker',k:'vil',t:0,hp:25,x:10,y:10,o:'i'};S.us=[worker];S.sel=[worker];
    ysc.vb='farm';const p=w2s(12,12);cur={x:p[0],y:p[1]};pick=()=>null;
    globalThis.addMill=(extra={})=>{const b={netId:'mill',k:'mill',t:0,hp:100,done:true,q:[],x:4,y:4,s:2,...extra};S.bs.push(b);return b;};
    globalThis.chooseFarm=()=>{menu.i=menu.items.findIndex(it=>it.l===B.farm.n);return menu.items[menu.i].lk;};
    globalThis.buildState=()=>JSON.stringify({place:place&&{...place},wood:S.res[0].w,food:S.res[0].f,queued:S.bs.reduce((n,b)=>n+(b.q?.length||0),0),
      farms:S.nodes.filter(n=>n.fm).map(n=>({owner:n.t,food:n.amt})),buildings:S.bs.length,
      workers:S.us.map(u=>({id:u.netId,order:u.o,target:u.tg?.k||null})),notes:notes.map(n=>n.s)});
  `,c);
  return {c,run:code=>vm.runInContext(code,c),state:()=>JSON.parse(c.buildState())};
}
function farmShortcut(c){c.run(button(3),button(3));c.run([],[],button(3));}

test('farm shortcut and RT menu require a currently living completed owned Mill without spending resources',()=>{
  for(const route of ['shortcut','wheel'])for(const condition of ['missing','foreign','unfinished','dead']){
    const f=buildFixture();
    if(condition!=='missing')f.run(`addMill(${JSON.stringify({foreign:{t:1},unfinished:{done:false},dead:{hp:0}}[condition])});`);
    if(route==='shortcut')farmShortcut(f.c);
    else{
      f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'Needs Mill');
      f.c.run(button(0),button(7));
    }
    assert.equal(f.state().place,null,route+' '+condition);
    assert.equal(f.state().wood,1000);assert.equal(f.state().farms.length,0);
    assert.ok(f.state().notes.includes('Needs Mill'));
  }
});

test('build menu rechecks Mill completion and ownership when A confirms its farm entry',()=>{
  for(const change of ['mill.hp=0','mill.t=1','S.bs=[]','worker.ld={}']){
    const f=buildFixture();f.run('globalThis.mill=addMill();');
    f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'');
    f.run(change);
    if(change!=='worker.ld={}')assert.equal(f.c.chooseFarm(),'Needs Mill','menu lock follows the current prerequisite');
    f.c.run(button(0),button(7));
    assert.equal(f.state().place,null,change);assert.equal(f.state().wood,1000,change);
  }
  const f=buildFixture();f.c.run(button(7),button(7));assert.equal(f.c.chooseFarm(),'Needs Mill');
  f.run('addMill();');assert.equal(f.c.chooseFarm(),'');f.c.run(button(0),button(7));
  assert.equal(f.state().place.k,'farm','a newly completed Mill unlocks the existing menu entry');
});

test('farm preview rechecks prerequisites at placement and valid placement charges once with researched farm capacity',()=>{
  const f=buildFixture();f.run('globalThis.mill=addMill();S.tech[0].coll=1;');farmShortcut(f.c);
  assert.equal(f.state().place.k,'farm');assert.equal(f.state().wood,1000);
  f.run('mill.hp=0;');f.c.run(button(0),button(0));
  assert.equal(f.state().place.ok,false);assert.equal(f.state().wood,1000);assert.equal(f.state().farms.length,0);
  f.run('mill.hp=100;');f.c.run(button(0),button(0));
  assert.equal(f.state().place,null);assert.equal(f.state().wood,940);
  assert.deepEqual(f.state().farms,[{owner:0,food:250}]);
  assert.deepEqual(f.state().workers,[{id:'worker',order:'g',target:'f'}]);
});

test('invalid selected villagers cannot start shortcuts or receive building orders, and no available builder means no charge',()=>{
  for(const change of ['worker.hp=0','worker.ld={}','worker.t=1','S.us=[]']){
    const f=buildFixture();f.run('addMill();');f.run(change);farmShortcut(f.c);
    assert.equal(f.state().place,null,change);assert.equal(f.state().wood,1000);
    // A previously opened placement must also reject loss of its builders.
    f.run("place={k:'farm'};");f.c.run(button(0),button(0));
    assert.equal(f.state().wood,1000,change);assert.equal(f.state().farms.length,0,change);
  }
});

test('house shortcut remains available without a Mill and placement excludes invalid workers from the build order',()=>{
  const f=buildFixture();
  f.run(`
    ysc.vb='house';
    const dead={...worker,netId:'dead',hp:0},loaded={...worker,netId:'loaded',ld:{}},foreign={...worker,netId:'foreign',t:1};
    S.us.push(dead,loaded,foreign);S.sel=[worker,worker,dead,loaded,foreign];
  `);
  farmShortcut(f.c);assert.equal(f.state().place.k,'house');f.c.run(button(0),button(0));
  assert.equal(f.state().wood,975);assert.equal(f.state().buildings,1);
  assert.deepEqual(f.state().workers.map(u=>u.order),['b','i','i','i']);
});

function selectTap(c){c.run(button(0),button(0));c.run([],[],button(0));}

test('solo double A selects only living owned ungarrisoned units of the same type on screen',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};
    const b={...a,netId:'b',x:4,y:4};
    S.us=[a,b,{...a,netId:'dead',hp:0},{...a,netId:'foreign',t:1},
      {...a,netId:'loaded',ld:{}},{...a,netId:'offscreen',x:1000,y:1000},{...a,netId:'monk',k:'mon'}];
    pick=()=>a;
  `,c);
  selectTap(c);time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['a','b']);assert.equal(c.orders,0);
});

test('solo building double A excludes dead, foreign and offscreen buildings',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`
    const town={netId:'town',t:0,k:'tc',hp:100,mh:100,done:true,q:[],x:3,y:3,s:3};
    S.bs=[town,{...town,netId:'building',hp:1,done:false,x:5,y:5},
      {...town,netId:'dead',hp:0},{...town,netId:'foreign',t:1},
      {...town,netId:'offscreen',x:1000,y:1000}];pick=()=>town;
  `,c);
  selectTap(c);time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['town','building']);assert.equal(c.orders,0);
});

test('solo LT boxes filter stale members, deduplicate and retain eligible selections outside a reverse box',()=>{
  const c=fixture();
  vm.runInContext(`
    const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3},b={...a,netId:'b',x:4,y:4};
    const monk={...a,netId:'monk',k:'mon',x:20,y:10};
    const dead={...a,netId:'dead',hp:0},foreign={...a,netId:'foreign',t:1},loaded={...a,netId:'loaded',ld:{}};
    S.us=[a,b,monk,dead,foreign,loaded];
    S.sel=[monk,monk,dead,foreign,loaded,{...a,netId:'stale'}];
    boxSel({x0:100,y0:200,x1:-100,y1:0},true);
  `,c);
  assert.deepEqual(Array.from(c.state().selection),['monk','a','b']);assert.equal(c.orders,0);
});

test('picking skips dead units and buildings before world compaction',()=>{
  const c=fixture();
  vm.runInContext(`
    setSize(32);S.ex=new Uint8Array(W*H).fill(1);S.vs=S.ex;S.nd=[];S.rel=[];
    const a={netId:'live',t:0,k:'vil',hp:25,x:10,y:10};
    S.us=[{...a,netId:'dead',hp:0},{...a,netId:'loaded',ld:{}},a];
    S.bs=[{netId:'dead-town',t:0,k:'tc',hp:0,x:2,y:2,s:3,q:[]},
      {netId:'live-town',t:0,k:'tc',hp:100,x:5,y:5,s:3,q:[]}];
    globalThis.picked=[pick(10,10)?.netId,pick(3,3)?.netId||null,pick(6,6)?.netId];
  `,c);
  assert.deepEqual(Array.from(c.picked),['live',null,'live-town']);
});

test('unfinished A boxes are cancelled by menu changes, quick selection, B, blur and disconnection',()=>{
  for(const interruption of ['B','RB','LB','RT','Dpad','View','Menu','blur','disconnect','poll-loss']){
    const c=fixture();
    vm.runInContext(`
      S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3}];S.sel=S.us.slice();pad.index=0;
      saveG=()=>true;pick=()=>null;
    `,c);
    c.run(button(0),button(0));vm.runInContext('cur.x+=50;',c);c.run([],button(0));
    assert.equal(c.state().box,true,interruption);
    const key={B:1,RB:5,LB:4,RT:7,Dpad:12,View:8}[interruption];
    if(key!==undefined)c.run(button(key),button(0));
    if(interruption==='Menu')vm.runInContext('E=[];E[9]=true;P=[];P[0]=true;RE=[];ctl(0);',c);
    if(interruption==='blur')c.fireEvent('blur');
    if(interruption==='disconnect')c.fireEvent('gamepaddisconnected',{gamepad:{index:0}});
    if(interruption==='poll-loss')vm.runInContext('pad=null;E=[];P=[];RE=[];ctl(0);',c);
    assert.equal(c.state().gesture,false,interruption);assert.equal(c.state().box,false,interruption);
    vm.runInContext("menu=cgo=null;ov=0;mode='play';",c);
    c.run([],[],button(0));assert.equal(c.orders,0,interruption);
  }
});

test('controller replacement cancels a pending A tap and its first release cannot issue an order',()=>{
  const c=fixture();
  vm.runInContext(`
    S.us=[{netId:'worker',t:0,k:'vil',hp:25,o:'i',x:3,y:3}];S.sel=S.us.slice();
    pad.id='old';pad.index=0;pad.connected=true;
  `,c);
  c.run(button(0),button(0));assert.equal(c.state().gesture,true);
  vm.runInContext(`
    globalThis.replacement={id:'new',index:1,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0}))};
    navigator.getGamepads=()=>[replacement];readPad();playCtl(0);
    replacement.buttons[0]={pressed:false,value:0};readPad();playCtl(0);
  `,c);
  assert.equal(c.state().gesture,false);assert.equal(c.orders,0);
});

test('B on the same frame as A release cancels selection before any order or tap can execute',()=>{
  const c=fixture();
  vm.runInContext(`const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};S.us=[a];S.sel=[a];pick=()=>a;`,c);
  c.run(button(0),button(0));c.run(button(1),[],button(0));
  assert.deepEqual(Array.from(c.state().selection),[]);assert.equal(c.orders,0);assert.equal(c.state().gesture,false);
  selectTap(c);assert.deepEqual(Array.from(c.state().selection),['a'],'fresh taps still work after cancellation');
});

test('opening and closing the minimap cancels a partly completed double-A sequence',()=>{
  const c=fixture();let time=1000;c.performance.now=()=>time;
  vm.runInContext(`const a={netId:'a',t:0,k:'vil',hp:25,x:3,y:3};S.us=[a,{...a,netId:'b',x:4,y:4}];pick=()=>a;`,c);
  selectTap(c);c.run(button(5),button(5));c.run(button(1),button(1));
  time+=100;selectTap(c);
  assert.deepEqual(Array.from(c.state().selection),['a']);assert.equal(c.orders,0);
});

test('Y opening a build preview on the same frame as A release cannot execute the unfinished A order',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(0),button(0));
  f.c.run(button(3),Object.assign(button(0),{3:true}));
  f.c.run([],[],Object.assign(button(0),{3:true}));
  assert.equal(f.state().place.k,'house');assert.equal(f.c.state().gesture,false);
  assert.equal(f.c.orders,0);assert.equal(f.state().wood,1000);
});

test('Y shortcut requires a gameplay press; orphan releases and held-Y cycling cannot build',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run([],[],button(3));assert.equal(f.state().place,null);
  f.c.run(button(14),button(3));
  assert.equal(f.c.state().shortcut,'house','held Y without a gameplay press cannot change the shortcut');
  farmShortcut(f.c);assert.equal(f.state().place.k,'house');assert.equal(f.state().wood,1000);
});

test('menus, quick selection, B, focus and controller loss consume a held Y shortcut until a fresh press',()=>{
  for(const interruption of ['RT','LB','RB','Dpad','View','B','Menu','non-play','blur','disconnect','poll-loss']){
    const f=buildFixture();f.run("ysc.vb='house';pad.index=0;saveG=()=>true;");
    f.c.run(button(3),button(3));assert.equal(f.c.state().shortcutHeld,true);
    const key={RT:7,LB:4,RB:5,Dpad:12,View:8,B:1}[interruption];
    if(key!==undefined){
      if(interruption==='Dpad')f.run("qsel('idle');"); // Also covers context changes initiated outside the held-Y handler.
      else f.c.run(button(key),Object.assign(button(3),{[key]:true}));
    }
    if(interruption==='Menu')f.run('E=[];E[9]=true;P=[];P[3]=true;RE=[];ctl(0);');
    if(interruption==='non-play')f.run("mode='obj';E=[];P=[];P[3]=true;RE=[];ctl(0);");
    if(interruption==='blur')f.c.fireEvent('blur');
    if(interruption==='disconnect')f.c.fireEvent('gamepaddisconnected',{gamepad:{index:0}});
    if(interruption==='poll-loss')f.run('pad=null;E=[];P=[];RE=[];ctl(0);');
    assert.equal(f.c.state().shortcutHeld,false,interruption);
    f.run("menu=cgo=null;ov=0;mode='play';");
    f.c.run(button(14),button(3));assert.equal(f.c.state().shortcut,'house',interruption);
    f.c.run([],[],button(3));assert.equal(f.state().place,null,interruption);
    assert.equal(f.state().wood,1000,interruption);assert.equal(f.state().queued,0,interruption);
    f.run('S.sel=[worker];');farmShortcut(f.c);assert.equal(f.state().place?.k,'house',interruption+' allows a fresh shortcut press');
  }
});

test('Y pressed inside an RT wheel cannot become a build shortcut after the wheel closes',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(7),button(7));
  f.c.run(button(3),Object.assign(button(7),{3:true}));
  f.c.run([],button(3),button(7));
  f.c.run([],[],button(3));
  assert.equal(f.state().place,null);assert.equal(f.state().wood,1000);
});

test('controller replacement while Y is held cannot train on release; a fresh LT+Y still trains five',()=>{
  const f=buildFixture();
  f.run(`
    const town={netId:'town',k:'tc',t:0,hp:100,done:true,q:[],x:4,y:4,s:3};S.bs=[town];S.sel=[town];
    pad.id='old';pad.index=0;pad.connected=true;
  `);
  f.c.run(button(3),button(3));
  f.run(`
    globalThis.replacement={id:'new',index:1,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===3,value:i===3?1:0}))};
    navigator.getGamepads=()=>[replacement];readPad();playCtl(0);
    replacement.buttons[3]={pressed:false,value:0};readPad();playCtl(0);
  `);
  assert.equal(f.state().queued,0);assert.equal(f.state().food,1000);
  f.c.run(button(3),Object.assign(button(3),{6:true}));f.c.run([],button(6),button(3));
  assert.equal(f.state().queued,5);assert.equal(f.state().food,750);
});

test('hold Y plus D-pad Left changes a shortcut without executing it on release',()=>{
  const f=buildFixture();f.run("ysc.vb='house';");
  f.c.run(button(3),button(3));f.c.run(button(14),button(3));
  assert.equal(f.c.state().shortcut,'farm');
  f.c.run([],[],button(3));assert.equal(f.state().place,null);assert.equal(f.state().wood,1000);
});
