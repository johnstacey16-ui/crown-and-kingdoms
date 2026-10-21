import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/network-transport.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/network-webrtc.js',import.meta.url),'utf8');
const json=value=>({ok:true,status:200,json:async()=>value});
const emit=(target,type,fields={})=>{const e=new Event(type);Object.assign(e,fields);target.dispatchEvent(e);};
function fixture(t,{holdAnswer=false,dropFirstHello=false,connectTimeoutMs=2000}={}){
  const pcs=[];let offer=null,answer=null,joined=false,alive=true,helloCount=0;
  class Channel extends EventTarget{
    constructor(){super();this.label='ck-game-v1';this.protocol='ck-live-preview-10';this.ordered=true;this.maxRetransmits=this.maxPacketLifeTime=null;this.readyState='connecting';this.bufferedAmount=0;}
    send(data){if(this.readyState!=='open')throw Error('Closed channel');if(JSON.parse(data).hello){helloCount++;if(dropFirstHello){dropFirstHello=false;return;}}queueMicrotask(()=>{if(this.peer.readyState==='open')emit(this.peer,'message',{data});});}
    close(){if(this.readyState==='closed')return;this.readyState='closed';emit(this,'close');if(this.peer&&this.peer.readyState!=='closed'){this.peer.readyState='closed';emit(this.peer,'close');}}
  }
  class Peer extends EventTarget{
    constructor(slot){super();this.slot=slot;this.iceGatheringState='complete';this.connectionState='new';pcs[slot]=this;}
    createDataChannel(){this.channel=new Channel();return this.channel;}
    async createOffer(){return{type:'offer',sdp:'offer'};}
    async createAnswer(){return{type:'answer',sdp:'answer'};}
    async setLocalDescription(value){this.localDescription=value;}
    async setRemoteDescription(value){
      this.remoteDescription=value;
      if(value.type==='answer'){
        const h=pcs[0],g=pcs[1];g.channel=new Channel();h.channel.peer=g.channel;g.channel.peer=h.channel;
        h.channel.readyState=g.channel.readyState='open';h.connectionState=g.connectionState='connected';
        // Critical race: guest announcement is already open; its 'open' event
        // happened before attachment and will not be emitted a second time.
        emit(g,'datachannel',{channel:g.channel});emit(h.channel,'open');
        emit(h,'connectionstatechange');emit(g,'connectionstatechange');
      }
    }
    close(){this.connectionState='closed';this.channel?.close();emit(this,'connectionstatechange');}
  }
  const clients=[0,1].map(slot=>{
    const root={location:{origin:'https://game.example'},URL,AbortController,TextEncoder,setTimeout,clearTimeout,
      RTCPeerConnection:class{constructor(){return new Peer(slot);}},CK_SUPABASE_TRANSPORT:{
        createGuestAuth:()=>({getAccessToken:async()=> 'header.player.signature',close:async()=>{}}),
        createRpcRequest:()=>async(name,args)=>{
          if(!alive&&args.op!=='close')return{ok:false,status:400};
          if(name==='ck_relay_signal'){
            if(args.data.type==='offer'){offer=args.data.sdp;return json({published:true});}
            if(args.data.type==='answer'){answer=holdAnswer?null:args.data.sdp;return json({published:true});}
            return json({matchId:'m'.repeat(43),offer,answer});
          }
          const op=args.op;
          if(op==='sessions')return json({token:(slot?'u':'t').repeat(43),sid:(slot?'g':'h').repeat(43),expires:Date.now()+600000});
          if(op==='create')return json({roomId:'r'.repeat(43),matchId:'m'.repeat(43),team:0});
          if(op==='join'){joined=true;return json({matchId:'m'.repeat(43),team:1});}
          if(op==='roster')return json({matchId:'m'.repeat(43),team:slot,members:[{sid:'h'.repeat(43),team:0},...(joined?[{sid:'g'.repeat(43),team:1}]:[])]});
          if(op==='close'){alive=false;return json({closed:true});}
          throw Error('No gameplay RPC expected');
        }
      }};
    vm.runInNewContext(source,root);return root.CK_WEBRTC_TRANSPORT.createGuestClient({connectTimeoutMs,useStun:false});
  });
  t.after(()=>Promise.allSettled(clients.map(c=>c.close())));
  return{host:clients[0],guest:clients[1],pcs,helloCount:()=>helloCount};
}

test('an already-open remote channel exchanges exactly one authenticated hello per peer',async t=>{
  const p=fixture(t),room=await p.host.connect();
  const joined=p.guest.connect(room.roomId);void joined.catch(()=>{});
  // Allow the fixture admission request to commit before host roster refresh.
  await new Promise(r=>setImmediate(r));await p.host.refreshRoster();await joined;
  assert.equal(p.helloCount(),2);await p.host.send('frame',{frame:1});
  let count=0;
  await p.guest.poll((kind,payload,sid)=>{assert.equal(kind,'frame');assert.equal(payload.frame,1);assert.equal(sid,'h'.repeat(43));count++;return true;});
  assert.equal(count,1);assert.equal(p.helloCount(),2);
  assert.equal(p.host.diagnostics().stage,'connected');
  assert.equal(p.guest.diagnostics().failure,'');
});

test('closing during negotiation cancels pending setup without publishing gameplay',async t=>{
  const p=fixture(t,{holdAnswer:true}),room=await p.host.connect();
  const joined=p.guest.connect(room.roomId);void joined.catch(()=>{});
  await new Promise(r=>setImmediate(r));
  const refreshed=p.host.refreshRoster();void refreshed.catch(()=>{});
  await new Promise(r=>setImmediate(r));await p.host.close();
  await assert.rejects(refreshed);await p.guest.close();await assert.rejects(joined);
  assert.equal(p.host.snapshot().phase,'closed');assert.equal(p.guest.snapshot().phase,'closed');
  assert.equal(p.host.diagnostics().stage,'closed');
  assert.equal(p.host.diagnostics().failure,'');
});

test('a stalled direct connection reports a bounded retry reason and closes both peers',async t=>{
  const p=fixture(t,{holdAnswer:true,connectTimeoutMs:100}),room=await p.host.connect();
  assert.equal(p.host.diagnostics().stage,'waiting');
  const joined=p.guest.connect(room.roomId);void joined.catch(()=>{});
  await new Promise(r=>setImmediate(r));
  const refreshed=p.host.refreshRoster();void refreshed.catch(()=>{});
  assert.equal(p.guest.diagnostics().stage,'connecting');
  const results=await Promise.allSettled([joined,refreshed]);
  assert.ok(results.every(r=>r.status==='rejected'));
  for(const client of [p.host,p.guest]){
    assert.equal(client.diagnostics().stage,'closed');
    assert.equal(client.diagnostics().failure,'connection-timeout');
    assert.equal(client.snapshot().phase,'closed');
  }
});


test('identity handshake retries a hello missed before the remote listener attached',async t=>{
  const p=fixture(t,{dropFirstHello:true}),room=await p.host.connect();
  const joined=p.guest.connect(room.roomId);void joined.catch(()=>{});
  await new Promise(r=>setImmediate(r));await p.host.refreshRoster();await joined;
  assert.equal(p.host.snapshot().phase,'ready');assert.equal(p.guest.snapshot().phase,'ready');
  assert.ok(p.helloCount()>2);
});
