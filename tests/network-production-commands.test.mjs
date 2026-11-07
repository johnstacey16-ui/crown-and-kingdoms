import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { headlessGame } from './helpers/headless-game.mjs';

const protocol = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const commands = readFileSync(new URL('../js/network-commands.js', import.meta.url), 'utf8');
function world(body) {
  const { source, sandbox } = headlessGame();
  const harness = `
    seedOv=123456; msz=0; kingdoms=2; cmp=null; gameMode=0;
    startAge=0; startRes=0; startArmy=0; start();
    const sync=window.CK_SIM_SYNC, adapter=window.CK_GAME_COMMANDS;
    const roster=sync.lockRoster('host-session','guest-session',2);
    const host=sync.createCommandHost({roster,mapSize:W,
      lookupEntity: adapter.lookup,
      execute: adapter.execute});
    const packet=(sid,team,seq,frame,order)=>({v:sync.VERSION,sid,team,seq,frame,order});
    globalThis.__TEST_RESULT__ = (()=>{ ${body} })();
  `;
  vm.runInNewContext(source + '\n' + protocol + '\n' + commands + '\n' + harness,
    sandbox, { filename: 'production-network-command-integration.js' });
  return sandbox.__TEST_RESULT__;
}

test('two different human teams train through the same host frame and only their own budgets change', () => {
  const result=world(`
    const tc=[0,1].map(t=>S.bs.find(b=>b.t===t&&b.k==='tc'&&b.done));
    const food=S.res.map(q=>q.f);
    const before=S.sel.slice();
    const req=(sid,team,id)=>packet(sid,team,1,6,{type:'train',entities:[id],value:'vil'});
    const guest=host.receive(req('guest-session',1,tc[1].netId),'guest-session',2);
    const self=host.receive(req('host-session',0,tc[0].netId),'host-session',2);
    const forged=host.receive(packet('host-session',0,2,8,
      {type:'train',entities:[tc[1].netId],value:'vil'}),'host-session',2);
    const early=host.applyFrame(5).length;
    const result=host.applyFrame(6);
    return { guest:guest.ok,self:self.ok,forged:forged.reason,early,
      results:result.map(x=>x.ok), queue:tc.map(b=>b.q.length),
      costs:S.res.map((q,t)=>food[t]-q.f), selectionUnchanged:S.sel.length===before.length };
  `);
  assert.equal(result.guest,true);
  assert.equal(result.self,true);
  assert.equal(result.forged,'unauthorized-order');
  assert.equal(result.early,0);
  assert.deepEqual(Array.from(result.results),[true,true]);
  assert.deepEqual(Array.from(result.queue),[1,1]);
  assert.ok(result.costs.every(v=>v>0));
  assert.equal(result.selectionUnchanged,true);
});

test('queue cancel refunds the owning team, rally uses stable building identity', () => {
  const out=world(`
    const b=S.bs.find(b=>b.t===1&&b.k==='tc'&&b.done);
    const food=S.res[1].f;
    const trainCmd={type:'train',entities:[b.netId],value:'vil'};
    const cancelCmd={type:'cancel',entities:[b.netId]};
    const rallyCmd={type:'rally',entities:[b.netId],point:{x:b.x+2,y:b.y+2}};
    const first=host.receive(packet('guest-session',1,1,6,trainCmd),'guest-session',2);
    const second=host.receive(packet('guest-session',1,2,8,cancelCmd),'guest-session',2);
    const third=host.receive(packet('guest-session',1,3,10,rallyCmd),'guest-session',2);
    const results=[host.applyFrame(6),host.applyFrame(8),host.applyFrame(10)];
    return {accepted:[first.ok,second.ok,third.ok],
      results:results.map(a=>a[0].ok), queue:b.q.length,refund:S.res[1].f===food,
      rally:!!b.rally&&b.rally.x===b.x+2&&b.rally.y===b.y+2&&b.rally.t===null};
  `);
  assert.deepEqual(Array.from(out.accepted),[true,true,true]);
  assert.deepEqual(Array.from(out.results),[true,true,true]);
  assert.equal(out.queue,0);
  assert.equal(out.refund,true);
  assert.equal(out.rally,true);
});

test('five-unit training is one authenticated scheduled request and charges only accepted units',()=>{
  for(const limit of ['none','resources','queue','population','full','research']){
    const out=world(`
      const b=S.bs.find(b=>b.t===1&&b.k==='tc'&&b.done),cost=U.vil.cost.f;
      S.res[1].f=1000;popLimit=300;addB(1,'house',2,2,true);
      if('${limit}'==='resources')S.res[1].f=cost*2;
      if('${limit}'==='queue')for(let i=0;i<3;i++)train(b,'vil');
      if('${limit}'==='population')popLimit=popOf(1)+2;
      if('${limit}'==='full')popLimit=popOf(1);
      if('${limit}'==='research')b.rs={k:'age',t:10};
      const before={food:S.res[1].f,queue:b.q.length,hostFood:S.res[0].f};
      const request={type:'train',entities:[b.netId],value:'vil',count:5};
      const accepted=host.receive(packet('guest-session',1,1,6,request),'guest-session',2);
      const untouched=b.q.length===before.queue&&S.res[1].f===before.food;
      const result=host.applyFrame(6);
      return {accepted:accepted.ok,untouched,ok:result[0].ok,
        queued:b.q.length-before.queue,cost:S.res[1].f-before.food,
        unitCost:cost,hostUnchanged:S.res[0].f===before.hostFood};
    `);
    const expected={none:5,resources:2,queue:2,population:2,full:0,research:0}[limit];
    assert.equal(out.accepted,true,limit);assert.equal(out.untouched,true,limit);
    assert.equal(out.ok,expected>0,limit);assert.equal(out.queued,expected,limit);
    assert.equal(out.cost,expected?-expected*out.unitCost:0,limit);assert.equal(out.hostUnchanged,true,limit);
  }
});

test('five-unit training cannot bypass ownership, stale ownership or building eligibility',()=>{
  const out=world(`
    const b=S.bs.find(b=>b.t===1&&b.k==='tc'&&b.done);
    const command={type:'train',entities:[b.netId],value:'vil',count:5};
    const before=S.res.map(r=>r.f);
    const forged=host.receive(packet('host-session',0,1,6,command),'host-session',2);
    const accepted=host.receive(packet('guest-session',1,1,6,command),'guest-session',2);
    b.t=0;
    const stale=host.applyFrame(6);
    b.t=1;b.done=false;
    const unfinished=adapter.execute(command,1,7);
    b.done=true;b.hp=0;
    const dead=adapter.execute(command,1,8);
    return {forged:forged.ok,accepted:accepted.ok,stale:stale[0].ok,unfinished,dead,
      queue:b.q.length,resourcesUnchanged:S.res.every((r,t)=>r.f===before[t])};
  `);
  assert.equal(out.forged,false);assert.equal(out.accepted,true);assert.equal(out.stale,false);
  assert.equal(out.unfinished,false);assert.equal(out.dead,false);
  assert.equal(out.queue,0);assert.equal(out.resourcesUnchanged,true);
});

test('selected building training balances a total batch with stable ties and respects unavailable production',()=>{
  for(const scenario of ['single','uneven','tie','reverse','research','full','resources','population','incompatible']){
    const out=world(`
      const first=S.bs.find(b=>b.t===1&&b.k==='tc'&&b.done);
      const second=addB(1,'${scenario==='incompatible'?'bar':'tc'}',2,2,true);
      addB(1,'house',6,2,true);popLimit=300;S.res[1].f=1000;
      if(['single','uneven'].includes('${scenario}'))for(let i=0;i<2;i++)train(first,'vil');
      if('${scenario}'==='research')first.rs={k:'age',t:10};
      if('${scenario}'==='full')for(let i=0;i<5;i++)train(first,'vil');
      if('${scenario}'==='resources')S.res[1].f=U.vil.cost.f*2;
      if('${scenario}'==='population')popLimit=popOf(1)+2;
      const before={queues:[first.q.length,second.q.length],food:S.res[1].f,hostFood:S.res[0].f};
      const entities='${scenario}'==='reverse'?[second.netId,first.netId]:[first.netId,second.netId];
      const command={type:'train',entities,value:'vil',count:${scenario==='single'?1:5}};
      const accepted=host.receive(packet('guest-session',1,1,6,command),'guest-session',2);
      command.entities.pop(); // Ingress must own a copy of the full selection.
      const untouched=first.q.length===before.queues[0]&&second.q.length===before.queues[1]&&S.res[1].f===before.food;
      const result=host.applyFrame(6);
      return {accepted:accepted.ok,ok:result[0].ok,untouched,queues:[first.q.length,second.q.length],
        paid:(before.food-S.res[1].f)/U.vil.cost.f,hostUnchanged:S.res[0].f===before.hostFood};
    `);
    const queues={single:[2,1],uneven:[4,3],tie:[3,2],reverse:[2,3],research:[0,5],full:[5,5],resources:[1,1],population:[1,1],incompatible:[5,0]}[scenario];
    assert.equal(out.accepted,true,scenario);assert.equal(out.ok,true,scenario);assert.equal(out.untouched,true,scenario);
    assert.deepEqual(Array.from(out.queues),queues,scenario);
    assert.equal(out.paid,['resources','population'].includes(scenario)?2:scenario==='single'?1:5,scenario);
    assert.equal(out.hostUnchanged,true,scenario);
  }
});

test('multi-building ownership is checked for every member and research and cancellation remain single-building',()=>{
  for(const stale of [false,true]){
    const out=world(`
      const a=S.bs.find(b=>b.t===1&&b.k==='tc'),b=addB(1,'tc',2,2,true);
      const command={type:'train',entities:[a.netId,b.netId],value:'vil',count:5};
      const before=S.res[1].f;
      if(!${stale})b.t=0;
      const received=host.receive(packet('guest-session',1,1,6,command),'guest-session',2);
      if(${stale})b.t=0;
      const result=${stale} ? host.applyFrame(6)[0] : null;
      b.t=1;
      const otherTypes=[{type:'cancel'}, {type:'research',value:'age'}];
      const others=otherTypes.map(order=>host.receive(packet('guest-session',1,2,8,{...order,entities:[a.netId,b.netId]}),'guest-session',2).ok);
      return {received:received.ok,result:result&&result.ok,queues:[a.q.length,b.q.length],
        sameFood:S.res[1].f===before,others};
    `);
    assert.equal(out.received,stale);if(stale)assert.equal(out.result,false);
    assert.deepEqual(Array.from(out.queues),[0,0]);assert.equal(out.sameFood,true);
    assert.deepEqual(Array.from(out.others),[false,false]);
  }
});

test('attacks honour hostility and No Attack stance; forged enemy commands cannot change orders', () => {
  const out=world(`
    const hostile=S.us.find(u=>u.t===0&&u.hp>0&&!u.ld);
    const guest=S.us.find(u=>u.t===1&&u.hp>0&&!u.ld);
    const soldier=addU(1,'mil',guest.x+.25,guest.y+.25);
    hostile.x=soldier.x+1;hostile.y=soldier.y;
    const stop={type:'stance',entities:[soldier.netId],value:'no-attack'};
    const strike={type:'attack',entities:[soldier.netId],target:hostile.netId};
    const allow={type:'stance',entities:[soldier.netId],value:'aggressive'};
    const enemyForge={type:'attack',entities:[hostile.netId],target:soldier.netId};
    const spoof=host.receive(packet('guest-session',1,1,6,enemyForge),'guest-session',2);
    const receipts=[
      host.receive(packet('guest-session',1,1,6,stop),'guest-session',2),
      host.receive(packet('guest-session',1,2,8,strike),'guest-session',2),
      host.receive(packet('guest-session',1,3,10,allow),'guest-session',2),
      host.receive(packet('guest-session',1,4,12,strike),'guest-session',2)
    ];
    const applied=[host.applyFrame(6)[0],host.applyFrame(8)[0],
      host.applyFrame(10)[0],host.applyFrame(12)[0]];
    return {spoof:spoof.reason, receipts:receipts.map(x=>x.ok),
      applied:applied.map(x=>x.ok), reason:applied[1].reason,
      stance:soldier.st, target:soldier.tg===hostile, order:soldier.o};
  `);
  assert.equal(out.spoof,'unauthorized-order');
  assert.deepEqual(Array.from(out.receipts),[true,true,true,true]);
  assert.deepEqual(Array.from(out.applied),[true,false,true,true]);
  assert.equal(out.reason,'rejected-by-simulation');
  assert.equal(out.stance,0);
  assert.equal(out.target,true);
  assert.equal(out.order,'a');
});

test('attack-move refuses mixed civilian teams without mutating any of the selected units', () => {
  const out=world(`
    const base=S.us.find(u=>u.t===1);
    const soldier=addU(1,'mil',base.x+.1,base.y+.1);
    const other=addU(1,'arc',base.x+.2,base.y+.2);
    const prior=soldier.o;
    const point={x:base.x+3,y:base.y+3};
    const bad={type:'attack-move',entities:[soldier.netId,base.netId],point};
    const good={type:'attack-move',entities:[soldier.netId,other.netId],point};
    host.receive(packet('guest-session',1,1,6,bad),'guest-session',2);
    host.receive(packet('guest-session',1,2,8,good),'guest-session',2);
    const invalid=host.applyFrame(6)[0],unchanged=soldier.o===prior&&base.o==='g'||soldier.o===prior;
    const valid=host.applyFrame(8)[0];
    return {invalid:invalid.ok, unchanged, valid:valid.ok, patrol:[soldier.o,other.o],
      destinations:[soldier.pt.b[0],other.pt.b[1]]};
  `);
  assert.equal(out.invalid,false);
  assert.equal(out.unchanged,true);
  assert.equal(out.valid,true);
  assert.deepEqual(Array.from(out.patrol),['p','p']);
});

test('research and training still use production prerequisites, not client claims', () => {
  const out=world(`
    const tc=S.bs.find(b=>b.t===1&&b.k==='tc');
    const invalid=host.receive(packet('guest-session',1,1,6,
      {type:'research',entities:[tc.netId],value:'nonexistent'}),'guest-session',2);
    const result=host.applyFrame(6)[0];
    const empty=host.receive(packet('guest-session',1,2,8,
      {type:'cancel',entities:[tc.netId]}),'guest-session',2);
    const emptyResult=host.applyFrame(8)[0];
    return {invalid:invalid.ok,rejected:!result.ok,
      empty:empty.ok,emptyRejected:!emptyResult.ok,queue:tc.q.length};
  `);
  assert.equal(out.invalid,true);
  assert.equal(out.rejected,true);
  assert.equal(out.empty,true);
  assert.equal(out.emptyRejected,true);
  assert.equal(out.queue,0);
});

test('host-framed guest movement uses actual A* paths without changing local controller selection', () => {
  const out=world(`
    const unit=S.us.find(u=>u.t===1&&u.k==='vil'&&!u.ld);
    const own=S.us.find(u=>u.t===0&&u.k==='vil');
    const selected=S.sel.slice();
    let destination=null;
    for (const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[3,3],[-3,-3]]) {
      const x=Math.floor(unit.x)+dx+.5,y=Math.floor(unit.y)+dy+.5;
      if(x<1||y<1||x>=W-1||y>=H-1)continue;
      const p=path(unit,gp(x,y,1));
      if(p&&p.length){destination={x,y};break}
    }
    if(!destination)throw Error('No reachable guest movement test destination');
    const before=window.CK_SIM_SYNC.worldCheckpoint(S,2).hash;
    const order={type:'move',entities:[unit.netId],point:destination};
    const foreign={type:'move',entities:[own.netId],point:destination};
    const rejected=host.receive(packet('guest-session',1,1,8,foreign),'guest-session',2);
    const accepted=host.receive(packet('guest-session',1,1,8,order),'guest-session',2);
    const premature=host.applyFrame(7).length;
    const applied=host.applyFrame(8)[0];
    return {rejected:rejected.reason,accepted:accepted.ok,premature,
      applied:applied.ok,order:unit.o,pathLength:unit.p.length,
      worldChanged:window.CK_SIM_SYNC.worldCheckpoint(S,2).hash!==before,
      selectionUnchanged:S.sel.length===selected.length&&S.sel.every((e,i)=>e===selected[i])};
  `);
  assert.equal(out.rejected,'unauthorized-order');
  assert.equal(out.accepted,true);
  assert.equal(out.premature,0);
  assert.equal(out.applied,true);
  assert.equal(out.order,'m');
  assert.ok(out.pathLength>0);
  assert.equal(out.worldChanged,true);
  assert.equal(out.selectionUnchanged,true);
});

test('identical seeded production worlds produce matching hashes after the same host command frames', () => {
  const script=`
    const tc=[0,1].map(t=>S.bs.find(b=>b.t===t&&b.k==='tc'&&b.done));
    host.receive(packet('host-session',0,1,6,
      {type:'train',entities:[tc[0].netId],value:'vil'}),'host-session',2);
    host.receive(packet('guest-session',1,1,6,
      {type:'train',entities:[tc[1].netId],value:'vil'}),'guest-session',2);
    const results=host.applyFrame(6);
    if(results.length!==2||results.some(r=>!r.ok))throw Error('Real host commands failed');
    for(let i=0;i<8;i++)step(DT);
    return sync.worldCheckpoint(S,8);
  `;
  const first=world(script),second=world(script);
  assert.equal(first.frame,8);
  assert.equal(first.hash,second.hash);
});

test('the production command executor is loaded but never consumes untrusted Supabase packets', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const transport=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(html,/network-sync\.js"><\/script><script src="\.\/js\/network-commands\.js"/);
  assert.match(sw,/\.\/js\/network-commands\.js/);
  assert.match(transport,/synchronizedWorld: false/);
  assert.doesNotMatch(transport,/CK_GAME_COMMANDS\.execute/);
});

test('group rally is scheduled once and atomically updates every owned production building',()=>{
 const out=world(`
  const a=S.bs.find(b=>b.t===1&&b.k==='tc'),b=addB(1,'bar',2,2,true),point={x:25.5,y:25.5},before=JSON.stringify(S.res);
  const command={type:'rally',entities:[a.netId,b.netId],point};
  const accepted=host.receive(packet('guest-session',1,1,6,command),'guest-session',2);
  const untouched=!a.rally&&!b.rally,early=host.applyFrame(5).length,result=host.applyFrame(6);
  return {accepted:accepted.ok,untouched,early,ok:result[0]?.ok,matched:[a,b].every(b=>b.rally?.x===point.x&&b.rally.y===point.y),distinct:a.rally!==b.rally,sameResources:JSON.stringify(S.res)===before};
 `);
 for(const k of ['accepted','untouched','ok','matched','distinct','sameResources'])assert.equal(out[k],true,k);assert.equal(out.early,0);
});
test('invalid group rally members and ownership changes reject without partial mutation',()=>{
 for(const scenario of ['enemy','dead','unfinished','non-production','stale']){
  const out=world(`
   const a=S.bs.find(b=>b.t===1&&b.k==='tc'),b=addB(1,'tc',2,2,true);a.rally={x:4,y:4,t:null};b.rally={x:5,y:5,t:null};
   if('${scenario}'==='enemy')b.t=0;if('${scenario}'==='dead')b.hp=0;if('${scenario}'==='unfinished')b.done=false;if('${scenario}'==='non-production')b.k='house';
   const before=JSON.stringify([a.rally,b.rally]),command={type:'rally',entities:[a.netId,b.netId],point:{x:25,y:25}},received=host.receive(packet('guest-session',1,1,6,command),'guest-session',2);
   if('${scenario}'==='stale')b.t=0;
   const result=received.ok?host.applyFrame(6):[];
   return {received:received.ok,executed:result[0]?.ok||false,unchanged:before===JSON.stringify([a.rally,b.rally])};
  `);
  assert.equal(out.executed,false,scenario);assert.equal(out.unchanged,true,scenario);
 }
});

test('both authenticated players research Paladin only at the host frame and pay their own budgets',()=>{
 const out=world(`
  S.civ=[0,14];S.age=[3,3];S.us=[];S.bs=[];S.g.fill(0);S.wt.fill(0);S.nd.fill(null);
  S.tech=[{cavl:1,hpb:{knight:20},atkb:{knight:2}},{cavl:1,hpb:{knight:20},atkb:{knight:2}}];
  S.res=S.res.map(()=>({f:2000,w:1000,g:1000,s:0}));
  const stables=[addB(0,'stable',20,20,true),addB(1,'stable',30,20,true)];
  const riders=[addU(0,'knight',24.5,20.5),addU(1,'knight',34.5,20.5)];
  const before=JSON.stringify(S.res),accepted=[];
  accepted.push(host.receive(packet('host-session',0,1,6,{type:'research',entities:[stables[0].netId],value:'pala'}),'host-session',2).ok);
  accepted.push(host.receive(packet('guest-session',1,1,6,{type:'research',entities:[stables[1].netId],value:'pala'}),'guest-session',2).ok);
  const deferred=JSON.stringify(S.res)===before&&stables.every(b=>!b.rs),results=host.applyFrame(6);
  for(const b of stables)upB(b,170);
  return {accepted,deferred,results:results.map(r=>r.ok),paid:S.res.map(r=>[r.f,r.g]),hp:riders.map(u=>u.hp),names:riders.map(u=>unitName(u.k,u.t))};
 `);
 assert.deepEqual(Array.from(out.accepted),[true,true]);assert.equal(out.deferred,true);assert.deepEqual(Array.from(out.results),[true,true]);
 assert.deepEqual(JSON.parse(JSON.stringify(out.paid)),[[700,250],[700,250]]);assert.deepEqual(Array.from(out.hp),[160,160]);assert.deepEqual(Array.from(out.names),['Paladin','Paladin']);
});

test('both authenticated players research Hussar only at the host frame and pay their own budgets',()=>{
 const out=world(`
  S.civ=[2,3];S.age=[3,3];S.us=[];S.bs=[];S.g.fill(0);S.wt.fill(0);S.nd.fill(null);
  S.tech=[{lcav:1,hpb:{scout:15},atkb:{scout:2}},{lcav:1,hpb:{scout:15},atkb:{scout:2}}];
  S.res=S.res.map(()=>({f:2000,w:1000,g:1000,s:0}));
  const stables=[addB(0,'stable',20,20,true),addB(1,'stable',30,20,true)];
  const riders=[addU(0,'scout',24.5,20.5),addU(1,'scout',34.5,20.5)];
  const before=JSON.stringify(S.res),accepted=[];
  accepted.push(host.receive(packet('host-session',0,1,6,{type:'research',entities:[stables[0].netId],value:'huss'}),'host-session',2).ok);
  accepted.push(host.receive(packet('guest-session',1,1,6,{type:'research',entities:[stables[1].netId],value:'huss'}),'guest-session',2).ok);
  const deferred=JSON.stringify(S.res)===before&&stables.every(b=>!b.rs),results=host.applyFrame(6);
  for(const b of stables)upB(b,50);
  return {accepted,deferred,results:results.map(r=>r.ok),paid:S.res.map(r=>[r.f,r.g]),hp:riders.map(u=>u.hp),names:riders.map(u=>unitName(u.k,u.t))};
 `);
 assert.deepEqual(Array.from(out.accepted),[true,true]);assert.equal(out.deferred,true);assert.deepEqual(Array.from(out.results),[true,true]);
 assert.deepEqual(JSON.parse(JSON.stringify(out.paid)),[[1500,400],[1500,400]]);assert.deepEqual(Array.from(out.hp),[75,75]);assert.deepEqual(Array.from(out.names),['Hussar','Hussar']);
});
