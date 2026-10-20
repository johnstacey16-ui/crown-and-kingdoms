import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { headlessGame } from './helpers/headless-game.mjs';

function fixture() {
  const {source,sandbox}=headlessGame();
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  vm.runInContext(`
    mode='play';S={us:[],bs:[],sel:[],vp:createVillagerPriority()};
    pad={axes:[0,0,0,0],buttons:[]};
    clampCam=()=>{};
    cur={x:100,y:100};
    globalThis.orders=0;orderSel=()=>{globalThis.orders++;return true;};
    globalThis.run=(edges=[],held=[],released=[])=>{E=edges;P=held;RE=released;playCtl(0);};
    globalThis.state=()=>({selection:S.sel.map(e=>e.netId),automation:S.vp.enabled,zoom:zm,
      groups:(S.cg||[]).map(g=>g.map(e=>e.netId)),radial:cgo?.sel??null,camera:{...cam},formation:fm});
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
    S.bs=[{netId:'town',t:0,k:'tc',hp:100,x:7,y:7,s:3,q:[]}];
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
