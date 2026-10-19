import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from './helpers/headless-game.mjs';

const syncSource = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const protocolContext = { TextEncoder, window: {} };
vm.runInNewContext(syncSource, protocolContext);
const sync = protocolContext.window.CK_SIM_SYNC;
const roster = sync.lockRoster('host-session', 'guest-session', 2);
const packet = (sid, team, seq, frame, order) => ({ v:sync.VERSION, sid, team, seq, frame, order });

test('host locks exactly two distinct human sessions to non-overlapping team slots', () => {
  assert.equal(sync.validRoster(roster, 'host-session', 'guest-session', 2), true);
  assert.equal(sync.rosterTeam(roster,'host-session'),0);
  assert.equal(sync.rosterTeam(roster,'guest-session'),1);
  assert.equal(sync.rosterTeam(roster,'outsider'),null);
  assert.equal(Object.isFrozen(roster), true);
  assert.equal(Object.isFrozen(roster.slots), true);
  assert.throws(() => sync.lockRoster('same','same',2), /distinct/);
  assert.throws(() => sync.lockRoster('host-session','guest-session',1), /at least two/);
  for(const bogus of [
    {...roster,kingdomCount:4},
    {...roster,slots:[...roster.slots].reverse()},
    {...roster,slots:[roster.slots[0],{sid:'host-session',team:1,role:'guest'}]},
    {...roster,slots:[roster.slots[0],{sid:'guest-session',team:0,role:'guest'}]},
    {...roster,slots:[roster.slots[0],{sid:'guest-session',team:1,role:'host'}]},
    {...roster,slots:[roster.slots[0],{sid:'guest-session',team:1,role:'guest',admin:true}]}
  ]) assert.equal(sync.validRoster(bogus,'host-session','guest-session',2),false);
  assert.equal(sync.validRoster(roster,'host-session','outsider',2),false);
});

test('host validates identity, authorization, execution time and replay protection', () => {
  const objects = new Map([
    ['b10',{netId:'b10',t:0,hp:100,done:true}],
    ['b20',{netId:'b20',t:1,hp:100,done:true}],
    ['u11',{netId:'u11',t:0,hp:30,ld:null}],
    ['u21',{netId:'u21',t:1,hp:30,ld:null}]
  ]);
  const applied=[];
  const host=sync.createCommandHost({
    roster,mapSize:128,lookupEntity:id=>objects.get(id),
    execute:(order,team,frame)=>{applied.push({order,team,frame});return true;}
  });
  const ownTrain = packet('guest-session',1,1,7,{type:'train',entities:['b20'],value:'vil'});
  const attackHost = packet('guest-session',1,1,7,{type:'train',entities:['b10'],value:'vil'});
  assert.equal(host.receive(attackHost,'guest-session',2).reason,'unauthorized-order');
  assert.equal(host.receive(ownTrain,'forged-session',2).reason,'invalid');
  assert.equal(host.receive(ownTrain,'guest-session',2).ok,true);
  assert.equal(host.receive(ownTrain,'guest-session',2).reason,'duplicate');
  assert.equal(host.applyFrame(6).length,0);
  assert.equal(applied.length,0);
  assert.equal(host.applyFrame(7).length,1);
  assert.equal(applied.length,1);
  assert.equal(applied[0].team,1);
  assert.equal(applied[0].frame,7);
  assert.equal(host.pending(),0);
});

test('queued orders are copied and ownership checked again at application frame', () => {
  const objects = new Map([
    ['b10',{netId:'b10',t:0,hp:100,done:true}],
    ['b20',{netId:'b20',t:1,hp:100,done:true}]
  ]);
  const done=[];
  const host=sync.createCommandHost({roster,mapSize:128,lookupEntity:id=>objects.get(id),
    execute:(order)=>{done.push(order.value);return true;}});
  const p=packet('guest-session',1,1,10,{type:'research',entities:['b20'],value:'loom'});
  assert.equal(host.receive(p,'guest-session',5).ok,true);
  p.order.value='injected-after-receipt';
  assert.equal(host.applyFrame(10)[0].ok,true);
  assert.deepEqual(done,['loom']);
  const p2=packet('guest-session',1,2,12,{type:'train',entities:['b20'],value:'vil'});
  assert.equal(host.receive(p2,'guest-session',8).ok,true);
  objects.get('b20').t=0; // ownership changed before command frame
  const results=host.applyFrame(12);
  assert.equal(results[0].ok,false);
  assert.equal(results[0].reason,'stale-ownership');
  assert.deepEqual(done,['loom']);
});

test('host rejects bad entity categories, expired buildings and malformed command points', () => {
  const objects = new Map([
    ['b10',{netId:'b10',t:0,hp:100,done:false}],
    ['u11',{netId:'u11',t:0,hp:30,ld:null}]
  ]);
  const host=sync.createCommandHost({roster,mapSize:128,lookupEntity:id=>objects.get(id),execute:()=>true});
  for(const order of [
    {type:'train',entities:['u11'],value:'vil'},
    {type:'train',entities:['b10'],value:'vil'},
    {type:'move',entities:['b10'],point:{x:2,y:3}},
    {type:'move',entities:['u11'],point:{x:2,y:3,cheat:1}},
    {type:'move',entities:['u11'],point:{x:2,y:3,toJSON:()=>({x:2,y:3})}},
    {type:'train',entities:['b10','b10'],value:'vil'}
  ]) assert.equal(host.receive(packet('host-session',0,1,10,order),'host-session',2).ok,false);
});

test('authoritative queue can execute the real game training operation for BOTH teams', () => {
  const { source, sandbox } = headlessGame();
  const harness = [
    "globalThis.__NETWORK_MATCH_TEST__ = () => {",
    " seedOv=123456; msz=0; kingdoms=2; cmp=null; gameMode=0; startAge=0; startRes=0; startArmy=0; start();",
    " const byTeam = [0,1].map(t=>S.bs.find(b=>b.t===t&&b.k==='tc'&&b.done));",
    " if(byTeam.some(x=>!x))throw Error('Missing starting Town Centre');",
    " const roster=window.CK_SIM_SYNC.lockRoster('host-session','guest-session',2);",
    " const host=window.CK_SIM_SYNC.createCommandHost({",
    "   roster,mapSize:W,",
    "   lookupEntity:id=>S.us.find(u=>u.netId===id)||S.bs.find(b=>b.netId===id),",
    "   execute:(order,team)=>{if(order.type!=='train')return false;const b=S.bs.find(x=>x.netId===order.entities[0]);return b.t===team&&train(b,order.value);}",
    " });",
    " const first=byTeam.map(b=>({id:b.netId,queue:b.q.length,food:S.res[b.t].f}));",
    " const mkPacket=(sid,team,id)=>({v:window.CK_SIM_SYNC.VERSION,sid,team,seq:1,frame:6,order:{type:'train',entities:[id],value:'vil'}});",
    " const guest=host.receive(mkPacket('guest-session',1,first[1].id),'guest-session',2);",
    " const hostOrder=host.receive(mkPacket('host-session',0,first[0].id),'host-session',2);",
    " const crossTeam=host.receive({...mkPacket('host-session',0,first[1].id),seq:2},'host-session',2);",
    " const early=host.applyFrame(5);",
    " const applied=host.applyFrame(6);",
    " return {guest:guest.ok,hostOrder:hostOrder.ok,crossTeam:crossTeam.reason,",
    "   early:early.length,applied:applied.map(r=>r.ok),queued:byTeam.map(b=>b.q.length),",
    "   foodSpent:byTeam.map(b=>first[b.t].food-S.res[b.t].f),sameIds:byTeam.map(b=>b.netId)};",
    "};"
  ].join('\n');
  vm.runInNewContext(source+'\n'+syncSource+'\n'+harness,sandbox,{filename:'headless-network-host-execution.js'});
  const out = sandbox.__NETWORK_MATCH_TEST__();
  assert.equal(out.guest,true);
  assert.equal(out.hostOrder,true);
  assert.equal(out.crossTeam,'unauthorized-order');
  assert.equal(out.early,0);
  assert.deepEqual(Array.from(out.applied),[true,true]);
  assert.deepEqual(Array.from(out.queued),[1,1]);
  assert.ok(out.foodSpent.every(x=>x>0), 'normal train() must deduct real resources');
  assert.notEqual(out.sameIds[0],out.sameIds[1]);
});
