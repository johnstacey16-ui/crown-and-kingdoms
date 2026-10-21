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
 vm.runInContext(source+'\n'+read('assets')+'\n'+read('network-sync')+'\n'+read('network-commands')+'\n'+read('network-unit-map')+'\n'+setup,sandbox);return sandbox;
}
function mapFixture(c){
 const orders=[],draws=[],canvas={style:{},setAttribute(){},addEventListener(){},focus(){},
  getContext:()=>new Proxy({},{get:(_,key)=>(...args)=>draws.push([key,...args])})};
 const description={textContent:''};
 const map=c.CK_UNIT_MAP.create({canvas,description,submit:order=>{orders.push(order);return{ok:true}},leave(){}});
 c.run('globalThis.testMap=null');c.testMap=map;c.run('testMap.refresh(S,0,W,H,true)');
 return{map,orders,draws,description,refresh:()=>c.run('testMap.refresh(S,0,W,H,true)')};
}

test('multiplayer camera uses right-stick zoom and left-stick pan without sending orders or changing the world',()=>{
 const c=fixture(),f=mapFixture(c),before=c.worldHash();
 const initial=f.map.viewport();f.map.control({}, {}, [0,0,1,0],.1);
 assert.equal(f.map.viewport().zoom,initial.zoom);
 f.map.control({}, {}, [0,0,0,-1],.1);assert.ok(f.map.viewport().zoom>initial.zoom);
 assert.ok(Math.abs((21.5-f.map.viewport().x)/f.map.viewport().width-21.5/72)<1e-8,'zoom preserves the world point under the reticle');
 const zoom=f.map.viewport().zoom;f.map.control({}, {6:true}, [0,0,0,-1],.1);
 assert.equal(f.map.viewport().zoom,zoom,'LT right-stick navigation is not reassigned to zoom');
 for(let i=0;i<20;i++)f.map.control({}, {}, [0,0,0,-1],.1);
 assert.equal(f.map.viewport().zoom,3);
 const focused=f.map.viewport();f.map.control({}, {}, [1,0,0,0],.1);
 assert.ok(f.map.viewport().x>focused.x,'left stick pans the cropped viewport');
 f.map.control({5:true},{5:true});assert.equal(f.map.viewport().overview,true);assert.equal(f.map.viewport().zoom,1);
 f.map.control({}, {}, [0,0,0,1],.1);f.map.control({1:true},{1:true});
 assert.equal(f.map.viewport().zoom,3,'closing overview restores the prior zoom');
 for(let i=0;i<30;i++)f.map.control({}, {}, [0,0,0,1],.1);
 assert.equal(f.map.viewport().zoom,.8);
 assert.ok(Number.isFinite(f.map.viewport().x));assert.ok(Number.isFinite(f.map.viewport().y));
 assert.equal(c.worldHash(),before);assert.deepEqual(f.orders,[]);
});

test('authenticated Line/Split reforms both teams with atomic ownership and route checks',()=>{
 for(const team of [0,1]){
  const c=fixture();
  const ids=Array.from(c.run(`globalThis.rank=[addU(${team},'mil',24.5,27.5),addU(${team},'arc',26.5,27.5)];rank.forEach(u=>u.st=4);rank.map(u=>u.netId)`));
  const originalSelection=c.run('S.sel'),soloFormation=c.run('fm');
  assert.equal(c.act({type:'formation',entities:ids,value:'split'},team),true);
  assert.equal(c.run("rank.every(u=>u.netFormation==='split')"),true);
  assert.notEqual(c.run('JSON.stringify(rank[0].p.at(-1))'),c.run('JSON.stringify(rank[1].p.at(-1))'));
  assert.equal(c.run('S.sel'),originalSelection);assert.equal(c.run('fm'),soloFormation);
  const before=c.worldHash();
  c.run("rank[0].netFormation='line'");assert.notEqual(c.worldHash(),before,'choice alone changes the checkpoint');
  c.run("rank[0].netFormation='split'");
  c.run('globalThis.originalPath=path;path=(u,g)=>u===rank[1]?null:originalPath(u,g)');
  assert.equal(c.act({type:'formation',entities:ids,value:'line'},team),false);
  assert.equal(c.worldHash(),before,'unreachable member cannot partly reform the other unit');
  c.run('path=originalPath');
  assert.equal(c.act({type:'formation',entities:ids,value:'line'},team),true);
  assert.equal(c.run("rank.every(u=>u.netFormation==='line')"),true);
  assert.notEqual(c.worldHash(),before,'formation choice is part of the checkpoint');
 }
});

test('formation packets reject invalid shapes and stale, civilian, loaded or foreign selections',()=>{
 for(const scenario of ['one','duplicate','civilian','foreign','loaded','dead','building','stale','value','extra']){
  const c=fixture();const extra=c.run("globalThis.mate=addU(0,'arc',24.5,24.5);mate.netId");
  const order={type:'formation',entities:[c.ids.soldier,extra],value:'split'};
  if(scenario==='one')order.entities.pop();
  if(scenario==='duplicate')order.entities[1]=order.entities[0];
  if(scenario==='civilian')order.entities[1]=c.ids.worker;
  if(scenario==='foreign')order.entities[1]=c.ids.target;
  if(scenario==='loaded')c.run('mate.ld={}');
  if(scenario==='dead')c.run('mate.hp=0');
  if(scenario==='building')order.entities[1]=c.run('S.bs[0].netId');
  if(scenario==='stale')c.run('S.us=S.us.filter(u=>u!==mate)');
  if(scenario==='value')order.value='teleport';
  if(scenario==='extra')order.point={x:2,y:2};
  const before=c.worldHash();assert.equal(c.act(order),false,scenario);assert.equal(c.worldHash(),before,scenario);
 }
});

test('land and naval formations retain separate centres and formation choice survives a save',()=>{
 const c=fixture();
 const ids=Array.from(c.run(`for(let y=30;y<42;y++)for(let x=18;x<42;x++)S.wt[y*W+x]=1;
  globalThis.rank=[addU(1,'mil',22.5,26.5),addU(1,'arc',24.5,26.5),addU(1,'gal',32.5,35.5),addU(1,'gal',34.5,35.5)];rank.forEach(u=>u.st=4);rank.map(u=>u.netId)`));
 assert.equal(c.act({type:'formation',entities:ids,value:'split'},1),true);
 assert.equal(c.run('rank.every(u=>u.p.every(([x,y])=>!!(S.wt[(y|0)*W+(x|0)]===1)===!!u.sh))'),true);
 assert.equal(c.run('saveG()'),true);assert.equal(c.run('loadG()'),true);
 assert.equal(c.run(`S.us.filter(u=>${JSON.stringify(ids)}.includes(u.netId)).every(u=>u.netFormation==='split')`),true);
});

test('military Y waits for release, submits no optimistic movement, and uses acknowledged formation',()=>{
 const c=fixture();c.run("globalThis.mate=addU(0,'mil',25.5,24.5)");const f=mapFixture(c);
 f.map.choose({x:23.5,y:22.5});f.map.choose({x:25.5,y:24.5},true);
 const selected=Array.from(f.map.selection()),before=c.worldHash();
 f.map.control({3:true},{3:true});assert.equal(f.orders.length,0);
 f.map.control({},{});assert.equal(f.orders.length,1);assert.equal(f.orders[0].type,'formation');assert.equal(f.orders[0].value,'split');
 assert.equal(c.worldHash(),before);assert.deepEqual(Array.from(f.map.selection()),selected);
 assert.equal(c.act(f.orders[0]),true);f.refresh();f.map.control({3:true},{3:true});f.map.control({},{});
 assert.equal(f.orders[1].value,'line');assert.ok(f.draws.some(d=>d[0]==='fillText'&&d[1]==='Y: Line / Split formation'));
});

test('Y formation cannot leak through cancellation, modifier menus, selection changes or suspension',()=>{
 for(const context of ['B','RT','LB','RB','cycle','suspend','pointer','selection','pending']){
  const c=fixture();c.run("globalThis.mate=addU(0,'mil',25.5,24.5)");const f=mapFixture(c);
  f.map.choose({x:23.5,y:22.5});f.map.choose({x:25.5,y:24.5},true);
  f.map.control({3:true},{3:true});
  if(context==='B')f.map.control({1:true},{3:true,1:true});
  if(context==='RT')f.map.control({7:true},{3:true,7:true});
  if(context==='LB')f.map.control({4:true},{3:true,4:true});
  if(context==='RB')f.map.control({5:true},{3:true,5:true});
  if(context==='cycle')f.map.control({14:true},{3:true,14:true});
  if(context==='suspend')f.map.suspend();
  if(context==='pointer')f.map.choose({x:23.5,y:22.5});
  if(context==='selection'){c.run('mate.hp=0');f.refresh();}
  if(context==='pending')c.run('testMap.refresh(S,0,W,H,false)');
  f.map.control({},{});assert.equal(f.orders.length,0,context);
 }
});

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
  if(scenario==='age'){c.run('S.age[0]=0');order.value='tower';}
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

test('garrison orders board living owned units, hide passengers and unload through the normal safe placement routine',()=>{
 for(const team of [0,1]){
  const c=fixture();
  c.run("globalThis.shelter=addB("+team+",'tc',24,27,true);globalThis.passenger="+(team?'guest':'worker')+";passenger.x=21.5;passenger.y=21.5");
  const uid=c.run('passenger.netId'),bid=c.run('shelter.netId');
  const order={type:'garrison',entities:[uid],target:bid};
  assert.equal(c.act(order,team),true);c.run('for(let i=0;i<600&&!passenger.ld;i++)upU(passenger,1/30)');
  assert.equal(c.run('passenger.ld===shelter'),true);
  assert.equal(c.view(team).units.some(u=>u.id===uid),false);
  assert.equal(c.view(team).buildings.find(b=>b.id===bid).passengers,1);
  assert.ok(c.view(team).buildings.find(b=>b.id===bid).commands.some(o=>o.type==='unload'));
  assert.equal(c.act({type:'stop',entities:[uid]},team),false,'loaded units cannot be commanded independently');
  assert.equal(c.act({type:'unload',entities:[bid]},team),true);
  assert.equal(c.run('passenger.ld'),null);assert.equal(c.run('shelter.cg.length'),0);
  assert.equal(c.view(team).units.some(u=>u.id===uid),true);
  assert.equal(c.run('S.wt[(passenger.y|0)*W+(passenger.x|0)]'),0);
 }
});

test('invalid garrison and repair targets, routes, capacity, manifests and ownership reject without any mutation',()=>{
 for(const scenario of ['foreign','ally-garrison','unfinished','full','hidden','loaded','ship','self','unreachable','manifest']){
  const c=fixture();
  c.run("globalThis.shelter=addB(0,'tc',24,27,true)");
  let order={type:'garrison',entities:[c.ids.worker],target:c.run('shelter.netId')};
  if(scenario==='foreign')c.run('shelter.t=1');
  if(scenario==='ally-garrison')c.run("shelter.t=1;S.dip[0][1]=S.dip[1][0]='ally'");
  if(scenario==='unfinished')c.run('shelter.done=false');
  if(scenario==='full')c.run("for(let i=0;i<GAR.tc;i++){const u=addU(0,'vil',24,27);u.ld=shelter;(shelter.cg=shelter.cg||[]).push(u)}");
  if(scenario==='hidden')c.run('shelter.x=60;shelter.y=60;S.bs=S.bs.filter(b=>b!==shelter)');
  if(scenario==='loaded')c.run('worker.ld=shelter');
  if(scenario==='ship')c.run("worker.k='gal';worker.sh=1");
  if(scenario==='self')order.target=c.ids.worker;
  if(scenario==='unreachable')c.run('for(let y=19;y<=23;y++)for(let x=19;x<=23;x++)if(x===19||x===23||y===19||y===23)S.g[y*W+x]=1');
  if(scenario==='manifest')c.run('shelter.cg=[guest];guest.ld=shelter');
  const before=c.worldHash();assert.equal(c.act(order),false,scenario);assert.equal(c.worldHash(),before,scenario);
 }
});

test('authenticated repairs restore damaged buildings and ships and can finish an existing foundation',()=>{
 for(const team of [0,1]){
  for(const kind of ['house','foundation','ship']){
   const c=fixture();c.run("globalThis.repairer="+(team?'guest':'worker')+";repairer.x=23.5;repairer.y=25.5;globalThis.damaged="+(kind==='ship'?"addU("+team+",'gal',24.5,25.5)":"addB("+team+",'house',24,25,"+(kind!=='foundation')+")")+";damaged.hp=10");
   const uid=c.run('repairer.netId'),tid=c.run('damaged.netId'),before=c.run('damaged.hp');
   if(kind==='foundation')c.run('damaged.pr=B.house.bt-.02');
   assert.equal(c.act({type:'repair',entities:[uid],target:tid},team),true);
   c.run('upU(repairer,1/30)');
   assert.ok(c.run('damaged.hp')>before,kind);
   if(kind==='foundation')assert.equal(c.run('damaged.done'),true);
  }
 }
 const c=fixture();c.run("globalThis.damaged=addB(1,'house',24,25,true);damaged.hp=10;S.dip[0][1]=S.dip[1][0]='ally'");
 assert.equal(c.act({type:'repair',entities:[c.ids.worker],target:c.run('damaged.netId')}),true,'villagers can assist allied buildings');
 c.run('damaged.hp=damaged.mh');const before=c.worldHash();
 assert.equal(c.act({type:'repair',entities:[c.ids.worker],target:c.run('damaged.netId')}),false);
 assert.equal(c.worldHash(),before);
 assert.equal(c.act({type:'repair',entities:[c.ids.soldier],target:c.run('damaged.netId')}),false);
});

test('transport boarding and visible-shore landings preserve manifests, ownership and distinct safe passenger positions',()=>{
 const c=fixture();
 c.run("for(let y=30;y<42;y++)for(let x=18;x<42;x++)S.wt[y*W+x]=1;worker.x=24.5;worker.y=29.5;soldier.x=25.5;soldier.y=29.5;soldier.st=4;globalThis.ship=addU(0,'trn',24.5,30.5)");
 const ids=[c.ids.worker,c.ids.soldier],ship=c.run('ship.netId');
 assert.equal(c.act({type:'garrison',entities:ids,target:ship}),true);
 c.run('upU(worker,1/30);upU(soldier,1/30)');
 assert.equal(c.run('ship.cg.length'),2);
 const order={type:'disembark',entities:[ship],point:{x:30.5,y:29.5}};
 const initial=c.worldHash();
 assert.equal(c.act({...order,point:{x:60,y:60}}),false);
 assert.equal(c.act({...order,point:{x:30.5,y:32.5}}),false);
 assert.equal(c.worldHash(),initial);
 assert.equal(c.act(order),true);
 c.run('for(let i=0;i<500&&ship.cg.length;i++)upU(ship,1/30)');
 assert.equal(c.run('ship.cg.length'),0);
 assert.equal(c.run('worker.ld===null&&soldier.ld===null'),true);
 assert.notEqual(c.run('(worker.y|0)*W+(worker.x|0)'),c.run('(soldier.y|0)*W+(soldier.x|0)'));
 assert.equal(c.run('S.wt[(worker.y|0)*W+(worker.x|0)]'),0);
 assert.equal(c.run('S.wt[(soldier.y|0)*W+(soldier.x|0)]'),0);
});

test('strict shelter protocol rejects extra fields and battlefield target mode submits only after choosing a target',()=>{
 const c=fixture(),f=mapFixture(c);
 c.run("globalThis.shelter=addB(0,'tc',24,27,true)");f.refresh();
 for(const order of [
  {type:'garrison',entities:[c.ids.worker],target:c.run('shelter.netId')},
  {type:'repair',entities:[c.ids.worker],target:c.run('shelter.netId')},
  {type:'unload',entities:[c.run('shelter.netId')]},
  {type:'disembark',entities:['u999'],point:{x:25,y:29}}
 ]){
  assert.equal(c.CK_SIM_SYNC.validOrder(order,72),true);
  assert.equal(c.CK_SIM_SYNC.validOrder({...order,value:'forged'},72),false);
  assert.equal(c.CK_SIM_SYNC.validOrder({...order,point:{x:NaN,y:0}},72),false);
 }
 f.map.choose({x:23.5,y:22.5});
 f.map.control({7:true},{7:true});
 f.map.control({}, {7:true},[1,0]);f.map.control({0:true},{7:true,0:true});
 assert.equal(f.orders.length,0,'RT chooses garrison target mode without issuing an order');
 f.refresh();f.map.control({},{});f.map.choose({x:25,y:28});
 assert.equal(f.orders.length,1);assert.equal(f.orders[0].type,'garrison');
 assert.equal(f.orders[0].target,c.run('shelter.netId'));
 assert.deepEqual(Array.from(f.orders[0].entities),[c.ids.soldier]);
 f.refresh();f.map.control({7:true},{7:true});f.map.control({}, {7:true},[1,0]);
 f.map.control({0:true},{7:true,0:true});f.map.control({1:true},{1:true});f.map.control({},{});
 f.map.choose({x:25,y:28});assert.equal(f.orders.length,1,'B cancels target mode, allowing ordinary building selection');
 assert.equal(f.map.selected(),c.run('shelter.netId'));
});

test('battlefield copies animation poses and construction progress without changing simulation facing or hashes',()=>{
 const c=fixture();c.run("worker.p=[[22.5,21.5]];worker.dr=5;soldier.o='a';soldier.cd=.2;guest.o='rep';guest.p=[];globalThis.foundation=addB(0,'house',24,27,false);foundation.pr=B.house.bt*.4");
 const before=c.worldHash(),view=c.view(0);
 const worker=view.units.find(u=>u.id===c.ids.worker),soldier=view.units.find(u=>u.id===c.ids.soldier);
 assert.equal(worker.pose.state,1);assert.equal(worker.pose.heading,0);assert.equal(worker.team,0);
 assert.equal(soldier.pose.state,2);
 assert.equal(view.battlefield.enemies.find(u=>u.id===c.ids.guest).pose.state,3);
 assert.equal(view.battlefield.enemies.some(u=>u.id===c.ids.hidden),false);
 const b=view.buildings.find(b=>b.id===c.run('foundation.netId'));
 assert.equal(b.complete,false);assert.ok(Math.abs(b.progress-.4)<1e-9);
 worker.pose.heading=9;b.progress=1;
 assert.equal(c.run('worker.dr'),5);assert.ok(Math.abs(c.run('foundation.pr/B.house.bt')-.4)<1e-9);
 assert.equal(c.worldHash(),before);
});

test('named SVG icons cover every unit and building with distinct, bounded pixel art',()=>{
 const c=fixture();
 const catalog=JSON.parse(c.run('JSON.stringify({icons:PIXEL_ICONS,units:UNIT_ICONS,buildings:BUILDING_ICONS,unitKeys:Object.keys(U),buildingKeys:Object.keys(B)})'));
 assert.equal(Object.keys(catalog.icons).length,69);
 for(const k of catalog.unitKeys)assert.ok(catalog.icons[catalog.units[k]],'missing unit '+k);
 for(const k of catalog.buildingKeys)assert.ok(catalog.icons[catalog.buildings[k]],'missing building '+k);
 const artworks=new Set();
 for(const [name,svg] of Object.entries(catalog.icons)){
  assert.ok(svg.startsWith('<svg '));assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('id="'+name+'"'));assert.ok(svg.includes('viewBox="0 0 32 32"'));
  assert.ok(svg.includes('shape-rendering="crispEdges"'));assert.ok(svg.includes('fill="currentColor"'));
  const body=svg.slice(svg.indexOf('>')+1,-6);assert.ok(!artworks.has(body),'duplicate artwork '+name);artworks.add(body);
  const rects=[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"\/>/g)];
  assert.ok(rects.length>0);
  for(const m of rects){const [x,y,w,h]=m.slice(1,5).map(Number);assert.ok(w>0&&h>0&&x+w<=32&&y+h<=32,'clipped rectangle in '+name);}
 }
});

test('SVG rendering takes precedence over atlases, preserves team colours and depth, and never mutates game state',()=>{
 const c=fixture();c.run(`
  regAtlas('legacy',{}, {anims:{'mil/idle/0':{frames:[{x:0,y:0,w:16,h:16,ax:8,ay:14}]}}});
  globalThis.pixelDraws=[];const originalPixel=paintPixelIcon;
  paintPixelIcon=function(g,name,tc,w,h,bottom){pixelDraws.push({name,tc,w,h});return originalPixel(g,name,tc,w,h,bottom)};
  worker.p=[[22.5,21.5]];S.t=.05;globalThis.castle=addB(0,'tc',24,27,true);
 `);
 const before=c.worldHash(),f=mapFixture(c);
 const calls=JSON.parse(c.run('JSON.stringify(pixelDraws)'));
 assert.ok(calls.some(d=>d.name==='soldier-icon'&&d.tc===c.run('teamColor(0)')));
 assert.ok(calls.some(d=>d.name==='soldier-icon'&&d.tc===c.run('teamColor(1)')));
 assert.ok(calls.some(d=>d.name==='villager-icon'));
 assert.ok(calls.some(d=>d.name==='town-centre-icon'));
 assert.ok(calls.findLastIndex(d=>d.name==='town-centre-icon')>calls.findIndex(d=>d.name==='soldier-icon'),'nearer building draws after the unit behind it');
 assert.ok(f.draws.filter(d=>d[0]==='drawImage').every(d=>d[1].pixelIconName),'legacy atlas cannot replace named icons');
 assert.equal(c.worldHash(),before);
 c.run('S.t=.15');const nextHash=c.worldHash();f.refresh();assert.equal(c.worldHash(),nextHash);
});

test('native icon rasters reuse the team cache and restore the caller canvas state',()=>{
 const c=fixture();
 c.run(`
  globalThis.nativeDraws=[];
  globalThis.saved=[];
  globalThis.iconContext={imageSmoothingEnabled:true,fillStyle:'unchanged',
   save(){saved.push(this.imageSmoothingEnabled)},restore(){this.imageSmoothingEnabled=saved.pop()},
   drawImage(...args){nativeDraws.push(args)}};
  paintPixelIcon(iconContext,'soldier-icon',teamColor(0),44,56);
  paintPixelIcon(iconContext,'soldier-icon',teamColor(0),33,47);
  paintPixelIcon(iconContext,'soldier-icon',teamColor(1),44,56);
 `);
 assert.equal(c.run('nativeDraws[0][0]===nativeDraws[1][0]'),true,'size changes reuse the 32-pixel raster');
 assert.equal(c.run('nativeDraws[0][0]===nativeDraws[2][0]'),false,'team palettes have separate rasters');
 assert.equal(c.run('nativeDraws[0][0].width'),32);assert.equal(c.run('nativeDraws[0][0].height'),32);
 assert.equal(c.run('nativeDraws[0][0].pixelIconName'),'soldier-icon');
 assert.equal(c.run('iconContext.imageSmoothingEnabled'),true);assert.equal(c.run('iconContext.fillStyle'),'unchanged');
});

test('heading-aware atlas lookup handles four and eight directions while retaining existing callers',()=>{
 const c=fixture();
 c.run(`
  const f=x=>({x,y:0,w:1,h:1,ax:0,ay:0});
  regAtlas('four',{}, {anims:{'test/idle/0':{dirs:[[f(0)],[f(1)],[f(2)],[f(3)]]}}});
  regAtlas('eight',{}, {anims:{'other/idle/0':{dirs:Array.from({length:8},(_,i)=>[f(i)])}}});
 `);
 assert.equal(c.run("assetFrame('test',0,0,0,0,Math.PI).f.x"),2);
 assert.equal(c.run("assetFrame('other',0,0,0,0,Math.PI).f.x"),4);
 assert.equal(c.run("assetFrame('test',0,0,0,0,-Math.PI/2).f.x"),3);
 assert.equal(c.run("assetFrame('test',0,0,3,0).f.x"),3,'existing directional index semantics stay intact');
});

test('SVG art and unfinished-building indicators remain available with missing or undrawable atlases',()=>{
 const c=fixture();c.run("globalThis.foundation=addB(0,'house',24,27,false);foundation.pr=B.house.bt*.5");
 const before=c.worldHash(),f=mapFixture(c);assert.ok(f.draws.some(d=>d[0]==='drawImage'&&d[1].pixelIconName));
 assert.ok(f.draws.some(d=>d[0]==='strokeRect'||d[0]==='ellipse'));
 c.run("regAtlas('failed',{}, {anims:{'vil/idle/0':{frames:[{x:0,y:0,w:16,h:16,ax:8,ay:14}]}}})");
 const canvas={style:{},setAttribute(){},addEventListener(){},getContext:()=>new Proxy({},{get:(_,key)=>key==='drawImage'?()=>{throw Error('Image unavailable')}:()=>{}})};
 const map=c.CK_UNIT_MAP.create({canvas,description:{textContent:''},submit:()=>({ok:true}),leave(){}});
 c.testFallbackMap=map;c.run('testFallbackMap.refresh(S,0,W,H,true)');
 assert.equal(c.worldHash(),before);
});
