// Explicit two-browser UI acceptance against the real Free Supabase project.
// Creates two anonymous Auth records; revokes relay/Auth leases after the probe.
// Artifacts contain no credentials, SDP, invitations or player identifiers.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';
if(process.env.CK_RUN_WEBRTC_SMOKE!=='1'){console.error('Set CK_RUN_WEBRTC_SMOKE=1 for real-project browser acceptance.');process.exit(2);}
const server=createApplication();server.listen(0,'127.0.0.1');await once(server,'listening');
const deployedOrigin=process.env.CK_WEBRTC_ORIGIN;
if(deployedOrigin!==undefined&&deployedOrigin!=='https://crown-and-kingdoms.vercel.app')throw Error('Unapproved smoke origin');
const origin=deployedOrigin||'http://127.0.0.1:'+server.address().port;
const verifiedAssets=['engine.js','multiplayer.js','js/network-sync.js','js/network-commands.js',
  'js/network-delivery.js','js/network-uplink.js','js/network-transport.js','js/network-startup.js',
  'js/network-session.js','js/network-unit-map.js','js/network-lobby.js','js/network-supabase.js','js/network-webrtc.js'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
// Numeric local ICE candidates make this controlled topology deterministic;
// this does not establish different-router/mobile NAT or deployed-host acceptance.
const browser=await chromium.launch({headless:true,args:['--disable-features=WebRtcHideLocalIpsWithMdns']});
const contexts=[await browser.newContext(),await browser.newContext()];
const pages=await Promise.all(contexts.map(c=>c.newPage()));
const calls={signups:0,logouts:0,signaling:0,relay:0,gameplay:0};
let result;
try{
  // Fail before creating Auth users if the public origin serves stale/different code.
  // Exact project origin only, no arbitrary URL, credentials or protection bypass.
  if(deployedOrigin){
    for(const path of verifiedAssets){
      const expected=hash(await readFile(new URL('../../'+path,import.meta.url)));
      const response=await fetch(origin+'/'+path,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
      assert.equal(response.status,200,'public asset '+path);
      assert.equal(hash(Buffer.from(await response.arrayBuffer())),expected,'deployed code must match '+path);
    }
  }
  for(const page of pages){
    page.on('request',req=>{
      if(!req.url().startsWith('https://isfzrqtbsbqlaojtpkxr.supabase.co/')||req.method()!=='POST')return;
      if(req.url().endsWith('/signup'))calls.signups++;
      if(req.url().includes('/logout?'))calls.logouts++;
      if(req.url().endsWith('/ck_relay_signal'))calls.signaling++;
      if(req.url().endsWith('/ck_relay_request')){
        calls.relay++;if(['send','poll','ack'].includes(req.postDataJSON()?.op))calls.gameplay++;
      }
    });
    await page.goto(origin);
    for(const name of ['network-supabase','network-webrtc'])await page.addScriptTag({url:origin+'/js/'+name+'.js'});
    await page.evaluate(()=>{
      msz=0;mt=3;mapLayout=0;kingdoms=2;startAge=0;startRes=0;startArmy=0;
      startVillagers=1;popLimit=300;gameMode=0;vm=0;mode='multiplayer';
      window.smokeCheckpoints=new Map();
      window.smokeTeam=t=>({food:S.res[t].f,tc:S.bs.find(b=>b.t===t&&b.k==='tc').netId,queue:S.bs.find(b=>b.t===t&&b.k==='tc').q.length});
      const normalStep=step;
      step=dt=>{
        normalStep(dt);const frame=Math.round(S.t/DT);
        if(frame===120){S.over='draw';S.why='Browser peer smoke terminal fixture';}
        smokeCheckpoints.set(frame,CK_SIM_SYNC.worldCheckpoint(S,frame).hash);
      };
      // Capture read-only test state while the real dialog owns startup/pumping.
      const createStart=CK_MATCH_STARTUP.create,createLive=CK_LIVE_SESSION.create;
      window.CK_MATCH_STARTUP=Object.freeze({...CK_MATCH_STARTUP,create:options=>{window.smokeStart=createStart(options);return smokeStart;}});
      window.CK_LIVE_SESSION=Object.freeze({...CK_LIVE_SESSION,create:options=>{window.smokeLive=createLive(options);return smokeLive;}});
      CK_AUTH_LOBBY.open(()=>{mode='title';},{createTransport:()=>{
        window.wrtcClient=CK_WEBRTC_TRANSPORT.createGuestClient({useStun:false});return wrtcClient;
      }});
    });
  }
  const [host,guest]=pages;
  await host.getByRole('button',{name:'Create private room',exact:true}).click();
  await host.waitForFunction(()=>document.querySelector('input[aria-label="Private room invitation"]')?.value.length===43);
  const invitation=await host.getByRole('textbox',{name:'Private room invitation'}).inputValue();
  await guest.getByRole('textbox',{name:'Private room invitation'}).fill(invitation);
  await guest.getByRole('button',{name:'Join room',exact:true}).click();
  await host.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Verify shared map'&&!b.disabled));
  // The UI guards its poll against concurrent verification clicks.
  for(let n=0;n<20;n++){
    await host.getByRole('button',{name:'Verify shared map',exact:true}).click({timeout:1000}).catch(()=>{});
    if(await host.evaluate(()=>window.smokeLive!==undefined))break;
    await new Promise(r=>setTimeout(r,100));
  }
  await Promise.all(pages.map(p=>p.waitForFunction(()=>window.smokeStart?.snapshot().phase==='verified'&&window.smokeLive!==undefined)));
  assert.equal(await host.evaluate(()=>smokeStart.snapshot().hash),await guest.evaluate(()=>smokeStart.snapshot().hash));
  assert.equal(await host.evaluate(()=>S.t),0);assert.equal(await guest.evaluate(()=>S.t),0);
  await host.getByRole('button',{name:'Run live preview',exact:true}).click();
  const started=performance.now();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>smokeLive.snapshot().phase==='running')));
  const before=[await host.evaluate(()=>smokeTeam(0)),await guest.evaluate(()=>smokeTeam(1))];
  await host.getByRole('button',{name:'Train villager',exact:true}).click();
  await guest.getByRole('button',{name:'Train villager',exact:true}).click();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>smokeLive.snapshot().phase==='finished',null,{timeout:30000})));
  const elapsed=performance.now()-started;
  const states=await Promise.all(pages.map(p=>p.evaluate(()=>({state:smokeLive.snapshot(),teams:[smokeTeam(0),smokeTeam(1)],checkpoints:Array.from(smokeCheckpoints)}))));
  const hostHashes=new Map(states[0].checkpoints),guestHashes=new Map(states[1].checkpoints);
  assert.equal(hostHashes.size,120);assert.equal(guestHashes.size,120);
  for(const [frame,hash] of hostHashes)assert.equal(guestHashes.get(frame),hash,'UI production checkpoint '+frame);
  assert.equal(states[0].state.acknowledgedFrame,120);
  for(const s of states){
    assert.equal(s.state.lastResult.ok,true);assert.equal(s.state.phase,'finished');assert.equal(s.state.frame,120);
    for(const team of [0,1]){assert.equal(s.teams[team].queue,1);assert.ok(s.teams[team].food<before[team].food);}
  }
  assert.equal(calls.gameplay,0,'no database gameplay RPCs');
  // Finished dialogs no longer advance simulation, and Leave tears down both peers.
  await new Promise(r=>setTimeout(r,100));
  for(const page of pages)assert.equal(await page.evaluate(()=>smokeLive.snapshot().frame),120);
  await guest.getByRole('button',{name:'Leave setup',exact:true}).click();
  assert.equal(await guest.evaluate(()=>CK_AUTH_LOBBY.active()),false);
  await host.waitForFunction(()=>['closed','failed'].includes(wrtcClient.snapshot().phase));
  result={status:'passed',testedAt:new Date().toISOString(),uiFlow:'Create / Join / Verify / Run / Train / Leave',
    verifiedFrames:120,matchingWorlds:true,paidOrdersBothTeams:true,finalAck:120,terminal:'deterministic draw fixture',
    elapsedGameplayMs:Math.round(elapsed),observedFramesPerSecond:Number((120000/elapsed).toFixed(2)),...calls,
    topology:'two Chromium contexts, one runner, numeric host ICE; '+(deployedOrigin?'production HTTPS game UI':'localhost game UI')+'; real Supabase Auth/HTTPS/CORS/signaling',
    deployedOrigin:deployedOrigin||null,verifiedAssetCount:deployedOrigin?verifiedAssets.length:0,authUserRecordsRemain:true};
}finally{
  await Promise.allSettled(pages.map(p=>p.evaluate(async()=>{CK_AUTH_LOBBY.close();await window.wrtcClient?.close();})));
  if(result){result.logouts=calls.logouts;await mkdir('artifacts/webrtc-live',{recursive:true});await writeFile('artifacts/webrtc-live/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
