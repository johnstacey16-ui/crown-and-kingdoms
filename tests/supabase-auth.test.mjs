import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const project='https://isfzrqtbsbqlaojtpkxr.supabase.co';
const uid='00000000-0000-4000-8000-000000000001';
const response=data=>({ok:true,status:200,json:async()=>data});
const session=(access='header.payload.signature',refresh='refresh-one',id=uid)=>({
  access_token:access,refresh_token:refresh,token_type:'bearer',expires_in:3600,
  user:{id,is_anonymous:true}
});
function context(fetcher, origin='https://game.example') {
  let now=1700000000000;
  class Clock extends Date { static now(){return now;} }
  const calls=[];
  const root={location:{origin},URL,AbortController,TextEncoder,setTimeout,clearTimeout,Date:Clock,
    fetch:async(url,options)=>{
      calls.push({url,options});
      assert.ok(url.startsWith(project+'/'));
      assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error'); assert.equal(options.cache,'no-store');
      return fetcher(url,options);
    }};
  Object.defineProperty(root,'localStorage',{get(){throw Error('Persistent storage forbidden');}});
  Object.defineProperty(root,'sessionStorage',{get(){throw Error('Persistent storage forbidden');}});
  for(const name of ['network-transport.js','network-supabase.js']) vm.runInNewContext(readFileSync(new URL('../js/'+name,import.meta.url),'utf8'),root);
  return {api:root.CK_SUPABASE_TRANSPORT,calls,advance:ms=>{now+=ms;}};
}

test('guest Auth is lazy, memory-only, single-flight, and never supplies a key as an access token',async()=>{
  const c=context(async url=>url.endsWith('/signup')?response(session()):response({}));
  const auth=c.api.createGuestAuth({captchaToken:'human-challenge'});
  assert.equal(c.calls.length,0);
  const values=await Promise.all([auth.getAccessToken(),auth.getAccessToken(),auth.getAccessToken()]);
  assert.deepEqual(values,Array(3).fill('header.payload.signature')); assert.equal(c.calls.length,1);
  assert.deepEqual(Object.keys(auth).sort(),['close','getAccessToken']);
  assert.equal(c.calls[0].options.headers.Authorization,undefined);
  assert.equal(c.calls[0].options.headers.apikey.startsWith('sb_publishable_'),true);
  assert.deepEqual(JSON.parse(c.calls[0].options.body),{data:{},gotrue_meta_security:{captcha_token:'human-challenge'}});
  await auth.getAccessToken(); assert.equal(c.calls.length,1);
  await auth.close(); assert.equal(c.calls.at(-1).url,project+'/auth/v1/logout?scope=local');
  assert.equal(c.calls.at(-1).options.headers.Authorization,'Bearer header.payload.signature');
  await assert.rejects(auth.getAccessToken(),/ended/);
});

test('refresh shares one rotation, keeps identity, and uses the newest refresh credential',async()=>{
  let rotations=0;
  const c=context(async(url,options)=>{
    if(url.endsWith('/signup'))return response(session());
    if(url.includes('/token?')){
      assert.deepEqual(JSON.parse(options.body),{refresh_token:rotations===0?'refresh-one':'refresh-two'});
      rotations++;return response(session('header.payload'+rotations+'.signature','refresh-two'));
    }
    return response({});
  });
  const auth=c.api.createGuestAuth();await auth.getAccessToken();c.advance(3541000);
  assert.deepEqual(await Promise.all([auth.getAccessToken(),auth.getAccessToken()]),['header.payload1.signature','header.payload1.signature']);
  assert.equal(rotations,1);c.advance(3541000);await auth.getAccessToken();assert.equal(rotations,2);
  await auth.close();
});

test('identity changes on refresh terminate Auth and revoke both returned and previous leases',async()=>{
  const c=context(async url=>response(url.endsWith('/signup')?session():url.includes('/token?')?
    session('new.identity.token','new-refresh','00000000-0000-4000-8000-000000000002'):{}));
  const auth=c.api.createGuestAuth();await auth.getAccessToken();c.advance(3541000);
  await assert.rejects(auth.getAccessToken(),/Invalid guest session/);
  const revoked=c.calls.filter(x=>x.url.includes('/logout')).map(x=>x.options.headers.Authorization).sort();
  assert.deepEqual(revoked,['Bearer header.payload.signature','Bearer new.identity.token']);
  await assert.rejects(auth.getAccessToken(),/ended/);
});

test('closing during signup rejects a late reply and revokes its returned lease',async()=>{
  let reply;
  const c=context(async url=>url.endsWith('/signup')?new Promise(resolve=>{reply=resolve;}):response({}));
  const auth=c.api.createGuestAuth(),pending=auth.getAccessToken();
  await auth.close();reply(response(session()));await assert.rejects(pending,/ended/);
  assert.equal(c.calls.filter(x=>x.url.endsWith('/signup')).length,1);
  assert.equal(c.calls.filter(x=>x.url.includes('/logout')).length,1);
});

test('an aborted RPC cancels the shared Auth signup; another call cannot silently create a new identity',async()=>{
  const c=context(async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true})));
  const auth=c.api.createGuestAuth(),abort=new AbortController();
  const pending=auth.getAccessToken({signal:abort.signal});abort.abort();
  await assert.rejects(pending,/Aborted/);await assert.rejects(auth.getAccessToken(),/ended/);
  assert.equal(c.calls.length,1);
});

test('disabled providers, throttling, malformed replies and refresh failures never auto-sign-up or retry',async()=>{
  for(const status of [400,422,429,503]){
    const c=context(async()=>({ok:false,status})),auth=c.api.createGuestAuth();
    await assert.rejects(auth.getAccessToken());await assert.rejects(auth.getAccessToken(),/ended/);assert.equal(c.calls.length,1);
  }
  for(const patch of [{user:{id:uid,is_anonymous:false}},{expires_in:0},{token_type:'service_role'},{access_token:'sb_secret_bad'}]){
    const c=context(async url=>response(url.endsWith('/signup')?{...session(),...patch}:{})),auth=c.api.createGuestAuth();
    await assert.rejects(auth.getAccessToken(),/Invalid guest session/);await assert.rejects(auth.getAccessToken(),/ended/);
  }
  const c=context(async url=>url.includes('/token?')?{ok:false,status:401}:response(url.endsWith('/signup')?session():{}));
  const auth=c.api.createGuestAuth();await auth.getAccessToken();c.advance(3541000);
  await assert.rejects(auth.getAccessToken(),/401/);assert.equal(c.calls.filter(x=>x.url.endsWith('/signup')).length,1);
  assert.equal(c.calls.filter(x=>x.url.includes('/logout')).length,1);
});

test('Auth requests have deadlines, and invalid options make no requests',async()=>{
  const c=context(async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('Deadline')),{once:true})));
  const auth=c.api.createGuestAuth({timeoutMs:10});await assert.rejects(auth.getAccessToken(),/Deadline/);
  await assert.rejects(auth.getAccessToken(),/ended/);
  for(const options of [{timeoutMs:0},{timeoutMs:30001},{captchaToken:42}])assert.throws(()=>c.api.createGuestAuth(options));
});

test('guest client revokes the relay before Auth logout and exposes no token in its snapshot',async()=>{
  let finishClose;
  const c=context(async(url,options)=>{
    if(url.endsWith('/signup'))return response(session());
    if(url.includes('/logout'))return response({});
    const {op}=JSON.parse(options.body);
    assert.equal(options.headers.Authorization,'Bearer header.payload.signature');
    if(op==='sessions')return response({token:'t'.repeat(43),sid:'s'.repeat(43),expires:Date.now()+600000});
    if(op==='create')return response({roomId:'r'.repeat(43),matchId:'m'.repeat(43),team:0});
    if(op==='roster')return response({matchId:'m'.repeat(43),team:0,members:[{sid:'s'.repeat(43),team:0}]});
    if(op==='close')return new Promise(resolve=>{finishClose=()=>resolve(response({closed:true}));});
    throw Error('Unexpected operation');
  });
  const client=c.api.createGuestClient();await client.connect();
  assert.equal(JSON.stringify(client.snapshot()).includes('signature'),false);
  const closing=client.close();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(c.calls.filter(x=>x.url.includes('/logout')).length,0);
  finishClose();await closing;
  assert.equal(c.calls.filter(x=>x.url.includes('/logout')).length,1);assert.equal(client.snapshot().phase,'closed');
});

test('failed relay admission revokes the guest Auth session without retrying session creation',async()=>{
  const c=context(async url=>url.endsWith('/signup')?response(session()):url.includes('/logout')?response({}):{ok:false,status:503});
  const client=c.api.createGuestClient();await assert.rejects(client.connect(),/503/);
  assert.equal(c.calls.filter(x=>x.url.includes('/rpc/')).length,1);
  assert.equal(c.calls.filter(x=>x.url.includes('/logout')).length,1);
});

test('guest client shares concurrent polls and invokes only the first gameplay handler',async()=>{
  let deliver,handled=0;
  const c=context(async(url,options)=>{
    if(url.endsWith('/signup'))return response(session());
    if(url.includes('/logout'))return response({});
    const {op}=JSON.parse(options.body);
    if(op==='sessions')return response({token:'t'.repeat(43),sid:'s'.repeat(43),expires:Date.now()+600000});
    if(op==='create')return response({roomId:'r'.repeat(43),matchId:'m'.repeat(43),team:0});
    if(op==='roster')return response({matchId:'m'.repeat(43),team:0,members:[{sid:'s'.repeat(43),team:0},{sid:'g'.repeat(43),team:1}]});
    if(op==='poll')return new Promise(resolve=>{deliver=()=>resolve(response({messages:[{matchId:'m'.repeat(43),senderSid:'g'.repeat(43),team:1,sequence:1,kind:'command',payload:{}}]}));});
    if(op==='ack')return response({acknowledged:1});
    if(op==='close')return response({closed:true});
    throw Error('Unexpected operation');
  });
  const client=c.api.createGuestClient();await client.connect();
  const first=client.poll(()=>{handled++;return true;});
  assert.equal(client.poll(()=>assert.fail('Overlapping handler')),first);
  await new Promise(resolve=>setImmediate(resolve));deliver();await first;
  assert.equal(handled,1);await client.close();
});


test('guest Auth rejects insecure production origins before requesting credentials',()=>{
  const c=context(()=>assert.fail('No Auth network call'),'http://game.example');
  assert.throws(()=>c.api.createGuestAuth(),/HTTPS required/);
  assert.equal(c.calls.length,0);
});
