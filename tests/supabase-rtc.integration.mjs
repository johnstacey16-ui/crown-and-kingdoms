import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const enabled=process.env.CK_TEST_POSTGRES==='1';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const sql=s=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1'],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
function call(uid,name,args){
  const out=sql(`begin;set local role authenticated;select set_config('request.jwt.claim.sub',${q(uid)},true);select public.${name}(${args});commit;`);
  return JSON.parse(out.split('\n').at(-1));
}
const rpc=(uid,op,token=null,data={})=>call(uid,'ck_relay_request',`${q(op)},${token===null?'null':q(token)},${q(JSON.stringify(data))}::jsonb`);
const signal=(uid,token,data)=>call(uid,'ck_relay_signal',`${q(token)},${q(JSON.stringify(data))}::jsonb`);
const sdp=label=>'v=0\r\na=fingerprint:sha-256 '+Array(32).fill(label).join(':')+'\r\n';

test('RTC signaling binds immutable fingerprints to authenticated room roles and match', {skip:!enabled},()=>{
  const h=randomUUID(),g=randomUUID(),a=randomUUID(),hs=rpc(h,'sessions'),gs=rpc(g,'sessions'),as=rpc(a,'sessions');
  try{
    const room=rpc(h,'create',hs.token),matchId=room.matchId;
    rpc(g,'join',gs.token,{roomId:room.roomId});
    assert.throws(()=>signal(a,hs.token,{matchId}));
    assert.throws(()=>signal(a,as.token,{matchId}));
    assert.throws(()=>signal(h,hs.token,{matchId:'x'.repeat(43)}));
    assert.throws(()=>signal(g,gs.token,{matchId,type:'answer',sdp:sdp('BB')}));
    assert.throws(()=>signal(g,gs.token,{matchId,type:'offer',sdp:sdp('BB')}));
    assert.throws(()=>signal(h,hs.token,{matchId,type:'answer',sdp:sdp('AA')}));
    assert.throws(()=>signal(h,hs.token,{matchId,type:'offer',sdp:'v=0\r\n'}));
    assert.throws(()=>signal(h,hs.token,{matchId,type:'offer',sdp:sdp('AA')+'x'.repeat(8192)}));
    assert.throws(()=>signal(h,hs.token,{matchId,type:'offer',sdp:sdp('AA'),senderSid:gs.sid}));
    for(let n=0;n<2;n++)assert.deepEqual(signal(h,hs.token,{matchId,type:'offer',sdp:sdp('AA')}),{published:true});
    assert.throws(()=>signal(h,hs.token,{matchId,type:'offer',sdp:sdp('CC')}));
    assert.deepEqual(signal(g,gs.token,{matchId}),{matchId,offer:sdp('AA'),answer:null});
    signal(g,gs.token,{matchId,type:'answer',sdp:sdp('BB')});
    assert.throws(()=>signal(g,gs.token,{matchId,type:'answer',sdp:sdp('CC')}));
    assert.deepEqual(signal(h,hs.token,{matchId}),{matchId,offer:sdp('AA'),answer:sdp('BB')});
    const grants=JSON.parse(sql(`select json_build_object('anon',has_function_privilege('anon','public.ck_relay_signal(text,jsonb)','execute'),
      'table',has_table_privilege('authenticated','ck_relay.rooms','select'));`));
    assert.deepEqual(grants,{anon:false,table:false});
    rpc(h,'close',hs.token);assert.throws(()=>signal(g,gs.token,{matchId}));
  }finally{for(const [uid,s] of [[h,hs],[g,gs],[a,as]]){try{rpc(uid,'close',s.token);}catch{}}}
});
