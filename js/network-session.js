/* Stop-and-wait live simulation preview. No legacy Broadcast messages enter here. */
(function(root){
  'use strict';
  const VERSION = 'ck-live-preview-3';
  const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value,key));
  function create({transport, startup, mapSize, lookupEntity, execute, advance, hash,
    now = () => performance.now(), timeoutMs = 8000}) {
    const sync = root.CK_SIM_SYNC, delivery = root.CK_FRAME_DELIVERY, uplink = root.CK_COMMAND_UPLINK;
    const room = transport.snapshot();
    if (startup.phase !== 'verified' || room.phase !== 'ready' || room.members.length !== 2 ||
        startup.matchId !== room.matchId || startup.team !== room.team ||
        typeof hash !== 'function' || typeof advance !== 'function' || typeof execute !== 'function' ||
        !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw Error('Invalid live session');
    const roster = sync.lockRoster(room.members[0].sid,room.members[1].sid,2);
    let phase = 'waiting', frame = 0, pumping = null, deadline = null, lastTick = -Infinity, tick = 0;
    let failure = '', lastResult = null;
    const hashes = new Map(), receipts = new Map(), submitted = new Map();
    const appliedAcks = new Map();
    const supported = order => order && ['train','cancel','move','rally'].includes(order.type);
    const apply = (order,team,at) => supported(order) && execute(order,team,at) === true;
    const host = sync.createCommandHost({roster,mapSize,lookupEntity,execute:apply,delayFrames:2});
    // The uplink match binding is mandatory, including for host-local commands.
    const commandIngress = uplink.createCommandIngress({roster,matchId:room.matchId,mapSize,host});
    const sender = uplink.createCommandSender({roster,matchId:room.matchId,mapSize,sid:room.sid,
      retryTicks:60,maxAttempts:3});
    const outbox = delivery.createOutbox({roster,mapSize,capacity:1,maxBytes:900,retryTicks:60,maxAttempts:3});
    function step(at) {
      if (phase !== 'running' || advance(at) !== true) return false;
      const checksum = hash(at);
      if (typeof checksum !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(checksum)) return false;
      hashes.set(at,checksum); frame = at;
      while(hashes.size>64)hashes.delete(hashes.keys().next().value);
      return true;
    }
    const clock = delivery.createHostClock({host,outbox,advance:step});
    const replica = sync.createFrameReplica({roster,mapSize,execute:apply});
    const receiver = delivery.createReceiver({roster,mapSize,replica,advance:step,maxBytes:900});
    function stop(reason = 'closed') {
      phase = reason === 'closed' ? 'closed' : 'failed'; failure = reason;
      transport.close();
    }
    function current() {
      const live = transport.snapshot();
      if (['closed','failed'].includes(phase) || live.phase !== 'ready' || live.matchId !== room.matchId)
        throw Error('Live room ended');
      if(deadline!==null&&now()>=deadline)throw Error('Peer response timed out');
    }
    function boundedRemember(map,key,value) {
      map.set(key,value);while(map.size>64)map.delete(map.keys().next().value);
    }
    function acceptReceipt(payload,sid) {
      const key = payload?.seq, prior = receipts.get(key);
      if(prior!==undefined)return sid===roster.slots[0].sid&&JSON.stringify(payload)===prior;
      const result=sender.acknowledge(payload,sid);
      if(result.ok)boundedRemember(receipts,key,JSON.stringify(payload));
      return result.ok;
    }
    function acceptResult(result) {
      if (!exact(result,['sid','seq','frame','ok','reason']) || result.sid !== room.sid ||
          typeof result.ok !== 'boolean' || (result.ok ? result.reason !== null :
          !['stale-ownership','rejected-by-simulation','simulation-error'].includes(result.reason))) return false;
      const request = submitted.get(result.seq);
      if (!request || request.frame !== result.frame || result.frame > frame) return false;
      if (request.result) return JSON.stringify(request.result) === JSON.stringify(result);
      request.result = Object.freeze({...result}); lastResult = request.result;
      return true;
    }
    async function receive(kind,payload,sid) {
      current();
      if(sid!==roster.slots[1-room.team].sid)throw Error('Wrong live peer');
      if(kind==='run'&&room.team===1&&phase==='waiting') {
        if(!exact(payload,['v','hash'])||payload.v!==VERSION||payload.hash!==startup.hash)throw Error('Wrong preview start');
        await transport.send('run-ready',{v:VERSION,hash:startup.hash});
        current();phase='running';deadline=now()+timeoutMs;return true;
      }
      if(kind==='run-ready'&&room.team===0&&phase==='starting') {
        if(!exact(payload,['v','hash'])||payload.v!==VERSION||payload.hash!==startup.hash)throw Error('Wrong preview confirmation');
        phase='running';deadline=null;return true;
      }
      if(phase!=='running')throw Error('Preview is not running');
      if(room.team===0&&kind==='command') {
        if(!supported(payload?.packet?.order))throw Error('Unsupported preview command');
        const result=commandIngress.receive(payload,sid,frame);
        if(!result.ok)throw Error('Command rejected: '+result.reason);
        await transport.send('receipt',result.receipt);current();return true;
      }
      if(room.team===1&&kind==='receipt')return acceptReceipt(payload,sid);
      if(room.team===1&&kind==='result')return acceptResult(payload);
      if(room.team===1&&kind==='frame') {
        if(!exact(payload,['message','hash'])||typeof payload.hash!=='string')throw Error('Invalid frame wrapper');
        const result=receiver.receive(payload.message,sid);
        if(!result.ok||hashes.get(payload.message.frame)!==payload.hash)throw Error('Frame replay or world hash mismatch');
        await transport.send('ack',{ack:result.ack,hash:payload.hash});
        current();deadline=now()+timeoutMs;return true;
      }
      if(room.team===0&&kind==='ack') {
        if(!exact(payload,['ack','hash'])||!exact(payload.ack,['v','frame','digest']))throw Error('Invalid frame receipt');
        const at=payload.ack.frame,prior=appliedAcks.get(at);
        if(prior!==undefined)return JSON.stringify(payload)===prior;
        if(hashes.get(at)!==payload.hash)throw Error('World hash mismatch');
        const result=outbox.acknowledge(payload.ack,sid);
        if(!result.ok)throw Error('Frame receipt rejected: '+result.reason);
        boundedRemember(appliedAcks,at,JSON.stringify(payload));deadline=null;return true;
      }
      throw Error('Unexpected live message');
    }
    async function begin() {
      if(room.team!==0||phase!=='waiting'||pumping)throw Error('Only the idle host can begin');
      phase='starting';deadline=now()+timeoutMs;
      try{await transport.send('run',{v:VERSION,hash:startup.hash});current();}
      catch(error){if(phase!=='closed')stop(error.message);throw error;}
    }
    function submit(order) {
      if(phase!=='running')return {ok:false,reason:'not-running'};
      if(!supported(order))return {ok:false,reason:'unsupported-preview-command'};
      const result = sender.submit(order,frame+4);
      if(result.ok)boundedRemember(submitted,result.seq,{frame:result.frame,result:null});
      return result;
    }
    function pump() {
      if(pumping)return pumping;
      pumping=(async()=>{
        try{
          current();await transport.poll(receive);current();tick++;
          if(phase==='running') {
            const outgoing=sender.poll(tick);
            if(!outgoing.ok)throw Error(outgoing.reason);
            for(const packet of outgoing.messages){
              if(room.team===0){
                const result=commandIngress.receive(packet,room.sid,frame);
                if(!result.ok||!acceptReceipt(result.receipt,room.sid))throw Error('Local command rejected');
              }else await transport.send('command',packet);
              current();
            }
            if(room.team===0){
              let outcomes=[];
              // Never step again until the guest has replayed and hashed the last frame.
              if(outbox.state().pending===0&&now()-lastTick>=1000/30){
                const result=clock.tick();
                if(!result.ok)throw Error(result.reason);
                outcomes=result.results;
                lastTick=now();deadline=now()+timeoutMs;
              }
              const outgoingFrames=outbox.poll(tick);
              if(!outgoingFrames.ok)throw Error(outgoingFrames.reason);
              for(const message of outgoingFrames.messages){
                await transport.send('frame',{message,hash:hashes.get(message.frame)});current();
              }
              for(const result of outcomes){
                if(result.sid===room.sid){if(!acceptResult(result))throw Error('Invalid local outcome');}
                else {await transport.send('result',result);current();}
              }
            }
          }
          return snapshot();
        }catch(error){if(phase!=='closed')stop(error.message);throw error;}
      })().finally(()=>{pumping=null;});
      return pumping;
    }
    function snapshot(){return Object.freeze({phase,frame,team:room.team,failure,
      commandPending:sender.state().pending, lastResult,
      acknowledgedFrame:room.team===0?outbox.state().lastAcked:frame});}
    return Object.freeze({begin,submit,pump,snapshot,close:()=>stop()});
  }
  root.CK_LIVE_SESSION=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
