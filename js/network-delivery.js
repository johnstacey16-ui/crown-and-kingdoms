/* Crown & Kingdoms — bounded reliable-frame protocol building blocks.
 * Deliberately disconnected from multiplayer.js until the network transport
 * authenticates peer identities separately from payloads and can meet deadlines.
 */
(function(root){
  'use strict';
  const sync=root.CK_SIM_SYNC;
  if(!sync)throw Error('Load network-sync.js before network-delivery.js');
  const VERSION=sync.VERSION;
  const isRecord=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const exact=(o,keys)=>isRecord(o)&&Object.keys(o).length===keys.length&&
    Object.keys(o).every(k=>keys.includes(k));
  function size(o) {
    const json=JSON.stringify(o);
    if(typeof json!=='string')return Infinity;
    return typeof TextEncoder!=='undefined'
      ?new TextEncoder().encode(json).length:unescape(encodeURIComponent(json)).length;
  }
  function validRoster(roster) {
    return !!roster&&Array.isArray(roster.slots)&&roster.slots.length===2&&
      sync.validRoster(roster,roster.slots[0].sid,roster.slots[0].sid,roster.kingdomCount);
  }
  function validJournal(j,roster,mapSize,maxCommands) {
    if(!exact(j,['v','frame','commands'])||j.v!==VERSION||
       !Number.isSafeInteger(j.frame)||j.frame<1||!Array.isArray(j.commands)||
       j.commands.length>maxCommands)return false;
    let prev=null;const seen=new Set();
    for(const p of j.commands){
      if(!sync.validPacket(p,mapSize)||p.frame!==j.frame||
         sync.rosterTeam(roster,p.sid)!==p.team)return false;
      const key=p.sid+':'+p.seq;
      if(seen.has(key))return false;
      seen.add(key);
      if(prev&&(prev.team>p.team||prev.team===p.team&&
        (prev.sid>p.sid||prev.sid===p.sid&&prev.seq>=p.seq)))return false;
      prev=p;
    }
    return true;
  }
  function config(roster,mapSize,capacity,maxBytes,maxCommands) {
    if(!validRoster(roster)||!Number.isInteger(mapSize)||mapSize<1||mapSize>1024||
      !Number.isInteger(capacity)||capacity<1||capacity>256||
      !Number.isInteger(maxBytes)||maxBytes<128||maxBytes>65536||
      !Number.isInteger(maxCommands)||maxCommands<1||maxCommands>96)
      throw Error('Invalid frame delivery configuration');
  }
  function freezeMessage(journal) {
    const j=JSON.parse(JSON.stringify(journal));
    for(const p of j.commands){
      Object.freeze(p.order.entities);
      if(p.order.point)Object.freeze(p.order.point);
      Object.freeze(p.order);Object.freeze(p);
    }
    Object.freeze(j.commands);
    Object.freeze(j);
    return Object.freeze({v:VERSION,frame:j.frame,digest:sync.checksum(j),journal:j});
  }
  // Operates on a caller-supplied monotonic LOGICAL clock, not Date.now().
  // The caller must stop advancing its match if enqueue hits capacity or retry
  // exhaustion; no frame is ever silently dropped to keep the UI responsive.
  function createOutbox({roster,mapSize,startFrame=0,capacity=32,maxBytes=1024,
                         maxCommands=96,retryTicks=6,maxAttempts=5}){
    config(roster,mapSize,capacity,maxBytes,maxCommands);
    if(!Number.isSafeInteger(startFrame)||startFrame<0||
       !Number.isSafeInteger(retryTicks)||retryTicks<1||
       !Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>100)
      throw Error('Invalid outbox clock/retry policy');
    const guestSid=roster.slots[1].sid,pending=new Map();
    let lastEnqueued=startFrame,lastAcked=startFrame,lastTick=-1,failure=null;
    function enqueue(journal){
      if(failure)return {ok:false,reason:'halted'};
      if(!validJournal(journal,roster,mapSize,maxCommands))
        return {ok:false,reason:'invalid-journal'};
      if(journal.frame!==lastEnqueued+1)
        return {ok:false,reason:'noncontiguous-frame'};
      if(pending.size>=capacity)return {ok:false,reason:'backpressure'};
      const message=freezeMessage(journal);
      if(size(message)>maxBytes)return {ok:false,reason:'oversized-frame'};
      pending.set(journal.frame,{message,attempts:0,lastSent:-1});
      lastEnqueued=journal.frame;
      return {ok:true,frame:journal.frame};
    }
    function poll(tick,maxPackets=8){
      if(failure)return {ok:false,reason:failure,messages:[]};
      if(!Number.isSafeInteger(tick)||tick<0||tick<lastTick||
        !Number.isInteger(maxPackets)||maxPackets<1||maxPackets>256)
        return {ok:false,reason:'invalid-clock',messages:[]};
      lastTick=tick;
      const messages=[];
      for(const record of pending.values()){
        const due=!record.attempts||tick-record.lastSent>=retryTicks;
        if(!due)continue;
        if(record.attempts>=maxAttempts){
          failure='retry-exhausted';
          return {ok:false,reason:failure,messages:[]};
        }
        if(messages.length>=maxPackets)break;
        record.attempts++;
        record.lastSent=tick;
        messages.push(record.message);
      }
      return {ok:true,messages};
    }
    function acknowledge(ack,trustedSenderSid){
      // A self-reported sid in Broadcast is NOT a trustedSenderSid.
      if(trustedSenderSid!==guestSid)return {ok:false,reason:'untrusted-guest'};
      if(!exact(ack,['v','frame','digest'])||ack.v!==VERSION||
         !Number.isSafeInteger(ack.frame)||ack.frame<1||
         typeof ack.digest!=='string')return {ok:false,reason:'invalid-ack'};
      if(failure)return {ok:false,reason:'halted'};
      const first=pending.keys().next();
      if(first.done||!pending.has(ack.frame))return {ok:false,reason:'unknown-frame'};
      if(first.value!==ack.frame)return {ok:false,reason:'out-of-order-ack'};
      const record=pending.get(ack.frame);
      if(record.attempts===0)return {ok:false,reason:'unsent-frame'};
      if(record.message.digest!==ack.digest)return {ok:false,reason:'digest-mismatch'};
      pending.delete(ack.frame);
      lastAcked=ack.frame;
      return {ok:true,frame:ack.frame};
    }
    function state(){return Object.freeze({
      lastEnqueued,lastAcked,pending:pending.size,halted:failure,clock:lastTick
    });}
    return Object.freeze({enqueue,poll,acknowledge,state});
  }
  function createReceiver({roster,mapSize,replica,capacity=32,
                           maxBytes=1024,maxCommands=96}){
    config(roster,mapSize,capacity,maxBytes,maxCommands);
    if(!replica||typeof replica.receive!=='function'||typeof replica.state!=='function')
      throw Error('A strict frame replica is required');
    const hostSid=roster.slots[0].sid;
    const accepted=new Map();
    function receive(message,trustedSenderSid){
      if(trustedSenderSid!==hostSid)return {ok:false,reason:'untrusted-host'};
      if(!exact(message,['v','frame','digest','journal'])||
         message.v!==VERSION||!Number.isSafeInteger(message.frame)||
         !validJournal(message.journal,roster,mapSize,maxCommands)||
         message.frame!==message.journal.frame||size(message)>maxBytes||
         message.digest!==sync.checksum(message.journal))
        return {ok:false,reason:'invalid-envelope'};
      const prior=accepted.get(message.frame);
      if(prior){
        if(prior.digest!==message.digest)return {ok:false,reason:'conflicting-retry'};
        return {ok:true,duplicate:true,ack:prior.ack};
      }
      const applied=replica.receive(message.journal,trustedSenderSid);
      if(!applied.ok)return applied;
      const ack=Object.freeze({v:VERSION,frame:message.frame,digest:message.digest});
      accepted.set(message.frame,{digest:message.digest,ack});
      while(accepted.size>capacity)accepted.delete(accepted.keys().next().value);
      return {ok:true,duplicate:false,ack,applied:applied.applied};
    }
    return Object.freeze({receive,state:()=>Object.freeze({
      ...replica.state(),acceptedHistory:accepted.size
    })});
  }
  root.CK_FRAME_DELIVERY=Object.freeze({createOutbox,createReceiver});
})(typeof window!=='undefined'?window:globalThis);
