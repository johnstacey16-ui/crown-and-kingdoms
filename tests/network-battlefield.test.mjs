import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const read=name=>readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8');
const setup=`
 seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;
 startAge=1;startArmy=0;startRes=3;start();snd=0;S.humanTeams=[0,1];
 S.nodes=S.nodes.filter(n=>!(n.x>=18&&n.x<42&&n.y>=18&&n.y<42));
 for(let y=18;y<42;y++)for(let x=18;x<42;x++){const i=y*W+x;S.g[i]=0;S.gt[i]=0;S.wt[i]=0;S.nd[i]=null;S.ex[i]=1;}
 S.us=[];
 const worker=addU(0,'vil',21.5,21.5),soldier=addU(0,'mil',23.5,22.5);
 const guest=addU(1,'vil',30.5,21.5),target=addU(1,'mil',27.5,22.5),hidden=addU(1,'scout',60.5,60.5);
 const tree=addN('w',22,25,100,0);S.sel=[];
 S.res[0]={f:2000,w:2000,g:2000,s:2000};S.res[1]={f:2000,w:2000,g:2000,s:2000};
 const adapter=CK_GAME_COMMANDS;
 globalThis.run=code=>eval(code);
 globalThis.view=team=>CK_UNIT_MAP.project(S,team,W,H);
 globalThis.act=(order,team=0)=>adapter.execute(order,team,1);
 globalThis.ids={worker:worker.netId,soldier:soldier.netId,guest:guest.netId,target:target.netId,hidden:hidden.netId};
 globalThis.worldHash=()=>CK_SIM_SYNC.worldCheckpoint(S,1).hash;
`;
function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+read('network-sync')+'\n'+read('network-commands')+'\n'+read('network-unit-map')+'\n'+setup,sandbox);return sandbox;
}
function mapFixture(c){
 const orders=[],draws=[],canvas={style:{},setAttribute(){},addEventListener(){},focus(){},
  getContext:()=>new Proxy({},{get:(_,key)=>(...args)=>draws.push([key,...args])})};
 const description={textContent:''};
 const map=c.CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return{ok:true}},leave(){}});
 c.run('globalThis.testMap=null');c.testMap=map;c.run('testMap.refresh(S,0,W,H,true)');
 return{map,orders,draws,description,refresh:()=>c.run('testMap.refresh(S,0,W,H,true)')};
}

test('each team receives its own current sight, copied terrain/resources and only visible opponents',()=>{
 const c=fixture(),before=c.worldHash();c.run('S.vs.fill(1);S.ex.fill(1)');
 const view=c.view(0);
 assert.ok(view.battlefield.enemies.some(e=>e.id===c.ids.target));
 assert.ok(!view.battlefield.enemies.some(e=>e.id===c.ids.hidden),'shared solo fog must not reveal distant enemies');
 assert.ok(view.battlefield.tiles.some(t=>t.node?.kind==='w'));
 assert.ok(!view.battlefield.visible.includes(60*72+60));
 const cell=view.battlefield.tiles.find(t=>t.node);cell.node.amount=0;
 view.battlefield.enemies[0].x=0;view.battlefield.health[c.ids.worker].hp=0;
 assert.equal(c.run('tree.amt'),100);assert.equal(c.run('worker.hp'),25);
 assert.equal(c.worldHash(),before,'projection never mutates the simulation');
 c.run('target.x=60.5;target.y=60.5;guest.x=60.5;guest.y=60.5');
 assert.equal(c.view(0).battlefield.enemies.some(e=>e.id===c.ids.target),false);
});

test('attack execution rechecks current team sight, hostility and stance before changing any unit',()=>{
 const c=fixture(),order={type:'attack',entities:[c.ids.soldier],target:c.ids.target};
 c.run('target.x=60.5;target.y=60.5');
 assert.equal(c.act(order),false);assert.equal(c.run('soldier.o'),'i');
 c.run('target.x=27.5;target.y=22.5');
 assert.equal(c.act(order),true);assert.equal(c.run('soldier.tg===target'),true);
 c.run("soldier.o='i';soldier.tg=null;soldier.st=4");
 assert.equal(c.act(order),false);assert.equal(c.run('soldier.tg'),null);
 c.run("soldier.st=0;S.dip[0][1]=S.dip[1][0]='neutral'");
 assert.equal(c.act(order),false);
 assert.equal(c.act({type:'attack',entities:[c.ids.target],target:c.ids.soldier}),false,'cannot control the other team');
});

test('authenticated construction charges the owner once, completes through normal simulation and exposes paid training/research',()=>{
 for(const team of [0,1]){
  const c=fixture(),builder=team?c.ids.guest:c.ids.worker,point=team?{x:30,y:25}:{x:23,y:26};
  const before=c.run('S.res['+team+'].w'),other=c.run('S.res['+(1-team)+'].w');
  const order={type:'build',entities:[builder],value:'bar',point};
  assert.equal(c.act(order,team),true);
  assert.equal(c.run('S.res['+team+'].w'),before-150);
  assert.equal(c.run('S.res['+(1-team)+'].w'),other);
  c.run("globalThis.building=S.bs.find(b=>b.k==='bar'&&b.t==="+team+");globalThis.builder=adapter.lookup("+JSON.stringify(builder)+");for(let i=0;i<1500;i++)upU(builder,1/30)");
  assert.equal(c.run('building.done'),true);
  const id=c.run('building.netId');
  assert.equal(c.act({type:'train',entities:[id],value:'mil'},team),true);
  assert.equal(c.run('building.q.length'),1);
  assert.equal(c.act({type:'cancel',entities:[id]},team),true);
  assert.equal(c.act({type:'research',entities:[id],value:'man'},team),true);
  assert.equal(c.run('building.rs.k'),'man');
  const b=c.view(team).buildings.find(b=>b.id===id);
  assert.ok(b.selectable&&b.commands.some(o=>o.value==='mil'));
 }
});

test('fog, prerequisites, collisions, budgets, forged types and unavailable builders reject construction without payment',()=>{
 for(const scenario of ['fog','age','prerequisite','occupied','resources','civilian','loaded','foreign','fractional','unknown']){
  const c=fixture();let order={type:'build',entities:[c.ids.worker],value:'bar',point:{x:23,y:26}};
  if(scenario==='fog')order.point={x:55,y:55};
  if(scenario==='age')c.run('S.age[0]=0');
  if(scenario==='prerequisite')order.value='rng';
  if(scenario==='occupied')c.run('S.g[26*W+23]=1');
  if(scenario==='resources')c.run('S.res[0].w=0');
  if(scenario==='civilian')order.entities=[c.ids.soldier];
  if(scenario==='loaded')c.run('worker.ld={}');
  if(scenario==='foreign')order.entities=[c.ids.guest];
  if(scenario==='fractional')order.point.x+=.25;
  if(scenario==='unknown')order.value='tc';
  const before=c.worldHash();assert.equal(c.act(order),false,scenario);assert.equal(c.worldHash(),before,scenario);
 }
});

test('battlefield graphics and contextual A use sight-filtered targets without optimistic attacks',()=>{
 const c=fixture(),f=mapFixture(c),before=c.worldHash();
 f.map.choose({x:23.5,y:22.5});f.map.choose({x:27.5,y:22.5});
 assert.equal(f.orders.length,1);assert.equal(f.orders[0].type,'attack');assert.equal(f.orders[0].target,c.ids.target);
 assert.equal(c.worldHash(),before);assert.ok(f.draws.some(d=>d[0]==='ellipse'),'battlefield draws unit and building art');
 c.run('target.x=60.5;target.y=60.5');f.refresh();f.map.choose({x:27.5,y:22.5});
 assert.equal(f.orders[1].type,'move','a previously seen enemy is not retained as an attack target');
});

test('RT construction pages open a blueprint and submit a typed paid order; refresh retains the chosen page and preview',()=>{
 const c=fixture(),f=mapFixture(c),before=c.worldHash();
 f.map.choose({x:21.5,y:21.5});f.map.control({7:true},{7:true});
 f.map.control({3:true},{7:true,3:true});f.refresh();
 f.map.control({0:true},{7:true,0:true});assert.equal(f.orders.length,0,'choosing a blueprint is not construction');
 f.map.control({},{});f.refresh();f.map.choose({x:24.5,y:27.5});
 assert.equal(f.orders.length,1);assert.equal(f.orders[0].type,'build');assert.equal(f.orders[0].value,'bar');
 assert.deepEqual({...f.orders[0].point},{x:23,y:26});assert.equal(c.worldHash(),before);
});

test('terminal match state is part of the world checksum',()=>{
 const c=fixture(),before=c.worldHash();c.run("S.over='win';S.why='All hostile Town Centres have fallen'");
 const end=c.worldHash();assert.notEqual(end,before);c.run("S.why='Different result'");assert.notEqual(c.worldHash(),end);
});

test('visible resource IDs drive real harvesting and deposits without charging or controlling another team',()=>{
 const c=fixture();
 c.run("addB(0,'lumber',20,27,true);worker.x=21.5;worker.y=24.5;");
 const id=c.run('tree.netId'),before=c.run('S.res[0].w');
 assert.equal(c.CK_SIM_SYNC.validResourceId(id),true);
 assert.equal(c.CK_SIM_SYNC.validId(id),false,'resource IDs cannot become controllable entities');
 assert.equal(c.act({type:'gather',entities:[c.ids.worker],target:id}),true);
 assert.equal(c.run('S.res[0].w'),before);
 c.run('for(let i=0;i<1500;i++)upU(worker,1/30)');
 assert.ok(c.run('S.res[0].w')>before);assert.ok(c.run('tree.amt')<100);
 assert.equal(c.act({type:'gather',entities:[c.ids.guest],target:id}),false);
});

test('gathering rejects hidden, depleted, replaced, mismatched and unreachable resources without partial mutations',()=>{
 for(const scenario of ['hidden','depleted','replaced','military','unreachable','foreign-farm']){
  const c=fixture(),id=c.run('tree.netId');
  if(scenario==='hidden')c.run('tree.x=60;tree.y=60;S.nd[60*W+60]=tree');
  if(scenario==='depleted')c.run('tree.amt=0');
  if(scenario==='replaced')c.run('S.nd[tree.y*W+tree.x]={...tree}');
  if(scenario==='unreachable')c.run('S.g.fill(1);S.g[(worker.y|0)*W+(worker.x|0)]=0');
  if(scenario==='foreign-farm')c.run("tree.fm=1;tree.t=1;tree.k='f'");
  const before=c.worldHash(),who=scenario==='military'?c.ids.soldier:c.ids.worker;
  assert.equal(c.act({type:'gather',entities:[who],target:id}),false,scenario);
  assert.equal(c.worldHash(),before,scenario);
 }
});

test('resource IDs survive list reordering and validated save/load without reusing counters',()=>{
 const c=fixture();c.run('ensureResourceIds();S.nodes.reverse()');
 const id=c.run('tree.netId');
 assert.equal(c.run('adapter.lookup('+JSON.stringify(id)+')===tree'),true);
 assert.equal(c.act({type:'gather',entities:[c.ids.worker],target:id}),true);
 const hash=c.worldHash();assert.equal(c.run('saveG()'),true);assert.equal(c.run('loadG()'),true);
 assert.equal(c.worldHash(),hash);
 assert.equal(c.run('S.us.find(u=>u.netId==='+JSON.stringify(c.ids.worker)+').tg.netId'),id);
 assert.equal(c.run("validSavedNetworkIds({us:[],bs:[],nodes:[{netId:'n7'},{netId:'n7'}],netNext:8})"),false);
 assert.equal(c.run("validSavedNetworkIds({us:[],bs:[],nodes:[{netId:'n7'}],netNext:7})"),false);
});

test('contextual A submits resource gathering and keeps hidden deposits out of the drawing projection',()=>{
 const c=fixture(),f=mapFixture(c),before=c.worldHash();
 f.map.choose({x:21.5,y:21.5});f.map.choose({x:22.5,y:25.5});
 assert.equal(f.orders.length,1);assert.equal(f.orders[0].type,'gather');
 assert.equal(f.orders[0].target,c.run('tree.netId'));assert.equal(c.worldHash(),before);
});
