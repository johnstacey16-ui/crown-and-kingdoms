import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const construction=readFileSync(new URL('../js/ai-construction.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const policy=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8');

function makeWorld({reachable=true}={}){
 const tc={t:1,k:'tc',hp:100,done:true,x:16,y:16};
 const builder={t:1,k:'vil',hp:40,o:'i',x:18,y:18};
 const S={bs:[tc],nodes:[],wt:new Uint8Array(64*64),nd:Array(64*64).fill(null),
  age:[0,1],r:()=>.8};
 const placed=[],charges=[];
 const B={house:{age:0,cost:{w:50},s:2},
  lcamp:{age:0,cost:{w:100},s:2},
  wall:{age:0,cost:{s:5},s:1},
  dock:{age:0,cost:{w:150},s:2}};
 const ctx=vm.createContext({S,B,W:64,H:64,
  aiAvailableBuilder:u=>u===builder&&u.o==='i',
  aiReachableBuilder:(_vs,_target)=>reachable?{builder,route:[[21,21]]}:null,
  aiDockWaterReach:()=>true,can:()=>true,
  okPlace:(_team,k,x,y)=>k==='dock'?x===25&&y===25:true,
  addB:(t,k,x,y,done)=>{const b={t,k,x,y,done,hp:1};placed.push(b);S.bs.push(b);return b},
  pay:(t,cost)=>charges.push({t,cost})});
 vm.runInContext(construction+'\n;globalThis.actions={aiBuild,aiWall,aiDock,aiNear};',ctx);
 return {S,B,tc,builder,placed,charges,...ctx.actions};
}

test('AI construction routines have exactly one owner in the production runtime order',()=>{
 for(const fn of ['aiBuild','aiWall','aiDock','aiNear']){
  assert.match(construction,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(ai,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(policy,new RegExp('function '+fn+'\\('));
 }
 assert.doesNotMatch(ai,/const cor=\(/);
 assert.match(construction,/const cor=\(/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const paths=coreGameScriptPaths(html);
 const i=paths.indexOf('./js/ai-construction.js');
 assert.ok(i>0);
 assert.equal(paths[i-1],'./js/ai-policy.js');
 assert.equal(paths[i+1],'./js/ai.js');
 assert.ok(readFileSync(new URL('../sw.js',import.meta.url),'utf8').includes("'./js/ai-construction.js'"));
 assert.doesNotThrow(()=>new vm.Script(construction));
});

test('unreachable builders do not spend resources or create fake structures',()=>{
 const h=makeWorld({reachable:false});
 h.aiBuild([h.builder],'house',1);
 assert.equal(h.charges.length,0);
 assert.equal(h.placed.length,0);
 assert.equal(h.builder.o,'i');
});

test('a legal reachable AI build spends once and gives a real builder order',()=>{
 const h=makeWorld();
 h.aiBuild([h.builder],'house',1);
 assert.equal(h.placed.length,1);
 assert.equal(h.charges.length,1);
 assert.equal(h.charges[0].t,1);
 assert.equal(h.placed[0].k,'house');
 assert.equal(h.builder.o,'b');
 assert.equal(h.builder.tg,h.placed[0]);
 assert.equal(h.builder.p.length,1);
});

test('resource construction ignores destroyed nearby structures but not living ones',()=>{
 const h=makeWorld();
 h.S.nodes.push({k:'w',x:30,y:25,amt:200});
 h.S.bs.push({t:1,k:'lcamp',x:29,y:25,hp:0});
 h.aiNear([h.builder],'lcamp',['w'],1);
 assert.equal(h.placed.length,1);
 assert.equal(h.charges.length,1);
 const second=makeWorld();
 second.S.nodes.push({k:'w',x:30,y:25,amt:200});
 second.S.bs.push({t:1,k:'lcamp',x:29,y:25,hp:100});
 second.aiNear([second.builder],'lcamp',['w'],1);
 assert.equal(second.placed.length,0);
 assert.equal(second.charges.length,0);
});

test('AI Dock construction requires a usable shoreline and charged worker assignment',()=>{
 const dry=makeWorld();
 dry.aiDock([dry.builder],dry.tc,1);
 assert.equal(dry.placed.length,0);
 assert.equal(dry.charges.length,0);
 const wet=makeWorld();
 wet.S.wt[25*64+25]=1;
 wet.aiDock([wet.builder],wet.tc,1);
 assert.equal(wet.placed.length,1);
 assert.equal(wet.placed[0].k,'dock');
 assert.equal(wet.builder.tg,wet.placed[0]);
 assert.equal(wet.charges.length,1);
});
