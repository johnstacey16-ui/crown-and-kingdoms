/* Crown & Kingdoms — stop-and-wait client command uplink.
 * Offline protocol only. trustedSenderSid/trustedHostSid MUST come from an
 * authenticated transport binding, never from Broadcast/Presence payloads.
 * A match nonce prevents accidental cross-room acceptance; it is not auth.
 */
(function(root){
  'use strict';
  const sync=root.CK_SIM_SYNC;
  if(!sync)throw Error('Load network-sync.js before network-uplink.js');
  const V=sync.VERSION;
  const record=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
  const exact=(o,keys)=>record(o)&&Object.keys(o).length===keys.length&&
    Object.keys(o).every(k=>keys.includes(k));
  const nonce=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{16,128}$/.test(id);
  function rosterOK(roster){
    return !!roster&&Array.isArray(roster.slots)&&roster.slots.length===2&&
      sync.validRoster(roster,roster.slots[0].sid,roster.slots[0].sid,roster.kingdomCount);
  }
  function options(roster,matchId,mapSize){
    if(!rosterOK(roster)||!nonce(matchId)||!Number.isInteger(mapSize)||
       mapSize<1||mapSize>1024)throw Error('Invalid command uplink configuration');
  }
  function bytes(o){
    const raw=JSON.stringify(o);
    if(typeof raw!=='string')return Infinity;
    return typeof TextEncoder!=='undefined'?
      new TextEncoder().encode(raw).length:unescape(encodeURIComponent(raw)).length;
  }
  function freezeEnvelope(matchId,packet){
    const p=JSON.parse(JSON.stringify(packet));
    Object.freeze(p.order.entities);
    if(p.order.point)Object.freeze(p.order.point);
    Object.freeze(p.order);Object.freeze(p);
    return Object.freeze({v:V,match:matchId,packet:p,
      digest:sync.checksum({match:matchId,packet:p})});
  }
  function validEnvelope(e,matchId,mapSize){
    return exact(e,['v','match','packet','digest'])&&e.v===V&&e.match===matchId&&
      sync.validPacket(e.packet,mapSize)&&
      e.digest===sync.checksum({match:e.match,packet:e.packet})&&
      bytes(e)<=1200;
  }
  function createCommandSender({roster,matchId,mapSize,sid,firstSeq=1,
                                retryTicks=4,maxAttempts=6}){
    options(roster,matchId,mapSize);
    const team=sync.rosterTeam(roster,sid),hostSid=roster.slots[0].sid;
    if(!Number.isInteger(team)||!Number.isSafeInteger(firstSeq)||firstSeq<1||
       !Number.isSafeInteger(retryTicks)||retryTicks<1||
       !Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>100)
      throw Error('Invalid sender identity or retry policy');
    let seq=firstSeq,pending=null,clock=-1,halted=null;
    function submit(order,frame){
      if(halted)return {ok:false,reason:'halted'};
      if(pending)return {ok:false,reason:'pending-command'};
      const packet={v:V,sid,team,seq,frame,order};
      if(!sync.validPacket(packet,mapSize))return {ok:false,reason:'invalid-command'};
      const envelope=freezeEnvelope(matchId,packet);
      if(bytes(envelope)>1200)return {ok:false,reason:'oversized-command'};
      pending={envelope,tries:0,lastSent:-1};
      return {ok:true,seq,frame};
    }
    function poll(tick){
      if(halted)return {ok:false,reason:halted,messages:[]};
      if(!Number.isSafeInteger(tick)||tick<0||tick<clock)
        return {ok:false,reason:'invalid-clock',messages:[]};
      clock=tick;
      if(!pending||pending.tries&&tick-pending.lastSent<retryTicks)
        return {ok:true,messages:[]};
      if(pending.tries>=maxAttempts){
        halted='retry-exhausted';return {ok:false,reason:halted,messages:[]};
      }
      pending.tries++;pending.lastSent=tick;
      return {ok:true,messages:[pending.envelope]};
    }
    function acknowledge(receipt,trustedHostSid){
      if(trustedHostSid!==hostSid)return {ok:false,reason:'untrusted-host'};
      if(!exact(receipt,['v','match','sid','seq','frame','digest','status'])||
         receipt.v!==V||receipt.match!==matchId||receipt.sid!==sid||
         !Number.isSafeInteger(receipt.seq)||!Number.isSafeInteger(receipt.frame)||
         receipt.status!=='queued'||typeof receipt.digest!=='string')
        return {ok:false,reason:'invalid-receipt'};
      if(halted)return {ok:false,reason:'halted'};
      if(!pending)return {ok:false,reason:'unknown-receipt'};
      const e=pending.envelope;
      if(receipt.seq!==e.packet.seq||receipt.frame!==e.packet.frame||
         receipt.digest!==e.digest)return {ok:false,reason:'receipt-mismatch'};
      if(!pending.tries)return {ok:false,reason:'unsent-command'};
      pending=null;
      seq++;
      return {ok:true,seq:receipt.seq,status:'queued'};
    }
    function state(){return Object.freeze({
      nextSeq:seq,pending:!!pending,attempts:pending?pending.tries:0,
      halted,clock
    });}
    return Object.freeze({submit,poll,acknowledge,state});
  }
  function createCommandIngress({roster,matchId,mapSize,host,maxCached=64}){
    options(roster,matchId,mapSize);
    if(!host||typeof host.receive!=='function'||!Number.isInteger(maxCached)||
       maxCached<1||maxCached>256)throw Error('Invalid host ingress');
    const accepted=new Map();
    function receive(envelope,trustedSenderSid,currentFrame){
      if(sync.rosterTeam(roster,trustedSenderSid)===null)
        return {ok:false,reason:'untrusted-sender'};
      if(!validEnvelope(envelope,matchId,mapSize)||
         envelope.packet.sid!==trustedSenderSid)
        return {ok:false,reason:'invalid-envelope'};
      if(!Number.isSafeInteger(currentFrame)||currentFrame<0)
        return {ok:false,reason:'invalid-frame'};
      const packet=envelope.packet,key=packet.sid+':'+packet.seq;
      const previous=accepted.get(key);
      if(previous){
        if(previous.digest!==envelope.digest)
          return {ok:false,reason:'conflicting-retry'};
        return {ok:true,duplicate:true,receipt:previous.receipt};
      }
      // The authoritative inbox still verifies frame deadlines, ownership,
      // roster/team and exact command sequences at receipt time.
      const acceptedByHost=host.receive(packet,trustedSenderSid,currentFrame);
      if(!acceptedByHost.ok)return {ok:false,reason:acceptedByHost.reason,
                                    expected:acceptedByHost.expected};
      const receipt=Object.freeze({v:V,match:matchId,sid:packet.sid,seq:packet.seq,
        frame:packet.frame,digest:envelope.digest,status:'queued'});
      accepted.set(key,{digest:envelope.digest,receipt});
      while(accepted.size>maxCached)accepted.delete(accepted.keys().next().value);
      return {ok:true,duplicate:false,receipt};
    }
    return Object.freeze({receive,state:()=>Object.freeze({acceptedHistory:accepted.size})});
  }
  root.CK_COMMAND_UPLINK=Object.freeze({createCommandSender,createCommandIngress});
})(typeof window!=='undefined'?window:globalThis);
