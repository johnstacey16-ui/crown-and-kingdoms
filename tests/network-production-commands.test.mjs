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

test('attacks honour hostility and No Attack stance; forged enemy commands cannot change orders', () => {
  const out=world(`
    const hostile=S.us.find(u=>u.t===0&&u.hp>0&&!u.ld);
    const guest=S.us.find(u=>u.t===1&&u.hp>0&&!u.ld);
    const soldier=addU(1,'mil',guest.x+.25,guest.y+.25);
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

test('the production command executor is loaded but never consumes untrusted Supabase packets', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const transport=readFileSync(new URL('../multiplayer.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(html,/network-sync\.js"><\/script><script src="\.\/js\/network-commands\.js"/);
  assert.match(sw,/\.\/js\/network-commands\.js/);
  assert.match(transport,/synchronizedWorld: false/);
  assert.doesNotMatch(transport,/CK_GAME_COMMANDS\.execute/);
});
