import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox,storage}=headlessGame();vm.createContext(sandbox);
 const network=['network-sync','network-commands'].map(k=>readFileSync(new URL('../js/'+k+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+network+`\nseedOv=123456;msz=0;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();snd=0;S.civ=[0,1];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));S.tech=[{},{}];globalThis.castles=[addB(0,'castle',20,20,true),addB(1,'castle',30,20,true)];globalThis.run=code=>eval(code);`,sandbox);
 return {run:sandbox.run,storage};
}

test('every implemented civilization can train its own castle unit and research its unique technology',()=>{
 const {run}=fixture();
 for(let c=0;c<run('CIV.length');c++){
  run(`S.civ[0]=${c};S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};castles[0].q=[];castles[0].rs=null;S.us=[]`);
  const budget=run('JSON.stringify(S.res[0])');
  assert.equal(run('train(castles[0],CIV[S.civ[0]].uu)'),true,'unit for civilization '+c);
  assert.equal(run('cancelQ(castles[0])'),true);
  assert.equal(run('JSON.stringify(S.res[0])'),budget,'cancellation refunds the correct unit');
  const before=run('JSON.stringify(S.res[0])');
  assert.equal(run('research(castles[0],CIV[S.civ[0]].ut.k)'),true,'technology for civilization '+c);
  assert.notEqual(run('JSON.stringify(S.res[0])'),before);
  run('upB(castles[0],CIV[S.civ[0]].ut.t)');
  assert.equal(run('S.tech[0][CIV[S.civ[0]].ut.k]'),1);
  assert.equal(run('train(castles[0],CIV[S.civ[0]].uu)'),true);
  run('upB(castles[0],U[CIV[S.civ[0]].uu].t)');
  assert.equal(run('S.us.length'),1);assert.equal(run('S.us[0].k'),run('CIV[S.civ[0]].uu'));
 }
});

test('foreign unique units and technologies are rejected without spending; correct queues survive reload',()=>{
 const {run}=fixture();
 const before=run('JSON.stringify(S.res)');
 assert.equal(run("train(castles[0],'lbow')"),false);
 assert.equal(run("research(castles[0],'ut1')"),false);
 assert.equal(run('JSON.stringify(S.res)'),before);
 assert.equal(run("train(castles[0],'axe')"),true);
 assert.equal(run("research(castles[1],'ut1')"),true);
 run('castles[0].q[0].t=0;castles[1].rs.t=0;slot=0');
 assert.equal(run('saveG()'),true);const saved=run('localStorage.getItem(skey(0))');
 run('S.civ=[1,0]'); // Restoration must use the saved kingdoms, not the current game.
 assert.equal(run('loadG()'),true);
 assert.equal(run("S.bs.find(b=>b.t===0).q[0].k"),'axe');
 assert.equal(run("S.bs.find(b=>b.t===1).rs.k"),'ut1');
 run('upB(S.bs.find(b=>b.t===0),1);upB(S.bs.find(b=>b.t===1),1)');
 assert.equal(run("S.us.filter(u=>u.t===0&&u.k==='axe').length"),1);
 assert.equal(run('S.tech[1].ut1'),1);
 const bad=JSON.parse(saved);bad.bs[0].q[0].k='lbow';run('localStorage.setItem(skey(0),'+JSON.stringify(JSON.stringify(bad))+')');
 const state=run('S');assert.equal(run('loadG()'),false);assert.equal(run('S'),state,'invalid save leaves live world intact');
 const foreignTech=JSON.parse(saved);foreignTech.bs[1].rs.k='ut0';
 run('localStorage.setItem(skey(0),'+JSON.stringify(JSON.stringify(foreignTech))+')');
 assert.equal(run('loadG()'),false);assert.equal(run('S'),state);
 for(const civ of [null,'Franks',[0],[0,'constructor'],[0,-1],[0,999]]){
  const corrupt=JSON.parse(saved);corrupt.civ=civ;
  run('localStorage.setItem(skey(0),'+JSON.stringify(JSON.stringify(corrupt))+')');
  assert.equal(run('loadG()'),false);assert.equal(run('S'),state);
 }
 const legacy=JSON.parse(saved);delete legacy.civ;
 run('localStorage.setItem(skey(0),'+JSON.stringify(JSON.stringify(legacy))+')');
 assert.equal(run('loadG()'),true,'legacy saves retain their default civilisation mapping');
});

test('authenticated castle menus and commands use the owning kingdom catalogue',()=>{
 const {run}=fixture();
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,castles[0]).some(o=>o.type==='train'&&o.value==='axe')"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,1,castles[1]).some(o=>o.type==='research'&&o.value==='ut1')"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,1,castles[1]).some(o=>o.value==='axe'||o.value==='ut0')"),false);
 run(`globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute});globalThis.request=(seq,value)=>({v:CK_SIM_SYNC.VERSION,sid:'guest',team:1,seq,frame:6+seq*2,order:{type:'train',entities:[castles[1].netId],value}})`);
 assert.equal(run("host.receive(request(1,'lbow'),'guest',2).ok"),true);
 assert.equal(run('host.applyFrame(8)[0].ok'),true);
 const paid=run('JSON.stringify(S.res)');
 assert.equal(run("host.receive(request(2,'axe'),'guest',2).ok"),true);
 assert.equal(run('host.applyFrame(10)[0].ok'),false);
 assert.equal(run('JSON.stringify(S.res)'),paid);
 assert.equal(run("castles[1].q[0].k"),'lbow');
 run(`globalThis.cancelPacket={v:CK_SIM_SYNC.VERSION,sid:'guest',team:1,seq:3,frame:12,order:{type:'cancel',entities:[castles[1].netId]}};globalThis.techPacket={v:CK_SIM_SYNC.VERSION,sid:'guest',team:1,seq:4,frame:14,order:{type:'research',entities:[castles[1].netId],value:'ut1'}}`);
 assert.equal(run("host.receive(cancelPacket,'guest',2).ok"),true);
 assert.equal(run('host.applyFrame(12)[0].ok'),true);
 assert.equal(run("host.receive(techPacket,'guest',2).ok"),true);
 assert.equal(run('host.applyFrame(14)[0].ok'),true);
 assert.equal(run('castles[1].rs.k'),'ut1');
});

test('Goths research Anarchy and Perfusion as distinct Castle technologies with live Barracks effects',()=>{
 const {run}=fixture();
 run("S.civ=[18,1];S.age=[3,3];S.tech=[{},{}];S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.barracks=[addB(0,'bar',44,20,true),addB(1,'bar',52,20,true)]");
 assert.equal(run("trOf(barracks[0]).includes('huskarl')"),false);
 assert.equal(run("trOf(barracks[1]).includes('huskarl')"),false);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,castles[0]).some(o=>o.type==='research'&&o.value==='ut18p')"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,1,castles[1]).some(o=>o.value==='ut18p')"),false);
 const otherBudget=run('JSON.stringify(S.res[1])');
 assert.equal(run("research(castles[1],'ut18p')"),false);
 assert.equal(run('JSON.stringify(S.res[1])'),otherBudget);
 run("S.age[0]=2");
 assert.equal(run("research(castles[0],'ut18p')"),false,'Perfusion requires Imperial Age');
 run("S.age[0]=3");
 assert.equal(run("research(castles[0],'ut18')"),true);
 run("upB(castles[0],TE.ut18.t)");
 assert.equal(run('S.tech[0].ut18'),1);
 assert.equal(run("trOf(barracks[0]).includes('huskarl')"),true,'Anarchy unlocks Barracks Huskarls');
 assert.equal(run("train(barracks[0],'huskarl')"),true);
 assert.equal(run("train(barracks[1],'huskarl')"),false);
 const before=run("S.us.filter(u=>u.k==='huskarl'&&u.t===0).length");
 run("upB(barracks[0],U.huskarl.t)");
 assert.equal(run("S.us.filter(u=>u.k==='huskarl'&&u.t===0).length"),before+1);
 assert.equal(run("research(castles[0],'ut18p')"),true);
 run("upB(castles[0],TE.ut18p.t)");
 assert.equal(run('S.tech[0].perfusion'),1);
 assert.equal(run("trainRate(barracks[0],'mil')"),2,'Perfusion doubles Barracks unit training');
 assert.equal(run("trainRate(barracks[1],'mil')"),1,'enemy Barracks remain unchanged');
 run("S.tech[0].cons=1");
 assert.equal(run("trainRate(barracks[0],'mil')"),8/3,'Conscription still stacks');
 run("S.tech[0].cons=0;research(barracks[0],'man');research(barracks[1],'man')");
 assert.equal(run("barracks[0].rs.k"),'man');
 assert.equal(run("barracks[1].rs.k"),'man');
 run("upB(barracks[0],10);upB(barracks[1],10)");
 assert.equal(run("barracks[0].rs.t"),run('TE.man.t')-20,'Goth research completes twice as fast');
 assert.equal(run("barracks[1].rs.t"),run('TE.man.t')-10,'enemy research has normal speed');
 assert.equal(run('saveG()'),true);
 assert.equal(run('loadG()'),true);
 assert.equal(run('S.tech[0].perfusion'),1,'current-build save restores Perfusion');
 assert.equal(run("trOf(S.bs.find(b=>b.k==='bar'&&b.t===0)).includes('huskarl')"),true);
 assert.equal(run("trainRate(S.bs.find(b=>b.k==='bar'&&b.t===0),'mil')"),2);
});
