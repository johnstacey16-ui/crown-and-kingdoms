// Explicit live smoke test. Creates two anonymous Auth users in the configured
// Free project; closes relay sessions and signs out, but Auth user records remain.
// No credentials, invitations or player IDs are written to output or disk.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { headlessGame } from '../tests/helpers/headless-game.mjs';

if (process.env.CK_RUN_SUPABASE_SMOKE !== '1') {
  console.error('Set CK_RUN_SUPABASE_SMOKE=1 to run against the real Supabase project.');
  process.exit(2);
}
const project='https://isfzrqtbsbqlaojtpkxr.supabase.co';
const key='sb_publishable_wj7wH708NGPxJscwv77pug_8Lf6XR7u';
const settings=await fetch(project+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(8000)}).then(r=>r.json());
if(settings.external?.anonymous_users!==true){console.error('Anonymous Sign-Ins must be enabled first.');process.exit(78);}
const metrics={requests:0,signups:0,refreshes:0,logouts:0,rpc:0,requestBodyBytes:0,responseBodyBytes:0,requestMs:[]};
async function measuredFetch(url,options){
  assert.ok(url.startsWith(project+'/'));
  const start=performance.now();
  metrics.requests++;
  metrics.requestBodyBytes+=Buffer.byteLength(options.body||'');
  if(url.endsWith('/signup'))metrics.signups++;
  if(url.includes('/token?'))metrics.refreshes++;
  if(url.includes('/logout?'))metrics.logouts++;
  if(url.includes('/rpc/'))metrics.rpc++;
  const response=await fetch(url,options);
  metrics.responseBodyBytes+=Buffer.byteLength(await response.clone().text());
  metrics.requestMs.push(performance.now()-start);
  return response;
}
process.on('uncaughtException',error=>{
  const times=metrics.requestMs.slice().sort((a,b)=>a-b);
  console.error(JSON.stringify({status:'failed',reason:error.message,requests:metrics.requests,signups:metrics.signups,refreshes:metrics.refreshes,logouts:metrics.logouts,rpcRequests:metrics.rpc,medianRequestMs:Math.round(times[Math.floor(times.length/2)]||0),p95RequestMs:Math.round(times[Math.floor(times.length*.95)]||0)}));
  process.exitCode=1;
});
const read=name=>readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8');
function game(){
  const {source,sandbox}=headlessGame();
  let offset=0;
  class Clock extends Date {static now(){return Date.now()+offset;}}
  Object.assign(sandbox,{location:{origin:'https://crown-and-kingdoms.vercel.app'},URL,AbortController,TextEncoder,
    fetch:measuredFetch,setTimeout,clearTimeout,Date:Clock});
  vm.runInNewContext(source+'\n'+['network-sync','network-transport','network-supabase','network-commands',
    'network-delivery','network-uplink','network-startup','network-session','network-unit-map','network-lobby'].map(read).join('\n')+`
    msz=0;mt=3;mapLayout=0;kingdoms=2;startAge=0;startRes=0;startArmy=0;
    startVillagers=1;popLimit=300;gameMode=0;vm=0;
    globalThis.team=t=>({food:S.res[t].f,tc:S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      queue:S.bs.find(b=>b.t===t&&b.k==='tc').q.length});
    globalThis.worldHash=()=>window.CK_SIM_SYNC.worldCheckpoint(S,Math.round(S.t/DT)).hash;
    // A deterministic fixture triggers terminal protocol acceptance, not a
    // claim that this smoke test played a natural combat victory.
    const normalStep=step;
    step=dt=>{normalStep(dt);if(Math.round(S.t/DT)===24){S.over='draw';S.why='Live smoke fixture terminal frame';}};
  `,sandbox);
  sandbox.advanceAuthClock=()=>{offset+=3541000;};
  return sandbox;
}
const hg=game(),gg=game();
const host=hg.CK_SUPABASE_TRANSPORT.createGuestClient(),guest=gg.CK_SUPABASE_TRANSPORT.createGuestClient();
let hp,gp,hl,gl;
const started=performance.now();
let gameplayStarted,gameplayMs;
try{
  const invitation=await host.connect();await guest.connect(invitation.roomId);await host.refreshRoster();
  assert.equal(host.snapshot().phase,'ready');assert.equal(guest.snapshot().phase,'ready');
  assert.notEqual(host.snapshot().sid,guest.snapshot().sid);
  hg.advanceAuthClock();gg.advanceAuthClock();
  await host.refreshRoster();await guest.refreshRoster();
  assert.equal(metrics.refreshes,2);
  console.log('Two real guest identities connected and refreshed without changing their roster.');
  hp=hg.CK_AUTH_LOBBY.preparation();gp=gg.CK_AUTH_LOBBY.preparation();
  const hs=hg.CK_MATCH_STARTUP.create({transport:host,validateConfig:hg.CK_AUTH_LOBBY.validConfig,prepare:hp.prepare});
  const gs=gg.CK_MATCH_STARTUP.create({transport:guest,validateConfig:gg.CK_AUTH_LOBBY.validConfig,prepare:gp.prepare});
  await hs.begin(hg.CK_AUTH_LOBBY.settings(123456));
  await gs.pump();await hs.pump();await gs.pump();await hs.pump();
  assert.equal(hs.snapshot().phase,'verified');assert.equal(gs.snapshot().phase,'verified');
  assert.equal(hs.snapshot().hash,gs.snapshot().hash);
  console.log('Both starting-world hashes verified through the real relay.');
  hl=hp.live(host,hs.snapshot());gl=gp.live(guest,gs.snapshot());
  await hl.begin();gameplayStarted=performance.now();
  async function cycle(){
    await hl.pump();await gl.pump();
    assert.equal(hl.snapshot().frame,gl.snapshot().frame);
    assert.equal(hg.worldHash(),gg.worldHash());
  }
  await cycle();await cycle();
  assert.equal(hl.snapshot().phase,'running');assert.equal(gl.snapshot().phase,'running');
  const before=[hg.team(0),hg.team(1)];
  assert.equal(hl.submit({type:'train',entities:[before[0].tc],value:'vil'}).ok,true);
  assert.equal(gl.submit({type:'train',entities:[before[1].tc],value:'vil'}).ok,true);
  for(let n=0;n<40&&hl.snapshot().phase!=='finished';n++){
    await cycle();
    if(n%5===4)console.log('Matching live checkpoint at frame '+hl.snapshot().frame+'.');
  }
  gameplayMs=performance.now()-gameplayStarted;
  assert.equal(hl.snapshot().phase,'finished');assert.equal(gl.snapshot().phase,'finished');
  assert.equal(hl.snapshot().frame,24);assert.equal(hl.snapshot().acknowledgedFrame,24);
  assert.equal(hl.snapshot().lastResult.ok,true);assert.equal(gl.snapshot().lastResult.ok,true);
  for(const team of [0,1]){
    assert.equal(hg.team(team).queue,1);assert.equal(gg.team(team).queue,1);
    assert.ok(hg.team(team).food<before[team].food);
  }
  const finalHash=hg.worldHash();await cycle();await cycle();
  assert.equal(hl.snapshot().frame,24);assert.equal(hg.worldHash(),finalHash);
  assert.equal(gl.submit({type:'train',entities:[before[1].tc],value:'vil'}).reason,'not-running');
}finally{
  // Await transport revocation before signing out; live.close alone is fire-and-forget.
  await Promise.allSettled([host.close(),guest.close()]);
  hp?.restore();gp?.restore();
}
const times=metrics.requestMs.sort((a,b)=>a-b);
console.log(JSON.stringify({
  status:'passed',testedAt:new Date().toISOString(),client:'two Node VM clients with real Auth/HTTPS; no browser/CORS assertion',
  verifiedFrames:24,terminal:'deterministic draw fixture; final ACK confirmed',matchingWorlds:true,
  paidTrainingBothTeams:true,authUsersCreated:metrics.signups,authUserRecordsRemain:true,
  refreshes:metrics.refreshes,logouts:metrics.logouts,rpcRequests:metrics.rpc,
  responseBodyBytes:metrics.responseBodyBytes,requestBodyBytes:metrics.requestBodyBytes,
  medianRequestMs:Math.round(times[Math.floor(times.length/2)]),p95RequestMs:Math.round(times[Math.floor(times.length*.95)]),
  elapsedMs:Math.round(performance.now()-started),gameplayMs:Math.round(gameplayMs),
  observedFramesPerSecond:Number((24/(gameplayMs/1000)).toFixed(2))
}));
