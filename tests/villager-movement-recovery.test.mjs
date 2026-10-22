import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const finding=readFileSync(new URL('../js/pathfinding.js',import.meta.url),'utf8');
function section(source,from,to){
 const a=source.indexOf(from),b=source.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'required production section is present: '+from);
 return source.slice(a,b);
}
const snippets=[
 section(sim,'function gatherCapacity(u)','/* ===== COMBAT ===== */'),
 section(sim,'function upU(u,dt){','function spawnPos(b)'),
 section(sim,'const mv=(u,dx,dy)=>','/* Local spatial grid'),
 section(finding,'function d2(px,py,t){','const goalNear='),
 section(render,'const PAINT=','function loadPaintedTerrain('),
 section(render,'function unitVisualPose(u,time){','function drawPaintedTroop(')
].join('\n');

function scenario(){
 const W=16,H=16;
 const S={t:10,g:new Uint8Array(W*H),gt:new Uint8Array(W*H),wt:new Uint8Array(W*H),
  nd:new Array(W*H).fill(null),bs:[],res:[{f:0,w:0,g:0,s:0}],pl:{gath:0},
  tech:[{}],vp:{enabled:false}};
 const context={W,H,S,U:{vil:{sp:2,cd:1}},B:{house:{bt:20}},CAP:10,GR:1,gt:0,
  gm:()=>1,sfx:()=>{},note:()=>{},Math};
 vm.createContext(context);
 vm.runInContext(snippets+'\n;globalThis.step=upU;globalThis.pose=unitVisualPose;',context);
 const worker=(x,y,tg,order='g')=>({k:'vil',t:0,hp:25,x,y,o:order,tg,ct:'w',
  p:[[7.5,5.5]],rp:8,cd:0,car:0,ret:0,autoWorker:0,sh:false});
 return {S,W,step:context.step,pose:context.pose,worker};
}

test('a gathering villager stops the old route and uses the work pose without moving',()=>{
 const h=scenario(),tree={k:'w',x:5,y:5,s:1,amt:100};
 h.S.nd[5*h.W+5]=tree;h.S.g[5*h.W+5]=1;
 const u=h.worker(4.5,5.5,tree);
 assert.equal(h.pose(u,h.S.t).state,3,'working takes precedence over a queued waypoint');
 h.step(u,.2);
 assert.equal(u.p.length,0,'working clears obsolete travel waypoints');
 assert.equal(u.rp,0,'working clears the old route-retry timer');
 assert.ok(u.car>0,'work actually gathers resources');
 assert.equal(h.pose(u,h.S.t+.2).state,3,'a working villager remains in work animation');
});

test('a building villager clears travel waypoints and makes construction progress',()=>{
 const h=scenario(),site={k:'house',t:0,x:5,y:5,s:2,done:false,hp:1,mh:100,pr:0};
 const u=h.worker(4.5,6.5,site,'b');
 assert.equal(h.pose(u,h.S.t).state,3);
 h.step(u,.2);
 assert.equal(u.p.length,0);
 assert.equal(u.rp,0);
 assert.ok(site.pr>0,'builder must make progress once in range');
 assert.equal(h.pose(u,h.S.t+.3).state,3);
});

test('a routed villager moves across clear land, then stops and gathers',()=>{
 const h=scenario(),tree={k:'w',x:5,y:5,s:1,amt:100};
 h.S.nd[5*h.W+5]=tree;h.S.g[5*h.W+5]=1;
 const u=h.worker(2.5,5.5,tree);
 u.p=[[3.5,5.5],[4.5,5.5]];
 assert.equal(h.pose(u,h.S.t).state,1);
 h.step(u,.25);h.S.t+=.25;
 assert.ok(u.x>2.5,'simulation moves the villager, not just its artwork');
 assert.equal(h.pose(u,h.S.t).state,1);
 for(let i=0;i<10&&u.car===0;i++){h.step(u,.25);h.S.t+=.25}
 assert.ok(u.car>0,'the villager must arrive and gather');
 assert.equal(u.p.length,0,'the completed travel path is cleared');
 assert.equal(h.pose(u,h.S.t).state,3);
});

test('a motionless unit with a stale queued route stops walking after a short grace period',()=>{
 const h=scenario(),u=h.worker(2.5,2.5,null,'m');
 const before=JSON.stringify(u);
 assert.equal(h.pose(u,10).state,1,'a newly assigned route may show initial movement');
 assert.equal(h.pose(u,10.5).state,0,'unchanged position stops the walking animation');
 u.x+=.2;
 assert.equal(h.pose(u,10.6).state,1,'real displacement resumes the walking animation');
 assert.equal(h.pose(u,11).state,0,'walking stops again when displacement stops');
 assert.equal(h.pose(u,11).state,0,'repeated paused frames have stable poses');
 assert.notEqual(JSON.stringify(u),before,'fixture moved only when the test explicitly changed x');
 assert.equal(u.p.length,1,'rendering never mutates movement orders');
});
