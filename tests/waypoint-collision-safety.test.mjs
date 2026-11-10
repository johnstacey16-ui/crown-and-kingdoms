import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {headlessGame} from './helpers/headless-game.mjs';

const source = readFileSync(new URL('../js/simulation-separation.js', import.meta.url), 'utf8');
const mvStart = source.indexOf('const mv=(u,dx,dy)=>');
const mvEnd = source.indexOf('\n/* A* waypoints are tile-centred', mvStart);
const axisStart = source.indexOf('function walkAxisSlide(');
const walkStart = source.indexOf('function walk(u,dt,precise=false){');
const walkEnd = source.indexOf('\n/* Local spatial grid for unit separation.', walkStart);
assert.ok(mvStart >= 0 && mvEnd > mvStart && axisStart >= 0 && walkStart > axisStart && walkEnd > walkStart);
const W = 12, H = 12;
const S = { g: new Uint8Array(W*H), gt: new Uint8Array(W*H), wt: new Uint8Array(W*H), nd: new Array(W*H).fill(null) };
const context = { W, H, S, unitSpeed: () => 2 };
vm.createContext(context);
vm.runInContext(source.slice(mvStart, walkEnd), context);
const walk = vm.runInContext('walk', context);
const unit = (x=2.5, y=2.5) => ({ x, y, t: 0, sh: false, p: [], o: 'm', rp: 1 });
let u = unit();
u.p = [[3.5,2.5]];
assert.equal(walk(u, 1), true, 'valid waypoint completes');
assert.equal(u.x, 3.5);
u = unit();
u.p = [[3.5,2.5]];
assert.equal(walk(u, 0), false, 'paused simulation does not finish a waypoint');
assert.equal(u.x, 2.5);
assert.equal(u.p.length, 1);
assert.equal(walk(u, -1), false, 'negative elapsed time does not reverse motion');
assert.equal(walk(u, NaN), false, 'invalid elapsed time does not corrupt movement');
u = unit();
u.p = [[NaN,2.5]];
assert.equal(walk(u, 1), true, 'invalid waypoint is discarded');
assert.equal(u.x, 2.5);
assert.equal(u.p.length, 0);
u = unit();
u.p = [null];
assert.equal(walk(u, 1), true, 'malformed waypoint entry is discarded safely');
assert.equal(u.p.length, 0);
u = unit();
u.p = [[1,2,3]];
walk(u, 1);
assert.equal(u.x, 2.5, 'malformed waypoint coordinate tuple cannot move a unit');
u = unit();
u.p = [[-1,2.5]];
walk(u, 1);
assert.equal(u.x, 2.5, 'off-map waypoint does not move unit');
u = unit();
u.p = [[3.5,2.5]];
S.wt[2*W+3] = 1;
walk(u, 1);
assert.equal(u.x, 2.5, 'direct walking cannot cross deep water');
assert.equal(u.p.length, 0, 'blocked path is discarded for recalculation');
S.wt[2*W+3] = 2;
u.p = [[3.5,2.5]];
walk(u, 1);
assert.equal(u.x, 3.5, 'shallow ford remains traversable');
u = unit();
u.p = [[3.5,2.5]];
S.wt[2*W+3] = 0;
S.g[2*W+3] = 1;
walk(u, 1);
assert.equal(u.x, 2.5, 'building collision blocks final waypoint');
S.gt[2*W+3] = 1;
u = unit();
u.p = [[3.5,2.5]];
walk(u, 1);
assert.equal(u.x, 3.5, 'friendly gate is passable during waypoint traversal');
S.gt[2*W+3] = 2;
u = unit();
u.p = [[3.5,2.5]];
walk(u, 1);
assert.equal(u.x, 2.5, 'enemy gate blocks waypoint traversal');
// A path planned through the valid southeast gateway must not disappear when
// spatial separation nudges the unit into a diagonal approach beside a wall.
S.g.fill(0);S.gt.fill(0);S.wt.fill(0);
S.g[4*W+5]=1;
u=unit(4.92,4.59);u.p=[[5.5,5.5]];u.o='m';
let advanced=false;
for(let tick=0;tick<100;tick++){
 const beforeY=u.y;
 const arrived=walk(u,1/30);
 if(u.y>beforeY)advanced=true;
 assert.equal(S.g[(u.y|0)*W+(u.x|0)],0,'axis recovery must never enter the blocked corner');
 if(arrived)break;
}
assert.equal(advanced,true,'the soldier must slide toward the gateway');
assert.ok(u.x>=5&&u.y>=5,'the diagonal near-wall route must reach the safe tile');
assert.equal(u.p.length,0,'route is completed only after moving through the gateway');
console.log('waypoint-collision-safety: passed');

const selectionCode=readFileSync(new URL('../js/input-selection.js',import.meta.url),'utf8');
const selectionBegin=selectionCode.indexOf('function queueMarchWaypoint(');
const selectionEnd=selectionCode.indexOf('function controlGroupMembers(',selectionBegin);
assert.ok(selectionBegin>=0&&selectionEnd>selectionBegin);
const selectionWaypoint=selectionCode.slice(selectionBegin,selectionEnd);
test('solo army march queues real sequential A* destinations, saves and physically completes them',()=>{
 const {source:game,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(game+';globalThis.act=code=>eval(code);',sandbox);
 const run=sandbox.act;
 run("kingdoms=2;start();S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);globalThis.soldier=addU(0,'mil',18.5,18.5);S.sel=[soldier];soldier.o='i';soldier.p=[];");
 assert.equal(run('queueMarchWaypoint(25.5,18.5)'),true);
 const first=JSON.parse(run('JSON.stringify(soldier.p)'));
 assert.ok(first.length>0);
 assert.equal(run('queueMarchWaypoint(25.5,28.5)'),true);
 const full=JSON.parse(run('JSON.stringify(soldier.p)'));
 assert.deepEqual(full.slice(0,first.length),first,'second destination appends rather than replacing first');
 assert.ok(full.length>first.length);
 assert.equal(run('saveG()'),true,'queued route is a normal saved movement path');
 assert.equal(run('loadG()'),true);
 assert.deepEqual(JSON.parse(run("JSON.stringify(S.us.find(u=>u.netId===soldier.netId).p)")),full);
 const outcome=JSON.parse(run("JSON.stringify((()=>{const u=S.us.find(u=>u.netId===soldier.netId);for(let i=0;i<1800&&u.o==='m';i++)upU(u,1/30);return {x:u.x,y:u.y,order:u.o}})())"));
 assert.equal(outcome.order,'i');
 assert.ok(Math.hypot(outcome.x-25.5,outcome.y-28.5)<2,'normal movement reaches the final waypoint');
});
test('march queue skips foreign/dead/busy members and preserves path on failed routing',()=>{
 const units=[{k:'mil',t:0,hp:30,x:2.5,y:2.5,o:'m',p:[[3.5,2.5]],sh:false},
  {k:'mil',t:1,hp:30,x:2.5,y:2.5,o:'i',p:[]},
  {k:'mil',t:0,hp:0,x:2.5,y:2.5,o:'i',p:[]},
  {k:'mil',t:0,hp:30,x:2.5,y:2.5,o:'a',p:[]}];
 const fx=[],msgs=[],ctx=vm.createContext({S:{us:units,sel:[...units,units[0]]},U:{mil:{}},W:50,H:50,fx,window:{CK_NET:{isRunning:()=>false}},
  note:s=>msgs.push(s),isMil:u=>u?.t===0&&u.hp>0&&u.k==='mil',
  path:(u,g)=>u.x===3.5&&g.hx>5?null:[[4.5,2.5]],
  gp:(x,y,r)=>({hx:x,hy:y,hr:r}),Number,Math,Set});
 vm.runInContext(selectionWaypoint,ctx);
 assert.equal(ctx.queueMarchWaypoint(10.5,10.5),false);
 assert.deepEqual(units.map(u=>u.p),[[[3.5,2.5]],[],[],[]]);
 assert.equal(ctx.queueMarchWaypoint(-1,3),false);
 assert.equal(ctx.queueMarchWaypoint(Infinity,3),false);
 assert.equal(fx.length,0);
 ctx.window.CK_NET.isRunning=()=>true;
 assert.equal(ctx.queueMarchWaypoint(3,3),false,'solo waypoint commands cannot affect the multiplayer preview');
});
test('soldier command wheel and Xbox prompt expose repeatable waypoints with B cancel',()=>{
 const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 assert.ok(selectionCode.includes("l:'Queue march waypoints'"));
 assert.ok(selectionCode.includes('pat=5'));
 assert.ok(input.includes('if(pat===5)queueMarchWaypoint(wx,wy)'));
 assert.ok(input.includes("if(pat){if(E[1])pat=0"));
 assert.ok(ui.includes('WAYPOINT: A add next point, B finish'));
});
