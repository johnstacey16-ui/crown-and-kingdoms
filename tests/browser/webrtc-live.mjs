// Explicit real-project, two-browser game acceptance. Creates two anonymous Auth
// records, then revokes relay/Auth leases. Never logs credentials, SDP or invites.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createApplication} from '../../server/app.mjs';
if(process.env.CK_RUN_WEBRTC_SMOKE!=='1'){console.error('Set CK_RUN_WEBRTC_SMOKE=1 for real-project browser acceptance.');process.exit(2);}
const server=createApplication();server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
// Numeric host ICE candidates make the one-runner topology deterministic. This
// does NOT establish real internet NAT traversal or production-host acceptance.
const browser=await chromium.launch({headless:true,args:['--disable-features=WebRtcHideLocalIpsWithMdns']});
const contexts=[await browser.newContext(),await browser.newContext()];
const pages=await Promise.all(contexts.map(c=>c.newPage()));
const calls={signups:0,logouts:0,signaling:0,relay:0,gameplay:0};
let result;
try{
  for(const page of pages){
    page.on('request',req=>{
      if(!req.url().startsWith('https://isfzrqtbsbqlaojtpkxr.supabase.co/'))return;
      if(req.method()!=='POST')return;
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
      startVillagers=1;popLimit=300;gameMode=0;vm=0;
      window.wrtcClient=CK_WEBRTC_TRANSPORT.createGuestClient({useStun:false});
      window.smokePreparation=CK_AUTH_LOBBY.preparation();
      window.smokeTeam=t=>({food:S.res[t].f,tc:S.bs.find(b=>b.t===t&&b.k==='tc').netId,queue:S.bs.find(b=>b.t===t&&b.k==='tc').q.length});
      window.smokeHash=()=>CK_SIM_SYNC.worldCheckpoint(S,Math.round(S.t/DT)).hash;
      const normalStep=step;
      step=dt=>{normalStep(dt);if(Math.round(S.t/DT)===120){S.over='draw';S.why='Browser peer smoke terminal fixture';}};
    });
  }
  const [host,guest]=pages;
  const invitation=await host.evaluate(async()=>{const room=await wrtcClient.connect();return room.roomId;});
  await guest.evaluate(inv=>{window.smokeJoin=wrtcClient.connect(inv);void smokeJoin.catch(()=>{});},invitation);
  for(let n=0;n<80;n++){
    const phase=await host.evaluate(async()=>{await wrtcClient.refreshRoster();return wrtcClient.snapshot().phase;});
    if(phase==='ready')break;await new Promise(r=>setTimeout(r,100));
  }
  await guest.evaluate(()=>smokeJoin);
  for(const page of pages)await page.evaluate(()=>{
    window.smokeStart=CK_MATCH_STARTUP.create({transport:wrtcClient,validateConfig:CK_AUTH_LOBBY.validConfig,prepare:smokePreparation.prepare});
  });
  await host.evaluate(()=>smokeStart.begin(CK_AUTH_LOBBY.settings(123456)));
  let verified=false;
  for(let n=0;n<100;n++){
    const g=await guest.evaluate(async()=>{await smokeStart.pump();return smokeStart.snapshot().phase;});
    const h=await host.evaluate(async()=>{await smokeStart.pump();return smokeStart.snapshot().phase;});
    if(g==='verified'&&h==='verified'){verified=true;break;}
    await new Promise(r=>setTimeout(r,5));
  }
  assert.equal(verified,true,'map agreement');
  assert.equal(await host.evaluate(()=>smokeStart.snapshot().hash),await guest.evaluate(()=>smokeStart.snapshot().hash));
  for(const page of pages)await page.evaluate(()=>{window.smokeLive=smokePreparation.live(wrtcClient,smokeStart.snapshot());});
  await host.evaluate(()=>smokeLive.begin());
  const started=performance.now(),hostHashes=new Map(),guestHashes=new Map();
  let ordered=false,hostBefore,guestBefore,final;
  for(let n=0;n<1500;n++){
    const h=await host.evaluate(async()=>{await smokeLive.pump();return {phase:smokeLive.snapshot().phase,frame:smokeLive.snapshot().frame,hash:smokeHash()};});
    const g=await guest.evaluate(async()=>{await smokeLive.pump();return {phase:smokeLive.snapshot().phase,frame:smokeLive.snapshot().frame,hash:smokeHash()};});
    if(h.frame)hostHashes.set(h.frame,h.hash);if(g.frame)guestHashes.set(g.frame,g.hash);
    if(hostHashes.has(g.frame))assert.equal(g.hash,hostHashes.get(g.frame),'browser production checkpoint '+g.frame);
    assert.ok(h.frame>=g.frame&&h.frame<=g.frame+1,'bounded stop-and-wait frames');
    if(!ordered&&h.phase==='running'&&g.phase==='running'){
      hostBefore=await host.evaluate(()=>smokeTeam(0));guestBefore=await guest.evaluate(()=>smokeTeam(1));
      assert.equal(await host.evaluate(id=>smokeLive.submit({type:'train',entities:[id],value:'vil'}).ok,hostBefore.tc),true);
      assert.equal(await guest.evaluate(id=>smokeLive.submit({type:'train',entities:[id],value:'vil'}).ok,guestBefore.tc),true);
      ordered=true;
    }
    if(h.phase==='finished'&&g.phase==='finished'){final={h,g};break;}
    await new Promise(r=>setTimeout(r,5));
  }
  const elapsed=performance.now()-started;
  assert.ok(final,'both peers finish');assert.equal(final.h.frame,120);assert.equal(final.g.frame,120);
  assert.equal(hostHashes.size,120);assert.equal(guestHashes.size,120);
  for(const [frame,hash] of hostHashes)assert.equal(guestHashes.get(frame),hash);
  const states=await Promise.all(pages.map(p=>p.evaluate(()=>({state:smokeLive.snapshot(),teams:[smokeTeam(0),smokeTeam(1)]}))));
  assert.equal(states[0].state.acknowledgedFrame,120);
  for(const s of states){
    assert.equal(s.state.lastResult.ok,true);assert.equal(s.state.phase,'finished');
    assert.equal(s.teams[0].queue,1);assert.equal(s.teams[1].queue,1);
    assert.ok(s.teams[0].food<hostBefore.food);assert.ok(s.teams[1].food<guestBefore.food);
  }
  assert.equal(calls.gameplay,0,'no database gameplay RPCs');
  result={status:'passed',testedAt:new Date().toISOString(),verifiedFrames:120,matchingWorlds:true,paidOrdersBothTeams:true,
    finalAck:120,terminal:'deterministic draw fixture',elapsedGameplayMs:Math.round(elapsed),
    observedFramesPerSecond:Number((120000/elapsed).toFixed(2)),...calls,
    topology:'two Chromium contexts, one runner, numeric host ICE, localhost game origin; real Supabase Auth/HTTPS/CORS/signaling',
    authUserRecordsRemain:true};
}finally{
  await Promise.allSettled(pages.map(p=>p.evaluate(async()=>{await window.wrtcClient?.close();window.smokePreparation?.restore();})));
  if(result){result.logouts=calls.logouts;await mkdir('artifacts/webrtc-live',{recursive:true});await writeFile('artifacts/webrtc-live/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
  await browser.close();await new Promise(resolve=>server.close(resolve));
}
