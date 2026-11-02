import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const start=source.indexOf('function step(dt){');
assert.ok(start>=0,'fixed-step coordinator must remain in simulation.js');
const stepSource=source.slice(start);

function fixture({width=20,height=20,campaign=null,victory=0}={}){
 const calls=[],record=name=>()=>calls.push(name);
 const farm={fm:true,amt:0,t:0};
 const worker={hp:20,x:4,y:5,cg:[{hp:10,x:0,y:0}]};
 const carrier={hp:10,x:7,y:8};
 const fallenMonk={hp:0,x:2,y:3};
 const relics=[{c:carrier,x:0,y:0},{m:fallenMonk,x:0,y:0}];
 const S={t:0,vt:0,nodes:[farm],res:[{w:100}],us:[worker],
  bs:[{hp:100}],sel:[worker],rel:relics,px:[{f:99}],teamN:2};
 const ctx=vm.createContext({S,W:width,H:height,cmp:campaign,vm:victory,
  CAMP:[{noai:true}],fx:[{l:100}],menu:{items:[{up:record('menu')}]},
  retryAutomaticFarmWorkers:record('retry'),farmFood:()=>{calls.push('farm');return 80},
  note:record('note'),upU:record('units'),sep:record('separation'),
  WL:record('wildlife'),cmpTick:record('campaign'),vict:record('victory'),
  elim:record('elimination'),upB:record('buildings'),pjs:record('projectiles'),
  ai:record('ai'),compactPositive:()=>{},kingdomScore:t=>100+t,
  fog:record('fog'),mmUp:record('minimap')});
 vm.runInContext(stepSource+'\n;globalThis.tick=step;',ctx);
 return {ctx,calls,S,farm,worker,relics,tick:dt=>ctx.tick(dt)};
}
test('fixed-step preserves farms, orders, relics and passenger update order',()=>{
 const f=fixture();
 f.tick(1/30);
 assert.deepEqual(f.calls,[
  'retry','farm','note','units','separation','wildlife','elimination',
  'menu','buildings','projectiles','ai'
 ]);
 assert.equal(f.S.vt,1);
 assert.ok(Math.abs(f.S.t-1/30)<1e-12);
 assert.equal(f.S.res[0].w,40);
 assert.equal(f.farm.amt,80);
 assert.equal(f.relics[0].x,7);
 assert.equal(f.relics[0].y,8);
 assert.equal(f.relics[1].m,null);
 assert.equal(f.relics[1].x,3);
 assert.equal(f.relics[1].y,4);
 assert.equal(f.worker.cg[0].x,4);
 assert.equal(f.worker.cg[0].y,5);
 assert.equal(f.S.px[0].f,100);
});
test('score, fog, minimap, worker retry and menu retain the established cadence',()=>{
 const f=fixture();
 for(let i=0;i<30;i++)f.tick(1/30);
 assert.equal(f.S.vt,30);
 assert.equal(f.calls.filter(x=>x==='retry').length,1);
 assert.equal(f.calls.filter(x=>x==='menu').length,1);
 assert.equal(f.calls.filter(x=>x==='fog').length,5);
 assert.equal(f.calls.filter(x=>x==='minimap').length,5);
 assert.deepEqual(Array.from(f.S.scoreCache),[100,101]);
 f.tick(1/30);
 assert.equal(f.calls.filter(x=>x==='retry').length,2);
 for(let i=31;i<151;i++)f.tick(1/30);
 assert.equal(f.calls.filter(x=>x==='menu').length,2);
});
test('large maps throttle minimap updates and no-AI campaigns still tick objectives',()=>{
 const f=fixture({width:150,height:150,campaign:{i:0},victory:1});
 for(let i=0;i<24;i++)f.tick(1/30);
 assert.equal(f.calls.filter(x=>x==='campaign').length,24);
 assert.equal(f.calls.filter(x=>x==='victory').length,24);
 assert.equal(f.calls.filter(x=>x==='ai').length,0);
 assert.equal(f.calls.filter(x=>x==='elimination').length,0);
 assert.equal(f.calls.filter(x=>x==='fog').length,4);
 assert.equal(f.calls.filter(x=>x==='minimap').length,1);
});

test('live array compaction is simulation-owned and preserves stable order for units and projectiles',()=>{
 const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
 assert.doesNotMatch(engine,/function compactPositive\\(/);
 assert.doesNotMatch(engine,/function compactNotFlag\\(/);
 const start=source.indexOf('function compactPositive(a,k){');
 const end=source.indexOf('/* ===== SIMULATION STEP ===== */',start);
 assert.ok(start>=0&&end>start);
 const ctx={};vm.createContext(ctx);
 vm.runInContext(source.slice(start,end)+';globalThis.compact={positive:compactPositive,notFlag:compactNotFlag};',ctx);
 const living=[{id:1,hp:10},{id:2,hp:0},{id:3,hp:5},{id:4,hp:-1},{id:5,hp:1}];
 ctx.compact.positive(living,'hp');
 assert.deepEqual(living.map(u=>u.id),[1,3,5]);
 const projectiles=[{id:1,dead:0},{id:2,dead:1},{id:3,dead:false},{id:4,dead:true},{id:5}];
 ctx.compact.notFlag(projectiles,'dead');
 assert.deepEqual(projectiles.map(p=>p.id),[1,3,5]);
 const effects=[{l:0},{l:.01},{l:-2}];
 ctx.compact.positive(effects,'l');
 assert.equal(effects.length,1);
 assert.equal(effects[0].l,.01);
});
