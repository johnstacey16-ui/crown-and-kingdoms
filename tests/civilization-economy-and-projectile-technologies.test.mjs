import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
function game(civ=13){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.runTest=code=>eval(code);',sandbox);
 const run=sandbox.runTest;
 run("kingdoms=2;startAge=3;startRes=3;start();S.age=[3,3];S.civ=["+civ+",0];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[];S.rel=[];globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}
test('three civilization unique techs have paid research, age gates and foreign-command exclusion',()=>{
 const run=game();
 for(const [id,key,age] of [[13,'ut13p',2],[15,'ut15p',3],[17,'ut17p',3]]){
  run('S.civ[0]='+id+';S.age[0]=1;S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};castle.rs=null');
  const d=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  assert.equal(d.age,age);
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(key)+')'),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes("+JSON.stringify(key)+")"),false);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false);
  run('S.age[0]='+age);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),true);
  for(const [k,v] of Object.entries(d.cost))assert.equal(run('S.res[0]['+JSON.stringify(k)+']'),10000-v);
  run('upB(castle,'+(d.t+.1)+')');
  assert.equal(run('S.tech[0]['+JSON.stringify(key)+']'),1);
 }
});
test('Indian Grand Trunk Road actually boosts trade trip cargo while leaving enemies unchanged',()=>{
 const run=game(13);
 assert.equal(run('tradeTripGold({t:0},100)'),35);
 assert.equal(run('tradeTripGold({t:0},NaN)'),0);
 run('S.tech[0].ut13p=1');
 assert.equal(run('tradeTripGold({t:0},100)'),39);
 assert.equal(run('tradeTripGold({t:1},100)'),35);
 run('S.civ[0]=0');
 assert.equal(run('tradeTripGold({t:0},100)'),35);
});
test('Italian Pirotechnia pierces a second hostile target but not friendlies or nearby flanks',()=>{
 const run=game(15);
 run("globalThis.first={k:'mil',t:1,x:12,y:12,hp:150,p:[]};globalThis.second={k:'mil',t:1,x:13,y:12,hp:150,p:[]};globalThis.friendly={k:'mil',t:0,x:13,y:12.2,hp:150,p:[]};globalThis.side={k:'mil',t:1,x:13,y:14,hp:150,p:[]};S.us=[first,second,friendly,side]");
 const fire=()=>run("(()=>{S.pj=[];first.hp=150;second.hp=150;friendly.hp=150;side.hp=150;launchProjectile({k:'hcan',t:0,x:9,y:12},first);pjs(1);return 150-second.hp})()");
 assert.equal(fire(),0);
 run('S.tech[0].ut15p=1');
 assert.equal(fire(),3);
 assert.equal(run('friendly.hp'),150);
 assert.equal(run('side.hp'),150);
 run('S.civ[0]=0');
 assert.equal(fire(),0);
});
test('Hunnic Atheism halves enemy relic gold from live Monastery updates',()=>{
 const run=game(17);
 run("globalThis.own={k:'monastery',t:0,x:24,y:22,s:3,hp:500,mh:500,done:true,pr:30,q:[],rs:null};globalThis.foe={k:'monastery',t:1,x:30,y:22,s:3,hp:500,mh:500,done:true,pr:30,q:[],rs:null};S.bs.push(own,foe);S.rel=[{m:own},{m:foe}];S.res[0].g=0;S.res[1].g=0");
 run('upB(own,1);upB(foe,1)');
 assert.equal(run('S.res[0].g'),.5);
 assert.equal(run('S.res[1].g'),.5);
 run('S.tech[0].ut17p=1;upB(own,1);upB(foe,1)');
 assert.equal(run('S.res[0].g'),1);
 assert.equal(run('S.res[1].g'),.75);
 run('S.civ[0]=0;upB(foe,1)');
 assert.equal(run('S.res[1].g'),1.25);
});
test('Pirotechnia flags persist in same-build save files',()=>{
 const run=game(15);
 run('S.tech[0].ut15p=1;S.tech[0].pirotechnia=1');
 assert.equal(run("saveG(false,'ck_civ_economy_batch')"),true);
 run('S.civ[0]=0;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_civ_economy_batch')"),true);
 assert.equal(run('S.tech[0].ut15p'),1);
 assert.equal(run('S.civ[0]'),15);
});
