import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
function create(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);vm.runInContext(source+'\n'+
  readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+
  '\n;globalThis.run=code=>eval(code)',sandbox);
 return sandbox.run;
}
test('distinct Elite equipment requires the owning civilization and researched tier',()=>{
 const run=create();
 run('start();S.civ=[18,1];S.tech=[{},{}]');
 for(const k of ['huskarl','lbow','mgd'])assert.equal(run("drawEliteUniqueUnitMark(X,'"+k+"',0,10,10,1)"),false);
 run('S.tech[0].eliteHuskarl=1');
 assert.equal(run("drawEliteUniqueUnitMark(X,'huskarl',0,10,10,1)"),true);
 assert.equal(run("drawEliteUniqueUnitMark(X,'huskarl',1,10,10,1)"),false);
 run('S.civ[0]=1;S.tech[0]={eliteLongbowman:1}');
 assert.equal(run("drawEliteUniqueUnitMark(X,'lbow',0,10,10,1)"),true);
 assert.equal(run("drawEliteUniqueUnitMark(X,'huskarl',0,10,10,1)"),false);
 run('S.civ[0]=2;S.tech[0]={eliteMangudai:1}');
 assert.equal(run("drawEliteUniqueUnitMark(X,'mgd',0,10,10,1)"),true);
 assert.equal(run("drawEliteUniqueUnitMark(X,'lbow',0,10,10,1)"),false);
 assert.equal(run("drawEliteUniqueUnitMark(X,'mil',0,10,10,1)"),false);
});
test('Elite paint does not mutate simulation or random state',()=>{
 const run=create();
 run('start();S.civ=[18,1];S.tech=[{eliteHuskarl:1},{}]');
 const before=run('JSON.stringify([S.tech,S.res,S.us,S.bs,S.t,S.r?.state?.()])');
 for(let i=0;i<3;i++)assert.equal(run("drawEliteUniqueUnitMark(X,'huskarl',0,150,150,1)"),true);
 assert.equal(run('JSON.stringify([S.tech,S.res,S.us,S.bs,S.t,S.r?.state?.()])'),before);
});
test('real painted/fallback troop paint invokes Elite accents in regular and sprite-only passes',()=>{
 const run=create();
 run("start();S.civ=[18,1];S.tech=[{eliteHuskarl:1},{}];globalThis.husk=addU(0,'huskarl',20,20);globalThis.marks=[]");
 run("const old=drawEliteUniqueUnitMark;drawEliteUniqueUnitMark=function(...a){marks.push([a[1],a[2]]);return old(...a)}");
 run('drawUnit(husk,new Set())');
 assert.deepEqual(JSON.parse(run('JSON.stringify(marks)')),[['huskarl',0]]);
 run('marks=[];perfUnitPass=1;drawUnit(husk,new Set());perfUnitPass=0');
 assert.deepEqual(JSON.parse(run('JSON.stringify(marks)')),[['huskarl',0]]);
});
