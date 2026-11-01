import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const sim=readFileSync(new URL('../js/simulation-unit-behaviour.js',import.meta.url),'utf8');
const resource=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const {U,B}=vm.runInNewContext(config+'\n;({U,B})');
const begin=resource.indexOf('function farmAvailableTo(u,n){');
const end=resource.indexOf('\nfunction dropoffKey(',begin);
assert.ok(begin>=0&&end>begin,'resource selection logic must remain executable');

function selector(nodes){
 const S={nodes,wt:new Uint8Array(32*32),g:new Uint8Array(32*32),ex:new Uint8Array(32*32).fill(1),us:[]};
 const fn=vm.runInNewContext(resource.slice(begin,end)+'\n;findNode;',{S,W:32,H:32});
 return {S,findNode:fn};
}
test('fish ships are naval units made at docks, not land villagers',()=>{
 assert.ok(U.fish?.sh,'fishing ships must be marked as watercraft');
 assert.ok(B.dock?.tr?.includes('fish'),'docks must offer fishing ship training');
});

test('land resource gathering and fishing select separate resource habitats',()=>{
 const land={k:'w',x:5,y:5,amt:100,fi:0},
  fish={k:'f',x:5,y:7,amt:100,fi:1},
  trap={k:'f',x:7,y:7,amt:900,fi:1,trap:1,t:0};
 const h=selector([land,fish,trap]);
 const worker={k:'vil',t:0,x:4,y:5,sh:false};
 const boat={k:'fish',t:0,x:5,y:6,sh:true};
 assert.equal(h.findNode(worker,'w',10),land);
 assert.equal(h.findNode(worker,'f',10),null,'land villagers must not try fishing sea nodes');
 assert.equal(h.findNode(boat,'f',10),fish);
 assert.equal(h.findNode(boat,'w',10),null,'boats must not gather tree resources');
});

test('boats cannot collect from other kingdoms fish traps',()=>{
 const theirs={k:'f',x:6,y:6,amt:900,fi:1,trap:1,t:1};
 const ours={k:'f',x:7,y:6,amt:900,fi:1,trap:1,t:0};
 const h=selector([theirs,ours]);
 assert.equal(h.findNode({k:'fish',t:0,x:6,y:5,sh:true},'f',10),ours);
});

test('fishing delivery, carrying upgrades and AI idle orders retain their gameplay paths',()=>{
 assert.match(sim,/u\.car>=gatherCapacity\(u\)/,'resource gathering must use researched carry capacity');
 assert.match(sim,/S\.res\[u\.t\]\[u\.ct\]\+=u\.car/,'delivered resources belong to the correct player');
 assert.match(resource,/u\.sh\?q\.k==='dock':q\.k==='tc'/,'ships use Docks rather than land resource depots');
 assert.match(ai,/queuedUnits\('fish'\)/,'AI fishing cap must account for ships in training');
 assert.match(ai,/for\(const s of fish\.filter\(u=>u\.o==='i'&&S\.t>=Math\.max\(u\.fleeUntil\|\|0,u\.nextFishingRoute\|\|0\)\)\)/,
  'idle AI fishing ships may retry after flee and routing cooldowns');
});
