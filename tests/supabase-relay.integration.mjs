import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { networkWorld } from './helpers/network-world.mjs';

// No credentials/project calls here: test a disposable PG17 service with simulated
// verified JWT claims. Real Supabase Auth, HTTPS/CORS and origin tests remain a gate.
const enabled = process.env.CK_TEST_POSTGRES === '1';
const sqlText = value => "'" + String(value).replaceAll("'", "''") + "'";
function sql(statement) {
  return execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
    input: statement, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
}
function rpc(uid, op, credential = null, data = {}) {
  const output = sql(`begin; set local role authenticated;
    select set_config('request.jwt.claim.sub',${sqlText(uid)},true);
    select public.ck_relay_request(${sqlText(op)},${credential === null ? 'null' : sqlText(credential)},${sqlText(JSON.stringify(data))}::jsonb); commit;`);
  return JSON.parse(output.split('\n').at(-1));
}
function makeClient() {
  const uid = randomUUID();
  const context = { location: { origin: 'https://game.example' }, URL, AbortController, TextEncoder,
    setTimeout, clearTimeout, fetch: async (url, options) => {
      assert.equal(url, 'https://isfzrqtbsbqlaojtpkxr.supabase.co/rest/v1/rpc/ck_relay_request');
      assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.headers.Authorization, 'Bearer ' + uid);
      const {op,credential,data} = JSON.parse(options.body);
      try { return { ok: true, status: 200, json: async () => rpc(uid,op,credential,data) }; }
      catch { return { ok: false, status: 400 }; }
    } };
  for (const file of ['network-transport.js','network-supabase.js']) {
    vm.runInNewContext(readFileSync(new URL('../js/' + file, import.meta.url),'utf8'),context);
  }
  return context.CK_SUPABASE_TRANSPORT.createClient({ getAccessToken: async () => uid });
}

test('Supabase provider carries a paid guest order and matching simulation checkpoints through PG17', {skip:!enabled}, async () => {
  const host=makeClient(),guest=makeClient();
  try {
    const room=await host.connect();
    await guest.connect(room.roomId); await host.refreshRoster();
    const roster=host.snapshot();
    const options={hostSid:roster.members[0].sid,guestSid:roster.members[1].sid,matchId:roster.matchId};
    const h=networkWorld(options),g=networkWorld(options);
    assert.equal(g.submit({type:'train',entities:[g.tc(1)],value:'vil'},2).ok,true);
    await guest.send('command',g.send(0).messages[0]);
    await host.poll(async (kind,payload,sender)=>{
      const accepted=h.request(payload,sender); assert.equal(accepted.ok,true);
      await host.send('receipt',accepted.receipt); return kind==='command';
    });
    await guest.poll((kind,payload,sender)=>kind==='receipt' && g.receipt(payload,sender).ok);
    for(let frame=1;frame<=20;frame++) {
      assert.equal(h.tick().ok,true); await host.send('frame',h.transmit(frame).messages[0]);
      await guest.poll(async (kind,payload,sender)=>{
        const applied=g.receive(payload,sender); assert.equal(applied.ok,true);
        await guest.send('ack',applied.ack); return kind==='frame';
      });
      await host.poll((kind,payload,sender)=>kind==='ack' && h.ack(payload,sender).ok);
      assert.equal(h.hash(frame),g.hash(frame),'PG relay checkpoint '+frame);
    }
    assert.equal(h.queue(1),1); assert.equal(g.queue(1),1);
  } finally { host.close();guest.close(); }
});

test('SQL admission, identity, sender roles, deduplication, closure and grants reject tampering', {skip:!enabled}, () => {
  const h=randomUUID(),g=randomUUID(),attacker=randomUUID();
  const hs=rpc(h,'sessions'),gs=rpc(g,'sessions'),evil=rpc(attacker,'sessions');
  try {
    const room=rpc(h,'create',hs.token); rpc(g,'join',gs.token,{roomId:room.roomId});
    assert.throws(()=>rpc(attacker,'roster',hs.token)); // stolen relay token needs matching Auth uid
    assert.throws(()=>rpc(g,'send',gs.token,{matchId:room.matchId,kind:'frame',payload:{}}));
    assert.throws(()=>rpc(h,'send',hs.token,{matchId:room.matchId,kind:'frame',payload:{},senderSid:gs.sid}));
    assert.throws(()=>rpc(h,'send',hs.token,{matchId:'x'.repeat(43),kind:'frame',payload:{}}));
    assert.throws(()=>rpc(attacker,'join',evil.token,{roomId:room.roomId}));
    assert.throws(()=>rpc(h,'sessions'));
    const sent=rpc(h,'send',hs.token,{matchId:room.matchId,kind:'frame',payload:{frame:1}});
    const first=rpc(g,'poll',gs.token),retry=rpc(g,'poll',gs.token);
    assert.deepEqual(first,retry); assert.equal(first.messages.length,1);
    assert.equal(first.messages[0].senderSid,hs.sid); assert.equal(first.messages[0].team,0);
    assert.throws(()=>rpc(g,'ack',gs.token,{matchId:room.matchId,sequence:sent.sequence+1}));
    for(let n=0;n<2;n++) assert.equal(rpc(g,'ack',gs.token,{matchId:room.matchId,sequence:sent.sequence}).acknowledged,sent.sequence);
    assert.deepEqual(rpc(g,'poll',gs.token),{messages:[]});
    rpc(h,'close',hs.token); assert.throws(()=>rpc(g,'roster',gs.token)); assert.throws(()=>rpc(h,'roster',hs.token));
    const permissions=JSON.parse(sql(`select json_build_object(
      'anonymous_rpc',has_function_privilege('anon','public.ck_relay_request(text,text,jsonb)','EXECUTE'),
      'browser_table',has_table_privilege('authenticated','ck_relay.sessions','SELECT'),
      'old_player',has_table_privilege('anon','public.player','UPDATE'),
      'rls',(select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ck_relay' and c.relkind='r'));`));
    assert.deepEqual(permissions,{anonymous_rpc:false,browser_table:false,old_player:false,rls:true});
    assert.throws(()=>rpc('','sessions')); // authenticated role alone is insufficient
  } finally {
    for(const [uid,s] of [[h,hs],[g,gs],[attacker,evil]]) {try{rpc(uid,'close',s.token);}catch{}}
  }
});

test('queue, rate, TTL and monthly limits fail closed while cleanup remains possible', {skip:!enabled}, () => {
  const h=randomUUID(),g=randomUUID(),hs=rpc(h,'sessions'),gs=rpc(g,'sessions');
  const room=rpc(h,'create',hs.token); rpc(g,'join',gs.token,{roomId:room.roomId});
  try {
    sql(`update ck_relay.sessions set request_count=120,window_start=clock_timestamp() where uid=${sqlText(h)};`);
    assert.throws(()=>rpc(h,'roster',hs.token));
    sql(`update ck_relay.sessions set request_count=0 where uid=${sqlText(h)};`);
    sql(`insert into ck_relay.messages select ${sqlText(room.roomId)},1,n,'{}'::jsonb from generate_series(1,256) n;`);
    assert.throws(()=>rpc(h,'send',hs.token,{matchId:room.matchId,kind:'frame',payload:{}}));
    sql('update ck_relay.budget set requests=1000000;');
    assert.throws(()=>rpc(h,'roster',hs.token));
    assert.deepEqual(rpc(h,'close',hs.token),{closed:true});
    sql('update ck_relay.budget set requests=0;');
    sql(`update ck_relay.sessions set expires=clock_timestamp()-interval '1 second' where uid=${sqlText(g)};`);
    assert.throws(()=>rpc(g,'roster',gs.token));
  } finally {
    sql('update ck_relay.budget set requests=0;');
    // A successful fresh request commits expired-session/room cleanup.
    const uid=randomUUID(),s=rpc(uid,'sessions'); rpc(uid,'close',s.token);
    for(const [uid,s] of [[h,hs],[g,gs]]) {try{rpc(uid,'close',s.token);}catch{}}
  }
});
