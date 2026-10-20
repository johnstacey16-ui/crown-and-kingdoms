import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source,sandbox);
 vm.runInContext(`
  mode='play';popLimit=200;pad={axes:[0,0,0,0],buttons:[]};clampCam=()=>{};
  S={us:[],bs:[],sel:[],age:[3,3],tech:[{},{}],civ:[0,0],
    res:[{f:2000,w:2000,g:2000,s:2000},{f:2000,w:2000,g:2000,s:2000}]};
  const a={netId:'a',k:'tc',t:0,hp:100,done:true,q:[],x:8,y:8,s:3};
  const b={netId:'b',k:'tc',t:0,hp:100,done:true,q:[],x:18,y:18,s:3};
  S.bs=[a,b];S.sel=[a,b];
  globalThis.invoke=(route,batch=false)=>{
    E=[];RE=[];P=[];P[6]=batch;
    if(route==='shortcut'){
      E[3]=true;P[3]=true;playCtl(0);
      E=[];P[3]=false;RE[3]=true;playCtl(0);
    }else{
      openMenu();menu.rad=1;E[0]=true;
      menu.i=menu.items.findIndex(it=>it.l===unitName('vil',0));playCtl(0);menu=null;
    }
  };
  globalThis.snapshot=()=>JSON.stringify({queues:S.bs.map(b=>b.q.length),food:S.res.map(r=>r.f),selection:S.sel.map(b=>b.netId)});
 `,sandbox);
 return {context:sandbox,run:code=>vm.runInContext(code,sandbox),state:()=>JSON.parse(sandbox.snapshot())};
}

for(const route of ['shortcut','wheel']){
 test(route+' training balances paid single and LT five-unit batches across selected town centres',()=>{
  const f=fixture();
  f.context.invoke(route);assert.deepEqual(f.state().queues,[1,0]);
  f.context.invoke(route);assert.deepEqual(f.state().queues,[1,1]);
  f.context.invoke(route,true);assert.deepEqual(f.state().queues,[4,3]);
  assert.deepEqual(f.state().food,[1650,2000]);
  assert.deepEqual(f.state().selection,['a','b'],'sorting production must not reorder selection');
 });
 test(route+' batch stops at resource and shared population limits without charging rejected units',()=>{
  const f=fixture();f.run('S.res[0].f=125;');
  f.context.invoke(route,true);assert.deepEqual(f.state().queues,[1,1]);assert.equal(f.state().food[0],25);
  f.run("S.res[0].f=2000;S.us=Array.from({length:6},()=>({t:0,k:'vil',hp:25}));");
  f.context.invoke(route,true);assert.deepEqual(f.state().queues,[2,2]);assert.equal(f.state().food[0],1900);
 });
}

test('balancing favours the shortest queue and skips full, researching and ineligible buildings',()=>{
 const f=fixture();
 f.run("a.q=Array.from({length:5},()=>({k:'vil',t:25}));");
 f.context.invoke('wheel',true);assert.deepEqual(f.state().queues,[5,5]);
 assert.equal(f.state().food[0],1750);
 const g=fixture();
 g.run(`
  a.rs={k:'loom',t:10};
  const extras=[{...a,netId:'enemy',t:1,rs:null,q:[]},
    {...a,netId:'dead',hp:0,rs:null,q:[]},
    {...a,netId:'unfinished',done:false,rs:null,q:[]},
    {...a,netId:'wrong-kind',k:'bar',rs:null,q:[]}];
  S.bs.push(...extras);S.sel.push(...extras,b);
 `);
 g.context.invoke('shortcut',true);
 assert.deepEqual(g.state().queues,[0,5,0,0,0,0]);assert.deepEqual(g.state().food,[1750,2000]);
});

test('unselected buildings, stale menu anchors and non-play modes cannot receive grouped production',()=>{
 const f=fixture();f.run('S.sel=[a];');
 f.context.invoke('shortcut',true);assert.deepEqual(f.state().queues,[5,0]);
 const g=fixture();
 assert.equal(g.run("S.sel=[b];trainSelection(a,'vil',5)"),0);
 assert.equal(g.run("S.sel=[a,b];S.bs=[b];trainSelection(a,'vil',5)"),0);
 assert.equal(g.run("S.bs=[a,b];mode='multiplayer';trainSelection(a,'vil',5)"),0);
 assert.deepEqual(g.state().queues,[0,0]);assert.deepEqual(g.state().food,[2000,2000]);
});

test('military command-wheel production spreads across matching selected buildings only',()=>{
 const f=fixture();
 f.run(`
  a.k=b.k='bar';
  const stable={...a,k:'stable',netId:'stable',q:[]};S.bs.push(stable);S.sel.push(stable);
  P=[];P[6]=true;openMenu();menu.items.find(it=>it.l===unitName('mil',0)).fn();
 `);
 assert.deepEqual(f.state().queues,[3,2,0]);
 assert.equal(f.state().food[0],f.run('2000-5*U.mil.cost.f'));
 assert.equal(f.run('S.res[0].g'),f.run('2000-5*U.mil.cost.g'));
});
