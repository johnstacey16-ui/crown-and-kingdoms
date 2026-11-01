import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const movement=readFileSync(new URL('../js/simulation-separation.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const {U,TE,GR,CAP}=vm.runInNewContext(config+'\n;({U,TE,GR,CAP})');
const start=routing.indexOf('function resourceGatherRate(n){');
const end=routing.indexOf('function farmAvailableTo(u,n){',start);
const speedStart=movement.indexOf('function unitSpeed(u){');
const speedEnd=movement.indexOf('const mv=(u,dx,dy)=>',speedStart);
assert.ok(start>=0&&end>start&&speedStart>=0&&speedEnd>speedStart);
const S={tech:[{},{wheel:1},{wheel:1,handcart:1}]};
const api=vm.runInNewContext(routing.slice(start,end)+'\n'+movement.slice(speedStart,speedEnd)+'\n;({baseGatherRate,unitSpeed,gatherCapacity})',{
 U,TE,GR,CAP,S,CAVARM:new Set(),INFARM:new Set()
});
const villager={k:'vil',t:0};
test('AoE2 DE base villager cost, speed, creation, and cart tech durations',()=>{
 assert.equal(U.vil.cost.f,50);assert.equal(U.vil.sp,.8);assert.equal(U.vil.t,25);
 assert.equal(TE.wheel.t,75);assert.equal(TE.handcart.t,55);
 assert.equal(api.unitSpeed(villager),.8);
 assert.ok(Math.abs(api.unitSpeed({...villager,t:1})-.88)<1e-9);
 assert.ok(Math.abs(api.unitSpeed({...villager,t:2})-.96)<1e-9);
});
test('AoE2 DE villager land resource gather rates',()=>{
 for(const [k,flags,rate] of [
  ['w',{},.39],['g',{},.38],['s',{},.36],
  ['f',{},.31],['f',{fm:1},.32],['f',{an:1},.41]
 ])assert.equal(api.baseGatherRate(villager,{k,...flags}),rate);
 assert.equal(api.baseGatherRate({k:'fish',t:0},{k:'f',fi:1}),.43,'ship fishing has the source-pinned sea gathering rate');
});
test('DE villager Wheelbarrow and Hand Cart carrying progression stays 10, 13, 20',()=>{
 assert.equal(api.gatherCapacity(villager),10);
 assert.equal(api.gatherCapacity({...villager,t:1}),13);
 assert.equal(api.gatherCapacity({...villager,t:2}),20);
});
