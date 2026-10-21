/* Opt-in authenticated WebRTC transport. No connection on load.
 * Supabase binds immutable SDP fingerprints to room members. DTLS authenticates
 * the peer channel; wire packets never choose their sender SID/team.
 * No paid TURN fallback. NATs that need a relay fail closed with a fresh-room retry. */
(function(root){
  'use strict';
  const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
  const bytes=v=>new TextEncoder().encode(v).length;
  const roleKinds=team=>team===0?['frame','receipt','setup','commit','run','result']:['command','ack','ready','committed','run-ready'];
  const response=value=>({ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(value))});
  function createGuestClient({timeoutMs=8000,connectTimeoutMs=30000,useStun=true,captchaToken}={}) {
    if(typeof root.RTCPeerConnection!=='function')throw Error('WebRTC is unavailable');
    if(!Number.isInteger(connectTimeoutMs)||connectTimeoutMs<100||connectTimeoutMs>60000||typeof useStun!=='boolean')throw Error('Invalid peer options');
    const auth=root.CK_SUPABASE_TRANSPORT.createGuestAuth({timeoutMs,captchaToken});
    const rpc=root.CK_SUPABASE_TRANSPORT.createRpcRequest(auth.getAccessToken);
    const relayRoutes={'POST /sessions':'sessions','POST /rooms':'create','POST /join':'join','GET /room':'roster','DELETE /session':'close'};
    let connection,pc=null,channel=null,room=null,credential=null,negotiation=null,negotiating=null;
    let closed=false,closing=null,heartbeat=null,polling=null,sent=0,received=0,queue=[];
    let rejectReady=null,ready=false,failure='',helloSent=false,helloReceived=false,helloAcknowledged=false,helloTimer=null,controlPackets=0;
    const check=()=>{if(closed)throw Error('Peer session ended');};
    function close(){
      if(closing)return closing;
      closed=true;ready=false;root.clearTimeout(heartbeat);root.clearTimeout(helloTimer);negotiation?.abort();
      rejectReady?.(Error('Peer connection unavailable'));queue=[];
      channel?.close();pc?.close();
      // core.close immediately prevents callbacks, then returns its revocation promise.
      closing=Promise.resolve(connection?.close()).finally(()=>{credential=null;return auth.close();});
      return closing;
    }
    function fail(code){if(closed)return;failure=code;void close();}
    function waitFor(target,event,predicate,signal){
      return new Promise((resolve,reject)=>{
        const cleanup=()=>{target.removeEventListener(event,changed);signal.removeEventListener('abort',abort);};
        const changed=()=>{if(predicate()){cleanup();resolve();}};
        const abort=()=>{cleanup();reject(Error('Peer connection timed out'));};
        target.addEventListener(event,changed);signal.addEventListener('abort',abort,{once:true});
        if(signal.aborted)abort();else changed();
      });
    }
    function pause(signal){
      return new Promise((resolve,reject)=>{
        const abort=()=>{root.clearTimeout(timer);reject(Error('Peer session ended'));};
        const timer=root.setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},500);
        signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
      });
    }
    async function signalRpc(data,signal){
      const reply=await rpc('ck_relay_signal',{credential,data:{matchId:room.matchId,...data}},signal);
      if(!reply.ok)throw Error('Authenticated signaling failed ('+reply.status+')');
      const value=await reply.json();check();return value;
    }
    function attach(candidate,resolveReady){
      if(channel&&channel!==candidate)throw Error('Unexpected second channel');
      if(candidate.label!=='ck-game-v1'||candidate.protocol!=='ck-live-preview-12'||!candidate.ordered||
        candidate.maxRetransmits!==null||candidate.maxPacketLifeTime!==null)throw Error('Invalid peer channel');
      channel=candidate;
      channel.addEventListener('close',()=>{if(!closed)fail('channel-closed');});
      channel.addEventListener('error',()=>{if(!closed)fail('channel-error');});
      const sendHello=(retry=false)=>{
        try{
          check();if(channel.readyState!=='open'||helloSent&&!retry)return;
          helloSent=true;channel.send(JSON.stringify({v:1,hello:true,matchId:room.matchId,sid:room.sid,team:room.team}));
          if(!ready&&helloTimer===null)helloTimer=root.setTimeout(()=>{helloTimer=null;if(!ready)sendHello(true);},500);
        }catch(_){fail('hello-send-failed');}
      };
      const confirm=()=>{
        if(!ready&&helloReceived&&helloAcknowledged){ready=true;root.clearTimeout(helloTimer);helloTimer=null;resolveReady();}
      };
      channel.addEventListener('open',()=>sendHello());
      channel.addEventListener('message',event=>{
        try{
          check();
          if(typeof event.data!=='string'||bytes(event.data)>1536)throw Error('Invalid peer packet');
          const wire=JSON.parse(event.data),peer=room.members[1-room.team];
          if(Object.hasOwn(wire,'hello')||Object.hasOwn(wire,'helloAck')){
            const field=Object.hasOwn(wire,'hello')?'hello':'helloAck';
            if(received>0||++controlPackets>256||!exact(wire,['v',field,'matchId','sid','team'])||wire.v!==1||wire[field]!==true||
              wire.matchId!==room.matchId||wire.sid!==peer.sid||wire.team!==peer.team)throw Error('Wrong authenticated peer');
            sendHello();if(!helloSent)throw Error('Peer channel not open');
            if(field==='hello'){
              helloReceived=true;
              channel.send(JSON.stringify({v:1,helloAck:true,matchId:room.matchId,sid:room.sid,team:room.team}));
            }else helloAcknowledged=true;
            confirm();return;
          }
          if(!ready)throw Error('Peer handshake incomplete');
          if(!exact(wire,['v','sequence','kind','payload'])||wire.v!==1||!Number.isSafeInteger(wire.sequence)||wire.sequence!==received+1||
            !roleKinds(peer.team).includes(wire.kind)||!wire.payload||typeof wire.payload!=='object'||Array.isArray(wire.payload)||
            bytes(JSON.stringify(wire.payload))>1024||queue.length>=256)throw Error('Invalid peer message or backpressure');
          received=wire.sequence;
          queue.push({matchId:room.matchId,senderSid:peer.sid,team:peer.team,sequence:received,kind:wire.kind,payload:wire.payload});
        }catch(_){fail('invalid-peer-packet');}
      });
      // Attach the receiver before sending, including already-open announcements.
      sendHello();
    }
    async function establish(){
      if(negotiating)return negotiating;
      check();room=connection.snapshot();
      if(room.phase!=='ready')throw Error('Waiting for peer');
      negotiating=(async()=>{
        negotiation=new AbortController();const signal=negotiation.signal;
        const timer=root.setTimeout(()=>{if(!closed)failure='connection-timeout';negotiation.abort();},connectTimeoutMs);
        let resolveReady;
        const opened=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
        // A failed native connection may reject before signaling finishes.
        void opened.catch(()=>{});
        const aborted=()=>rejectReady(Error('Direct connection unavailable; this network may require a relay'));
        signal.addEventListener('abort',aborted,{once:true});
        try{
          pc=new root.RTCPeerConnection({iceServers:useStun?[{urls:'stun:stun.l.google.com:19302'}]:[]});
          pc.addEventListener('connectionstatechange',()=>{
            if(['failed','disconnected','closed'].includes(pc.connectionState)&&!closed)fail('connection-lost');
          });
          pc.addEventListener('datachannel',event=>{
            try{if(room.team!==1||channel)throw Error('Unexpected channel');attach(event.channel,resolveReady);}
            catch(_){event.channel.close();fail('unexpected-channel');}
          });
          const publish=async type=>{
            await pc.setLocalDescription(type==='offer'?await pc.createOffer():await pc.createAnswer());
            await waitFor(pc,'icegatheringstatechange',()=>pc.iceGatheringState==='complete',signal);
            check();
            const result=await signalRpc({type,sdp:pc.localDescription.sdp},signal);
            if(!exact(result,['published'])||result.published!==true)throw Error('Invalid signaling receipt');
          };
          const readPeer=async field=>{
            while(true){
              const value=await signalRpc({},signal);
              if(!exact(value,['matchId','offer','answer'])||value.matchId!==room.matchId||
                ![value.offer,value.answer].every(v=>v===null||typeof v==='string'&&bytes(v)<=8192))throw Error('Invalid signaling transcript');
              if(value[field]!==null)return value[field];
              await pause(signal);
            }
          };
          if(room.team===0){
            attach(pc.createDataChannel('ck-game-v1',{ordered:true,protocol:'ck-live-preview-12'}),resolveReady);
            await publish('offer');await pc.setRemoteDescription({type:'answer',sdp:await readPeer('answer')});
          }else{
            await pc.setRemoteDescription({type:'offer',sdp:await readPeer('offer')});await publish('answer');
          }
          await opened;check();
          function renew(){
            heartbeat=root.setTimeout(async()=>{
              if(closed)return;
              try{await connection.refreshRoster();check();renew();}catch(_){fail('room-unavailable');}
            },10000);
          }
          renew();
        }finally{root.clearTimeout(timer);signal.removeEventListener('abort',aborted);}
      })();
      return negotiating;
    }
    async function request({path,method,data,credential:bearer,signal}){
      const op=relayRoutes[method+' '+path];
      if(op){
        if(bearer)credential=bearer;
        return rpc('ck_relay_request',{op,credential:bearer??null,data:data??{}},signal);
      }
      check();if(!ready||channel?.readyState!=='open')throw Error('Peer channel not ready');
      if(path==='/messages'&&method==='POST'){
        if(data.matchId!==room.matchId||!roleKinds(room.team).includes(data.kind))throw Error('Wrong peer message role');
        const sequence=sent+1,wire=JSON.stringify({v:1,sequence,kind:data.kind,payload:data.payload});
        if(!Number.isSafeInteger(sequence)||bytes(wire)>1536||channel.bufferedAmount+bytes(wire)>65536)throw Error('Peer send buffer exhausted');
        channel.send(wire);sent=sequence;return response({sequence});
      }
      if(path==='/messages'&&method==='GET')return response({messages:queue.slice(0,32)});
      if(path==='/messages/ack'&&method==='POST'){
        if(data.matchId!==room.matchId||!Number.isSafeInteger(data.sequence)||data.sequence<1||data.sequence>received)throw Error('Invalid peer receipt');
        queue=queue.filter(m=>m.sequence>data.sequence);return response({acknowledged:data.sequence});
      }
      throw Error('Unknown peer operation');
    }
    try{connection=root.CK_AUTH_TRANSPORT.createClient({timeoutMs,request});}
    catch(error){void auth.close();throw error;}
    const guarded=operation=>async(...args)=>{
      try{return await operation(...args);}catch(error){if(!closed&&!failure)failure='operation-failed';await close();throw error;}
    };
    const connect=guarded(async invitation=>{const value=await connection.connect(invitation);if(value.phase==='ready')await establish();check();return connection.snapshot();});
    const refreshRoster=guarded(async()=>{const value=await connection.refreshRoster();if(value.phase==='ready')await establish();check();return connection.snapshot();});
    const send=guarded(async(kind,payload)=>{await establish();return connection.send(kind,payload);});
    function poll(handle){
      if(!polling)polling=guarded(async()=>{await establish();return connection.poll(handle);})().finally(()=>{polling=null;});
      return polling;
    }
    return Object.freeze({connect,refreshRoster,send,poll,snapshot:connection.snapshot,close,diagnostics:()=>Object.freeze({stage:closed?'closed':ready?'connected':negotiating?'connecting':connection.snapshot().phase==='waiting'?'waiting':'idle',failure,channelState:channel?.readyState??'none',bufferedAmount:channel?.bufferedAmount??0,helloSent,helloReceived,helloAcknowledged})});
  }
  root.CK_WEBRTC_TRANSPORT=Object.freeze({createGuestClient});
})(typeof window!=='undefined'?window:globalThis);
