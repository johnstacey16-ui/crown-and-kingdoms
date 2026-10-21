// Real Chromium DTLS/SCTP between isolated contexts. Auth/signaling are a local
// fixture here; Supabase permissions have separate real-Postgres/live tests.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Peer transport fixture</title>');});
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const results=[];let lastDiagnostics=[];
async function fixture(){
  const contexts=[await browser.newContext(),await browser.newContext()];
  const pages=await Promise.all(contexts.map(c=>c.newPage()));
  let members=1,alive=true,offer=null,answer=null;
  const ops=[];
  for(const [slot,page] of pages.entries()){
    await page.route('https://isfzrqtbsbqlaojtpkxr.supabase.co/**',async route=>{
      const req=route.request(),url=req.url(),body=req.postDataJSON();
      let reply;
      if(url.endsWith('/signup'))reply={access_token:'header.player'+slot+'.signature',refresh_token:'refresh-'+slot,token_type:'bearer',expires_in:3600,
        user:{id:'00000000-0000-4000-8000-00000000000'+(slot+1),is_anonymous:true}};
      else if(url.includes('/logout'))reply={};
      else if(url.includes('/ck_relay_signal')){
        if(!alive)return route.fulfill({status:400,json:{error:'Room ended'}});
        if(body.data.type){if(slot===0)offer=body.data.sdp;else answer=body.data.sdp;reply={published:true};}
        else reply={matchId:'m'.repeat(43),offer,answer};
      }else{
        const {op}=body;ops.push(op);
        if(!alive&&op!=='close')return route.fulfill({status:400,json:{error:'Room ended'}});
        if(op==='sessions')reply={token:(slot?'u':'t').repeat(43),sid:(slot?'g':'h').repeat(43),expires:Date.now()+600000};
        else if(op==='create')reply={roomId:'r'.repeat(43),matchId:'m'.repeat(43),team:0};
        else if(op==='join'){members=2;reply={matchId:'m'.repeat(43),team:1};}
        else if(op==='roster')reply={matchId:'m'.repeat(43),team:slot,members:[{sid:'h'.repeat(43),team:0},...(members===2?[{sid:'g'.repeat(43),team:1}]:[])]};
        else if(op==='close'){alive=false;reply={closed:true};}
        else throw Error('Gameplay must not reach Supabase: '+op);
      }
      await route.fulfill({status:200,json:reply});
    });
    await page.goto(origin);
    await page.evaluate(()=>{
      const Native=window.RTCPeerConnection;
      window.RTCPeerConnection=class extends Native{
        constructor(options){super(options);window.testPC=this;this.addEventListener('datachannel',e=>{window.testWire=e.channel;});}
        createDataChannel(...args){const c=super.createDataChannel(...args);window.testWire=c;return c;}
      };
    });
    for(const name of ['network-transport','network-supabase','network-webrtc'])await page.addScriptTag({content:readFileSync(new URL('../../js/'+name+'.js',import.meta.url),'utf8')});
    await page.evaluate(()=>{window.client=CK_WEBRTC_TRANSPORT.createGuestClient({useStun:false,connectTimeoutMs:10000});window.handled=[];});
  }
  const [host,guest]=pages;
  const invitation=await host.evaluate(async()=>{const room=await client.connect();return room.roomId;});
  await guest.evaluate(inv=>{window.joined=client.connect(inv);void joined.catch(()=>{});},invitation);
  for(let n=0;n<50;n++){
    const phase=await host.evaluate(async()=>{await client.refreshRoster();return client.snapshot().phase;});
    if(phase==='ready')break;
    await new Promise(r=>setTimeout(r,20));
  }
  await guest.evaluate(()=>joined);
  assert.equal(await host.evaluate(()=>client.snapshot().phase),'ready');
  return {host,guest,ops,endRoom:()=>{alive=false;},close:async()=>{
    lastDiagnostics=await Promise.all(pages.map(p=>p.evaluate(()=>({phase:client.snapshot().phase,...client.diagnostics(),pc:testPC.connectionState})).catch(()=>({pageClosed:true}))));
    await Promise.allSettled(pages.map(p=>p.evaluate(()=>client.close())));
    await Promise.all(contexts.map(c=>c.close()));
  }};
}
async function waitClosed(page){await page.waitForFunction(()=>['closed','failed'].includes(client.snapshot().phase),null,{timeout:5000});}
try{
  {
    const f=await fixture();const started=performance.now(),before=f.ops.length;
    try{
      for(let frame=1;frame<=120;frame++){
        await f.host.evaluate(frame=>client.send('frame',{frame}),frame);
        await f.guest.evaluate(async()=>{
          for(let n=0;n<100&&!handled.length;n++){
            await client.poll((kind,payload,sid)=>{handled.push({kind,payload,sid});return true;});
            if(!handled.length)await new Promise(r=>setTimeout(r,1));
          }
          if(!handled.length)throw Error('No peer frame');
        });
        const envelope=await f.guest.evaluate(()=>handled.shift());
        assert.equal(envelope.payload.frame,frame);assert.equal(envelope.sid,'h'.repeat(43));
      }
      assert.ok(f.ops.slice(before).every(op=>op==='roster'),'no gameplay RPC traffic');
      const ms=performance.now()-started;
      results.push({case:'native ordered channel',messages:120,elapsedMs:Math.round(ms),messagesPerSecond:Math.round(120000/ms),gameplayRpcCalls:0});
    }finally{await f.close();}
  }
  for(const attack of ['sender','gap','role','oversize','overflow','second-channel']){
    const f=await fixture();
    try{
      await f.host.evaluate(attack=>{
        if(attack==='second-channel'){testPC.createDataChannel('ck-game-v1',{ordered:true,protocol:'ck-live-preview-9'});return;}
        const wire={v:1,sequence:1,kind:'frame',payload:{frame:1}};
        if(attack==='sender')wire.senderSid='forged';
        if(attack==='gap')wire.sequence=2;
        if(attack==='role')wire.kind='command';
        if(attack==='oversize')wire.payload={text:'x'.repeat(1200)};
        if(attack==='overflow'){for(let n=1;n<=257;n++)testWire.send(JSON.stringify({...wire,sequence:n}));}
        else testWire.send(JSON.stringify(wire));
      },attack);
      await waitClosed(f.guest);
      assert.equal(await f.guest.evaluate(()=>handled.length),0);
      results.push({case:attack,closedBeforeGameplay:true});
    }finally{await f.close();}
  }
  {
    const f=await fixture();
    try{
      await f.host.evaluate(()=>{Object.defineProperty(testWire,'bufferedAmount',{value:65536});});
      assert.equal(await f.host.evaluate(async()=>{try{await client.send('frame',{});return false;}catch{return true;}}),true);
      await waitClosed(f.host);await waitClosed(f.guest);
      results.push({case:'send backpressure',closed:true});
    }finally{await f.close();}
  }
  {
    const f=await fixture();
    try{await f.guest.evaluate(()=>client.close());await waitClosed(f.host);results.push({case:'disconnect',closed:true});}
    finally{await f.close();}
  }
  await mkdir('artifacts/webrtc',{recursive:true});
  await writeFile('artifacts/webrtc/transport.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({status:'passed',results}));
}catch(error){console.error(JSON.stringify({lastDiagnostics,results}));throw error;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
