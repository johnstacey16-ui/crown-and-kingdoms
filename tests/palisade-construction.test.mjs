import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const setup=`
 seedOv=123456;kingdoms=2;mt=0;mapLayout=0;startAge=0;cmp=null;newGame();
 mode='play';snd=0;pad={axes:[0,0,0,0],buttons:[]};clampCam=()=>{};
 S.ex.fill(1);S.res[0]={f:1000,w:1000,g:1000,s:1000};
 const worker=S.us.find(u=>u.t===0&&u.k==='vil');
 S.us=S.us.filter(u=>u===worker||u.t!==0);
 let buildX=0,buildY=0;
 outer:for(let y=4;y<H-4;y++)for(let x=4;x<W-5;x++)
  if([0,1,2].every(dx=>okPlace(0,'palisade',x+dx,y))&&!S.g[y*W+x-1]&&!S.wt[y*W+x-1]){
   buildX=x;buildY=y;break outer;
  }
 if(!buildX)throw Error('No clear test construction site');
 worker.x=buildX-.5;worker.y=buildY+.5;worker.o='i';worker.p=[];S.sel=[worker];
 const cursorAt=(x,y)=>{cam.x=(x-y)*TW/2-CW/2;cam.y=(x+y)*TH/2-CH/2;cur={x:CW/2,y:CH/2}};
 cursorAt(buildX+.5,buildY+.5);
 const runPad=(edges=[],held=[],released=[])=>{E=edges;P=held;RE=released;playCtl(0)};
 const key=i=>Object.assign([],{[i]:true});
 globalThis.run=(code)=>eval(code);
 globalThis.openShortcut=()=>{ysc.vb='palisade';runPad(key(3),key(3));runPad([],[],key(3))};
 globalThis.placeOne=(repeat=false)=>runPad(key(0),repeat?Object.assign(key(0),{6:true}):key(0));
 globalThis.nextSite=()=>cursorAt(buildX+1.5,buildY+.5);
 globalThis.snapshot=()=>JSON.stringify({
  preview:place?.k||null,wood:S.res[0].w,stone:S.res[0].s,
  walls:S.bs.filter(b=>b.k==='palisade').map(b=>({id:b.netId,x:b.x,y:b.y,hp:b.hp,mh:b.mh,done:b.done,pr:b.pr})),
  worker:{order:worker.o,target:worker.tg?.k||null},notes:notes.map(n=>n.s)
 });
`;
function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source+setup,sandbox);return sandbox;
}
const state=c=>JSON.parse(c.snapshot());

test('Palisade is a Founding Age wood building on the economic page and Y opens its preview',()=>{
 const c=fixture();
 assert.equal(c.run("bLock('palisade')"),'');
 c.run("openMenu()");
 assert.equal(c.run("menu.items.slice(...menu.pr[0]).filter(it=>it.l===B.palisade.n).length"),1);
 assert.equal(c.run("menu.items.slice(...menu.pr[1]).some(it=>it.l===B.bar.n)"),true);
 assert.equal(c.run("menu.pr[1][1]===menu.items.length"),true,'all build entries remain reachable');
 c.run("menu.items.find(it=>it.l===B.palisade.n).fn()");
 assert.equal(state(c).preview,'palisade');assert.equal(state(c).wood,1000);
 c.run('place=null');c.openShortcut();assert.equal(state(c).preview,'palisade');
 assert.equal(state(c).walls.length,0,'opening a preview does not construct or spend');
});

test('placement charges only wood, constructs and repairs a blocking wall, and destruction frees its tile',()=>{
 const c=fixture();c.openShortcut();c.placeOne();
 let s=state(c);assert.equal(s.wood,997);assert.equal(s.stone,1000);
 assert.equal(s.preview,null);assert.equal(s.walls.length,1);assert.equal(s.walls[0].done,false);
 assert.equal(s.worker.order,'b');assert.equal(s.worker.target,'palisade');
 c.run("globalThis.wall=S.bs.find(b=>b.k==='palisade');for(let n=0;n<120;n++)upU(worker,1/30)");
 s=state(c);assert.equal(s.walls[0].done,true);assert.equal(s.walls[0].hp,s.walls[0].mh);
 assert.equal(c.run("S.g[wall.y*W+wall.x]"),1);
 c.run("globalThis.probe=addU(1,'mil',wall.x-.5,wall.y+.5);globalThis.beforeX=probe.x;mv(probe,1,0)");
 assert.equal(c.run('probe.x===beforeX'),true,'movement cannot enter timber walls');
 assert.equal(c.run('path(probe,gp(wall.x+.5,wall.y+.5,.3))'),null);
 c.run("wall.hp=wall.mh/2;globalThis.damaged=wall.hp;worker.o='b';worker.tg=wall;upU(worker,1)");
 assert.equal(c.run('wall.hp>damaged&&wall.hp<=wall.mh'),true);
 c.run("globalThis.attacker=addU(1,'ram',wall.x+2,wall.y+2);for(let n=0;n<40&&wall.hp>0;n++)dmgT(attacker,wall)");
 assert.equal(c.run('wall.dead'),1);assert.equal(c.run('S.g[wall.y*W+wall.x]'),0);
 assert.equal(c.run("okPlace(0,'palisade',wall.x,wall.y)"),true);
});

test('LT retains the palisade preview for another paid placement and B cancels without an extra charge',()=>{
 const c=fixture();c.openShortcut();c.placeOne(true);
 assert.equal(state(c).preview,'palisade');c.nextSite();c.placeOne(true);
 assert.equal(state(c).walls.length,2);assert.equal(state(c).wood,994);
 c.run('runPad(key(1),key(1))');
 assert.equal(state(c).preview,null);assert.equal(state(c).wood,994);
});

test('blocked, water, unaffordable and unavailable-builder placements cannot spend or construct',()=>{
 for(const change of [
  'S.g[buildY*W+buildX]=1','S.wt[buildY*W+buildX]=1',
  'S.res[0].w=2','worker.hp=0','worker.ld={}','worker.t=1','S.us=[]'
 ]){
  const c=fixture();c.openShortcut();c.run(change);const before=state(c).wood;c.placeOne();
  assert.equal(state(c).walls.length,0,change);assert.equal(state(c).wood,before,change);
 }
});

test('unfinished and completed palisades round-trip manual saves and autosaves with worker targets and stable IDs',()=>{
 for(const auto of [false,true])for(const completed of [false,true]){
  const c=fixture();c.openShortcut();c.placeOne();
  if(completed)c.run('for(let n=0;n<120;n++)upU(worker,1/30)');
  const before=state(c).walls[0];
  assert.equal(c.run('saveG('+auto+')'),true);
  assert.equal(c.run('loadG('+auto+')'),true);
  const loaded=JSON.parse(c.run("JSON.stringify(S.bs.find(b=>b.k==='palisade'))"));
  for(const key of ['x','y','hp','mh','done','pr'])assert.equal(loaded[key],before[key],key);
  assert.equal(loaded.netId,before.id);
  assert.equal(c.run("S.g["+before.y+"*W+"+before.x+"]"),1);
  if(!completed)assert.equal(c.run("S.us.some(u=>u.k==='vil'&&u.tg===S.bs.find(b=>b.k==='palisade'))"),true);
 }
});

test('timber art draws finite pointed stakes at construction, completed and damaged stages without an atlas',()=>{
 const c=fixture();
 for(const [stage,damage] of [[.3,0],[.8,0],[1,0],[1,2]]){
  c.run("globalThis.polygons=[];pg=(g,p)=>polygons.push(p);paintBld(document.getElementById('c').getContext('2d'),'palisade',1,'#3b82f6',"+stage+","+damage+")");
  const polygons=JSON.parse(c.run('JSON.stringify(polygons)'));
  assert.ok(polygons.length>8,'wooden posts have their own silhouette');
  assert.ok(polygons.flat(2).every(Number.isFinite));
  assert.ok(polygons.some(p=>p.length===5&&p[2][1]<p[1][1]&&p[2][1]<p[3][1]),'stakes have pointed tops');
 }
});
