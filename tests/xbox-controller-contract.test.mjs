import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

function fixture() {
  const {source,sandbox}=headlessGame();
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
      overview:ov,filter:mmF,mapMode:mmM,flare:S.flare});
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
    globalThis.buildState=()=>JSON.stringify({place:place&&{...place},wood:S.res[0].w,
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
