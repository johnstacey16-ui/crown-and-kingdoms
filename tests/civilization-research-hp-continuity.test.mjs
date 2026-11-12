import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const cases = [
 [2,'ut2',{mgd:30}], [4,'ut4',{ele:40,eled:30}],
 [6,'ut6',{ram:60,mang:28,scor:20,bomb:32}],
 [8,'ut8',{camel:20,mamel:20}], [14,'ut14',{vil:40}],
 [15,'ut15',{genoa:15}], [16,'ut16',{boyar:40,knight:10}],
 [17,'ut17',{tarkan:20}], [20,'ut20p',{eagle:40}],
 [21,'ut21',{kamayuk:15}], [22,'ut22',{shotel:10}],
 [23,'ut23',{gbeto:10}], [25,'ut25',{huszar:20}]
];
for(const [id,key,bonuses] of cases)test(`${key}: paid research preserves wounds on existing troops and applies once to future troops`,()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 const run=sandbox.run;
 run(`kingdoms=2;startAge=3;startRes=3;start();S.civ=[${id},0];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[];
 globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:4800,mh:4800,done:true,q:[],rs:null,cd:999};S.bs.push(castle);`);
 for(const kind of Object.keys(bonuses))run(`
 S.us.push({k:'${kind}',t:0,hp:U['${kind}'].hp-7,x:10,y:10});
 S.us.push({k:'${kind}',t:0,hp:U['${kind}'].hp-3,x:10,y:10,ld:castle});
 S.us.push({k:'${kind}',t:0,hp:0,x:10,y:10});
 S.us.push({k:'${kind}',t:1,hp:U['${kind}'].hp,x:11,y:11});`);
 assert.equal(run(`research(castle,'${key}')`),true);
 run(`upB(castle,TE['${key}'].t+1)`);
 for(const [kind,bonus] of Object.entries(bonuses)){
  assert.equal(run(`S.tech[0].hpb['${kind}']`),bonus,kind+' ledger');
  assert.equal(run(`S.us.find(u=>u.k==='${kind}'&&u.t===0&&!u.ld).hp`),run(`U['${kind}'].hp`)+bonus-7,kind+' retains wound');
  assert.equal(run(`S.us.find(u=>u.k==='${kind}'&&u.ld).hp`),run(`U['${kind}'].hp`)+bonus-3,kind+' garrison');
  assert.equal(run(`S.us.filter(u=>u.k==='${kind}'&&u.hp===0).length`),1,'no resurrection');
  assert.equal(run(`S.us.find(u=>u.k==='${kind}'&&u.t===1).hp`),run(`U['${kind}'].hp`),'enemy unchanged');
  assert.equal(run(`addU(0,'${kind}',12,12).hp`),run(`U['${kind}'].hp`)+bonus,'future unit');
 }
 const ledger=run('JSON.stringify(S.tech[0])');
 assert.equal(run(`research(castle,'${key}')`),false);
 run('upB(castle,1)');assert.equal(run('JSON.stringify(S.tech[0])'),ledger);
});

test('completed unique HP research and an in-flight research survive save/load without replaying effects',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 const run=sandbox.run;
 run("kingdoms=2;startAge=3;startRes=3;civ=2;start();S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};globalThis.castle=addB(0,'castle',20,20,true);globalThis.hero=addU(0,'mgd',25,25);hero.hp-=7");
 assert.equal(run("research(castle,'ut2')"),true);
 const id=run('hero.netId');
 assert.equal(run("saveG(false,'ck_unique_hp')"),true);
 assert.equal(run("loadG(false,'ck_unique_hp')"),true);
 run("globalThis.castle=S.bs.find(b=>b.t===0&&b.k==='castle');upB(castle,TE.ut2.t+1)");
 const expected=run('U.mgd.hp+30-7');
 assert.equal(run(`S.us.find(u=>u.netId==='${id}').hp`),expected);
 const ledger=run('JSON.stringify(S.tech[0])');
 assert.equal(run("saveG(false,'ck_unique_hp')"),true);
 assert.equal(run("loadG(false,'ck_unique_hp')"),true);
 assert.equal(run('JSON.stringify(S.tech[0])'),ledger);
 assert.equal(run(`S.us.find(u=>u.netId==='${id}').hp`),expected);
 assert.equal(run("addU(0,'mgd',26,26).hp"),run('U.mgd.hp+30'));
});
