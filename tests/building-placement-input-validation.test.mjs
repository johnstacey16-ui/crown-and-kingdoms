import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation-building-production.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function okPlace(t,k,x,y){');
const end = simulation.length;
assert.ok(start >= 0 && end > start, 'Placement validator must remain isolated');
const okPlace = simulation.slice(start, end);

assert.match(okPlace, /^function okPlace\(t,k,x,y\)\{if\(!S\|\|!B\[k\]\|\|!Number\.isInteger\(t\)\|\|!S\.tech\[t\]\|\|!Number\.isInteger\(x\)\|\|!Number\.isInteger\(y\)\)return false/,
  'Reject missing game state, invalid building/team and non-integer coordinates before reading dimensions');
assert.match(okPlace, /if\(x<1\|\|y<1\|\|x\+s>W-1\|\|y\+s>H-1\)return false/,
  'Keep map boundary checks');
assert.match(okPlace, /if\(S\.g\[n\]\|\|S\.wt\[n\]\|\|\(t===0&&!S\.ex\[n\]\)\)return false/,
  'Keep terrain, water and player exploration placement restrictions');

const W=16,H=16,N=W*H;
const S={tech:[{},{}],us:[],g:new Uint8Array(N),wt:new Uint8Array(N),
 nd:Array(N).fill(null),ex:new Uint8Array(N).fill(1)};
const B={house:{s:2},dock:{s:3,wat:1}};
const ctx=vm.createContext({S,B,W,H,vm:0});
vm.runInContext(okPlace,ctx);
const place=(team,kind,x,y)=>vm.runInContext('okPlace('+JSON.stringify(team)+','+JSON.stringify(kind)+','+JSON.stringify(x)+','+JSON.stringify(y)+')',ctx);
assert.equal(place(0,'house',5,5),true,'clear explored foundations permit construction');
for(const args of [[-1,'house',5,5],[2,'house',5,5],[0,'missing',5,5],[0,'house',5.5,5],
 [0,'house',5,NaN],[0,'house',0,5],[0,'house',15,5]])
 assert.equal(place(...args),false,'invalid placement safely rejected: '+args);
S.us.push({hp:25,ld:null,x:5.5,y:5.5,t:1});
assert.equal(place(0,'house',5,5),false,'even enemy troops cannot be trapped under a foundation');
S.us[0].ld={};
assert.equal(place(0,'house',5,5),true,'garrisoned units do not occupy world tiles');
S.us[0].ld=null;S.us[0].hp=0;
assert.equal(place(0,'house',5,5),true,'defeated units do not block construction');
S.g[5*W+5]=1;assert.equal(place(0,'house',5,5),false,'blocked terrain rejects construction');
S.g[5*W+5]=0;
S.wt[5*W+5]=1;assert.equal(place(0,'house',5,5),false,'water rejects land foundations');
S.wt[5*W+5]=0;
S.ex[5*W+5]=0;assert.equal(place(0,'house',5,5),false,'player cannot build on unexplored ground');
assert.equal(place(1,'house',5,5),true,'AI placement retains its exploration rules');
S.ex[5*W+5]=1;
assert.equal(place(0,'dock',5,5),false,'dock requires accessible adjacent water');
S.wt[4*W+5]=1;assert.equal(place(0,'dock',5,5),true,'dock accepts adjacent unobstructed water');
S.nd[4*W+5]={k:'fish'};
assert.equal(place(0,'dock',5,5),false,'resource-occupied water does not satisfy dock access');
console.log('building-placement-input-validation: invalid, occupied, terrain, exploration and dock cases passed');
