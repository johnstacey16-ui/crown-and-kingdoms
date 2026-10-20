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
    globalThis.state=()=>({selection:S.sel.map(e=>e.netId),automation:S.vp.enabled,zoom:zm});
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
