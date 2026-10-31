import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function match(player,opponent,seed=123456){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+`
  seedOv=${seed};msz=0;mt=0;kingdoms=2;cmp=null;
  startAge=0;startRes=0;startArmy=0;startVillagers=1;
  civ=${player};aiCiv=${opponent};start();snd=0;
 `,sandbox);
 return expr=>vm.runInContext(expr,sandbox);
}

test('initial Indian villagers and Byzantine Town Centre receive civilization health from game start',()=>{
 const run=match(13,3);
 assert.equal(run('S.civ[0]'),13);
 assert.equal(run('S.civ[1]'),3);
 assert.ok(run("S.us.filter(u=>u.t===0&&u.k==='vil').length")>=3);
 assert.equal(run("S.us.filter(u=>u.t===0&&u.k==='vil').every(u=>u.hp===U.vil.hp+10)"),true);
 assert.equal(run("S.bs.find(b=>b.t===1&&b.k==='tc').mh"),Math.round(run('B.tc.hp')*1.15));
 assert.equal(run("S.bs.find(b=>b.t===1&&b.k==='tc').hp"),Math.round(run('B.tc.hp')*1.15));
 assert.equal(run("S.bs.find(b=>b.t===0&&b.k==='tc').hp"),run('B.tc.hp'));
});

test('new production inherits bonuses once; initial entities are not doubled',()=>{
 const run=match(13,3);
 const before=run("S.us.filter(u=>u.t===0&&u.k==='vil').map(u=>u.hp).join(',')");
 assert.equal(run("addU(0,'vil',12,12).hp"),run('U.vil.hp')+10);
 assert.equal(run("S.us.filter(u=>u.t===0&&u.k==='vil').slice(0,-1).map(u=>u.hp).join(',')"),before);
 assert.equal(run("addB(1,'house',40,40,true).hp"),Math.round(run('B.house.hp')*1.15));
 assert.equal(run("S.bs.find(b=>b.t===1&&b.k==='tc').mh"),Math.round(run('B.tc.hp')*1.15));
});

test('civilizations without starting HP modifiers keep baseline health and seeded creation is repeatable',()=>{
 const first=match(0,1),second=match(0,1);
 assert.equal(first("S.us.filter(u=>u.t===0&&u.k==='vil').every(u=>u.hp===U.vil.hp)"),true);
 assert.equal(first("S.bs.filter(b=>b.k==='tc').every(b=>b.hp===B.tc.hp)"),true);
 assert.equal(first("S.r.state()"),second("S.r.state()"));
 assert.equal(first("S.us.map(u=>[u.netId,u.t,u.k,u.hp]).join(';')"),second("S.us.map(u=>[u.netId,u.t,u.k,u.hp]).join(';')"));
});
