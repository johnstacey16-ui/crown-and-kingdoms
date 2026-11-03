import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const context = { TextEncoder, window: {} };
vm.runInNewContext(source, context, { filename: 'js/network-sync.js' });
const sync = context.window.CK_SIM_SYNC;
const order = { type: 'move', entities: ['u10', 'u11'], point: { x: 12, y: 17 } };
const packet = (seq, frame, patch = {}) => ({ v: sync.VERSION, sid: 'host-user', seq, frame, team: 0, order, ...patch });
const makeInbox = () => sync.createInbox({
  mapSize: 128, teamForSid: sid => sid === 'host-user' ? 0 : sid === 'guest-user' ? 1 : null,
  ownsEntity: (id, team) => team === 0 ? ['u10', 'u11'].includes(id) : id === 'u20'
});

test('network packet accepts a bounded gameplay command with a trusted team', () => {
  assert.equal(sync.VERSION, 2);
  assert.equal(sync.validPacket(packet(1, 8), 128), true);
  const inbox = makeInbox();
  assert.equal(inbox.receive(packet(1, 8), 'host-user', 2).ok, true);
  assert.equal(inbox.pending(), 1);
  assert.equal(inbox.drain(8).length, 1);
  assert.equal(inbox.pending(), 0);
});

test('sender identity, claimed team, entity ownership and sequence all require validation', () => {
  const inbox = makeInbox();
  assert.equal(inbox.receive(packet(1, 8), 'guest-user', 2).reason, 'invalid');
  assert.equal(inbox.receive(packet(1, 8, {team:1}), 'host-user', 2).reason, 'ownership');
  assert.equal(inbox.receive(packet(1, 8, {order:{...order,entities:['u20']}}), 'host-user', 2).reason, 'ownership');
  assert.equal(inbox.receive(packet(2, 8), 'host-user', 2).reason, 'gap');
  assert.equal(inbox.receive(packet(1, 8), 'host-user', 2).ok, true);
  assert.equal(inbox.receive(packet(1, 9), 'host-user', 2).reason, 'duplicate');
  assert.equal(inbox.receive(packet(3, 9), 'host-user', 2).reason, 'gap');
  assert.equal(inbox.receive(packet(2, 9), 'host-user', 2).ok, true);
});

test('late, unbounded-future and missed command frames fail closed', () => {
  const inbox = makeInbox();
  assert.equal(inbox.receive(packet(1, 4), 'host-user', 2).reason, 'late');
  assert.equal(inbox.receive(packet(1, 200), 'host-user', 2).reason, 'too-far-ahead');
  assert.equal(inbox.receive(packet(1, 8), 'host-user', 2).ok, true);
  assert.throws(() => inbox.drain(9), /Missed multiplayer command frame/);
});

test('frames are consumed in deterministic team/session/sequence order', () => {
  const inbox = makeInbox();
  const guest = { v:sync.VERSION, sid:'guest-user', team:1, seq:1, frame:9,
    order:{type:'move', entities:['u20'], point:{x:3,y:4}} };
  assert.equal(inbox.receive(guest, 'guest-user', 3).ok, true);
  assert.equal(inbox.receive(packet(1, 9), 'host-user', 3).ok, true);
  const result = inbox.drain(9);
  assert.equal(result.length, 2);
  assert.equal(result[0].sid, 'host-user');
  assert.equal(result[1].sid, 'guest-user');
});

test('invalid coordinates, unknown orders, duplicate IDs and oversized payloads are rejected', () => {
  for (const bad of [
    {type:'warp',entities:['u10'],point:{x:2,y:3}},
    {...order,entities:['u10','u10']},
    {...order,point:{x:Infinity,y:4}},
    {...order,point:{x:-1,y:4}},
    {...order,point:{x:128,y:4}},
    {...order,point:{x:5,y:4},eval:'game.reset()'},
    {...order,entities:Array(97).fill('u10')},
    {type:'build',entities:['u10'],point:{x:3,y:4},value:'Barracks<script>'},
  ]) assert.equal(sync.validPacket(packet(1, 8, {order:bad}), 128), false);
  assert.equal(sync.validPacket({...packet(1, 8), injected:true},128), false);
  assert.equal(sync.validPacket(packet(Number.MAX_SAFE_INTEGER+1, 8),128), false);
  assert.equal(sync.validPacket(packet(1, 8, {sid:'a'.repeat(81)}),128), false);
});

test('canonical checksums ignore object key order but flag state changes', () => {
  const a = { frame:240, res:[{f:10.25,w:20}], units:[{x:1.25,hp:30}], age:[0,1] };
  const b = { units:[{hp:30,x:1.25}], age:[0,1], res:[{w:20,f:10.25}], frame:240 };
  const same = sync.checksum(a);
  assert.match(same, /^fnv1a32-[0-9a-f]{8}-[0-9a-f]+$/);
  assert.equal(sync.checksum(b), same);
  assert.notEqual(sync.checksum({...a,res:[{f:11.25,w:20}]}), same);
  assert.equal(sync.compareCheckpoint({frame:240,hash:same},{frame:240,hash:same}), 'match');
  assert.equal(sync.compareCheckpoint({frame:240,hash:same},{frame:241,hash:same}), 'different-frame');
  assert.equal(sync.compareCheckpoint({frame:240,hash:same},{frame:240,hash:sync.checksum({...a,age:[1,1]})}), 'desync');
  assert.equal(sync.compareCheckpoint({frame:-1,hash:same},{frame:240,hash:same}), 'invalid');
});

test('training count is optional and restricted to one or five, with no count on other commands',()=>{
  const train={type:'train',entities:['b10'],value:'vil'};
  for(const command of [train,{...train,count:1},{...train,count:5}]){
    assert.equal(sync.validOrder(command,128),true);
    assert.equal(sync.validPacket(packet(1,8,{order:command}),128),true);
  }
  for(const count of [0,2,4,6,-1,1.5,Infinity,NaN,'5',true,null,undefined,[],{}]){
    assert.equal(sync.validOrder({...train,count},128),false,String(count));
  }
  for(const command of [order,{type:'cancel',entities:['b10']},
    {type:'research',entities:['b10'],value:'age'},
    {type:'rally',entities:['b10'],point:{x:2,y:3}}]){
    assert.equal(sync.validOrder({...command,count:5},128),false,command.type);
  }
  assert.equal(sync.validOrder({...train,count:5,free:true},128),false);
});

test('network protocol is isolated from gameplay and cannot accidentally run unapproved remote orders', () => {
  assert.doesNotMatch(source, /(?:step|orderSel|newGame|train|pay)\s*\(/);
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.equal(typeof sync.createInbox, 'function');
});

test('seeded malformed network packets cannot throw, advance sequence, or enter the command queue',()=>{
 // Reproducible JSON-shape adversarial inputs. Do not rely on nondeterministic
 // Math.random or live network access in the free hosted validation job.
 let seed=0x6a09e667;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const choice=xs=>xs[next()%xs.length];
 const badSid=[null,false,0,'','x','ab','x'.repeat(81),'host\u0000-user',[],{}];
 const badCounter=[null,false,0,-1,1.5,Number.MAX_SAFE_INTEGER+1,'1',[],{}];
 const badFrame=[null,-1,1.5,Number.MAX_SAFE_INTEGER+1,'8',false,[],{}];
 const badTeam=[null,-1,8,0.25,'0',false,[],{}];
 const badEntities=[null,[],['u10','u10'],['u0'],['n10'],['u10',7],
  ['u10',null],[{}],Array(97).fill('u10'),'u10',{}];
 const badPoint=[null,[],{}, {x:-1,y:4},{x:128,y:4},
  {x:Infinity,y:4},{x:NaN,y:4},{x:'4',y:4},
  {x:4},{x:4,y:4,z:1},{x:4.5,y:null}];
 const badType=[null,0,'','warp','MOVE','__proto__','move\n',false,[],{}];
 const cases=[
  ()=>({...packet(1,8),v:choice([null,0,1,'2',false,[]])}),
  ()=>packet(1,8,{sid:choice(badSid)}),
  ()=>packet(choice(badCounter),8),
  ()=>packet(1,choice(badFrame)),
  ()=>packet(1,8,{team:choice(badTeam)}),
  ()=>packet(1,8,{order:{...order,entities:choice(badEntities)}}),
  ()=>packet(1,8,{order:{...order,point:choice(badPoint)}}),
  ()=>packet(1,8,{order:{...order,type:choice(badType)}}),
  ()=>packet(1,8,{order:{...order,debug:{persist:false}}}),
  ()=>({...packet(1,8),extra:choice([null,1,'x',[],{}])}),
  ()=>packet(1,8,{order:choice([null,false,[],{},'move',42])}),
  ()=>packet(1,8,{order:{...order,entities:['u10','u11'],count:5}}),
  ()=>packet(1,8,{order:{...order,point:JSON.parse('{"x":4,"y":5,"__proto__":{"polluted":true}}')}}),
  ()=>Object.assign(Object.create(null),packet(1,8),{__proto__:{debug:true}})
 ];
 const inbox=makeInbox();
 for(let i=0;i<560;i++){
  const malicious=cases[i%cases.length]();
  let accepted;
  assert.doesNotThrow(()=>{accepted=sync.validPacket(malicious,128)},
   'validator must not throw on malformed packet #'+i);
  assert.equal(accepted,false,'invalid packet admitted at corpus index '+i);
  let response;
  assert.doesNotThrow(()=>{response=inbox.receive(malicious,'host-user',2)},
   'trusted inbox must reject malformed packet #'+i+' without throwing');
  assert.equal(response.ok,false,'malformed packet queued at corpus index '+i);
  assert.equal(inbox.pending(),0,'malformed packet must never reach the frame queue');
 }
 assert.equal(inbox.receive(packet(1,8),'host-user',2).ok,true,
  'malformed traffic must not consume the first valid sender sequence');
 assert.equal(inbox.drain(8).length,1);
 assert.equal(inbox.pending(),0);
});
