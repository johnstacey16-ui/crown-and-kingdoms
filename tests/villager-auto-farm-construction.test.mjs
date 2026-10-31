import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(wood=120,networked=false){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 const setup=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;start();snd=0;mode="play";',
  'S.bs=[];S.us=[];S.nodes=[];S.g.fill(0);S.nd.fill(null);S.wt.fill(0);S.ex.fill(1);',
  'S.vp=createVillagerPriority({enabled:false,autoFarms:true,f:1,w:0,g:0,s:0});',
  'globalThis.tc=addB(0,"tc",15,15,true);',
  'globalThis.worker=addU(0,"vil",20,17);',
  'S.vp.enabled=true;',
  'S.res[0].w='+wood+';',
  'globalThis.readFarm=()=>({count:S.nodes.filter(n=>n.fm&&n.t===0).length,wood:S.res[0].w,',
  'workerTarget:worker.tg?.fm?1:0,workerOrder:worker.o,waiting:!!worker.autoFarmWaiting});',
  'globalThis.work=()=>assignAutoVillager(worker,true);',
  'globalThis.retry=()=>retryAutomaticFarmWorkers();',
  'globalThis.getState=()=>JSON.stringify([S.nodes.map(n=>[n.k,n.x,n.y,n.amt,n.t]),S.res[0]]);'
 ].join('\n');
 vm.runInContext(source+'\n'+setup,sandbox,{timeout:15000});
 if(networked)sandbox.CK_NET={isRunning:()=>true};
 return sandbox;
}
test('opted-in food worker creates one nearby farm and pays exactly 60 wood',()=>{
 const g=fixture();assert.equal(g.work(),true);
 const x=g.readFarm();assert.equal(x.count,1);assert.equal(x.wood,60);
 assert.equal(x.workerOrder,'g');assert.equal(x.workerTarget,1);
 assert.equal(g.work(),true);assert.equal(g.readFarm().count,1,'existing farm reused');
});
test('disabled farm toggle cannot create food nodes or spend wood',()=>{
 const g=fixture();
 vm.runInContext('S.vp.autoFarms=false',g);
 assert.equal(g.work(),false);assert.equal(g.readFarm().count,0);
 assert.equal(g.readFarm().wood,120);
});
test('missing completed TC/Mill prevents farm construction and expenditure',()=>{
 const g=fixture();vm.runInContext('tc.done=false',g);
 assert.equal(g.work(),false);assert.equal(g.readFarm().count,0);
 assert.equal(g.readFarm().wood,120);
});
test('insufficient wood causes auto-worker to collect nearby wood, then retry safely',()=>{
 const g=fixture(30);
 vm.runInContext("globalThis.timber=addN('w',22,17,300)",g);
 assert.equal(g.work(),true);
 let state=g.readFarm();
 assert.equal(state.count,0);assert.equal(state.wood,30);
 assert.equal(state.workerOrder,'g');assert.equal(state.waiting,true);
 vm.runInContext('S.res[0].w=90;worker.car=0',g);
 assert.equal(g.retry(),true);
 state=g.readFarm();assert.equal(state.count,1);assert.equal(state.wood,30);
 assert.equal(state.waiting,false);assert.equal(state.workerTarget,1);
});
test('failed placement and active authenticated matches cannot spend wood',()=>{
 const g=fixture(),before=g.getState();
 vm.runInContext('S.ex.fill(0)',g);
 assert.equal(g.work(),false);
 assert.equal(g.getState(),before,'failed visible-space search must not mutate world');
 const h=fixture(120,true);
 assert.equal(h.work(),false);assert.equal(h.readFarm().wood,120);
});
