import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.runTeamBonus=code=>eval(code);',sandbox);
 const run=sandbox.runTeamBonus;
 run("kingdoms=3;startAge=3;startRes=3;start();S.civ=[0,0,0];S.age=[3,3,3];S.tech=[{},{},{}];S.dip=createDiplomacy(3);S.us=[];S.bs=[];S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.range={k:'rng',t:0,x:16,y:16,s:2,hp:500,mh:500,done:true,q:[],rs:null};S.bs.push(range)");
 return run;
}
function close(actual,expected,label){
 assert.ok(Math.abs(actual-expected)<1e-8,label+': expected '+expected+', got '+actual);
}

test('seven declarative team bonuses affect their own production or research buildings',()=>{
 const run=fixture();
 for(const [civ,building,mode,expected] of [
  [1,'rng','train',1.1],
  [6,'siege','train',1.2],
  [17,'stable','train',1.2],
  [18,'bar','train',1.2],
  [32,'monastery','train',1.2],
  [23,'univ','research',1.8],
  [26,'rng','research',1.25]
 ]){
  run('S.civ[0]='+civ+';S.tech[0]={}');
  const value=run("civilizationTeamWorkRate({k:'"+building+"',t:0},'"+mode+"','xbow')");
  close(value,expected,'civilization '+civ+' '+building+' '+mode);
  const wrong=run("civilizationTeamWorkRate({k:'tc',t:0},'train',null)");
  close(wrong,1,'unrelated Town Centre');
 }
 close(run("civilizationTeamWorkRate({k:'tc',t:0},'research','age')"),1,'age advances are excluded');
});

test('alliances grant dynamic team bonuses without duplicate same-civilization stacking',()=>{
 const run=fixture();
 run('S.civ=[0,1,1]');
 close(run("trainRate(range,'arc')"),1,'no allied civilization');
 assert.equal(run("setDiplomacy(0,1,'ally')"),true);
 close(run("trainRate(range,'arc')"),1.1,'one allied Briton');
 assert.equal(run("setDiplomacy(0,2,'ally')"),true);
 close(run("trainRate(range,'arc')"),1.1,'two allied Britons do not stack');
 run('S.civ[2]=26');
 close(run("trainRate(range,'arc')"),1.1,'Portuguese bonus does not speed unit training');
 close(run("civilizationTeamWorkRate(range,'research','xbow')"),1.1*1.25,'different bonuses combine on research');
 assert.equal(run("setDiplomacy(0,1,'neutral')"),true);
 close(run("civilizationTeamWorkRate(range,'research','xbow')"),1.25,'neutral team loses Briton bonus');
 assert.equal(run("setDiplomacy(0,2,'enemy')"),true);
 close(run("civilizationTeamWorkRate(range,'research','xbow')"),1,'hostile team loses Portuguese bonus');
});

test('live building ticks consume training and research queues at allied rates',()=>{
 const run=fixture();
 run('S.civ=[1,26,0];S.dip=createDiplomacy(3)');
 const trained=run("range.q=[{k:'arc',t:20}];upB(range,1);range.q[0].t");
 close(trained,18.9,'Briton training duration decreases by 1.1');
 run("range.q=[];range.rs={k:'xbow',t:20};upB(range,1)");
 close(run('range.rs.t'),18.9,'Briton research advances by 1.1');
 assert.equal(run("setDiplomacy(0,1,'ally')"),true);
 run('upB(range,1)');
 close(run('range.rs.t'),18.9-1.375,'allied Portuguese research bonus applies next tick');
 run('range.rs=null;range.q=[];S.tech[0].cons=1');
 close(run("trainRate(range,'arc')"),1.1*4/3,'Conscription still stacks with team training speed');
});

test('Portuguese team research applies to ordinary technologies, never age advances',()=>{
 const run=fixture();
 run("S.civ=[26,0,0];globalThis.tc={k:'tc',t:0,x:25,y:25,s:3,hp:1000,mh:1000,done:true,q:[],rs:{k:'age',t:20}};S.bs.push(tc)");
 run('upB(tc,1)');
 close(run('tc.rs.t'),19,'Portuguese Age advance remains standard speed');
 run("tc.rs={k:'loom',t:20};upB(tc,1)");
 close(run('tc.rs.t'),18.75,'Portuguese ordinary technology researched 25% faster');
 run("S.civ[0]=0;tc.rs={k:'loom',t:20};upB(tc,1)");
 close(run('tc.rs.t'),19,'research bonus disappears for a different civilization');
});
