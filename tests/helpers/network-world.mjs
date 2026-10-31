import vm from 'node:vm';
import {readBrowserSubset} from '../../scripts/runtime-sources.mjs';
import { headlessGame } from './headless-game.mjs';

const networkSource=readBrowserSubset([
 './js/network-sync.js','./js/network-commands.js',
 './js/network-delivery.js','./js/network-uplink.js'
]).map(({source})=>source).join('\n');

export function networkWorld({hostSid='host-session',guestSid='guest-session',matchId='production_world_match_nonce_v2'}={}){
  const {source,sandbox}=headlessGame();
  const harness=`
    seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
    startAge=0;startRes=0;startArmy=0;start();
    const sync=window.CK_SIM_SYNC,commands=window.CK_GAME_COMMANDS;
    const delivery=window.CK_FRAME_DELIVERY,uplink=window.CK_COMMAND_UPLINK;
    const roster=sync.lockRoster(${JSON.stringify(hostSid)},${JSON.stringify(guestSid)},2);
    const matchId=${JSON.stringify(matchId)};
    const host=sync.createCommandHost({roster,mapSize:W,delayFrames:1,
      lookupEntity:commands.lookup,execute:commands.execute});
    const ingress=uplink.createCommandIngress({roster,matchId,mapSize:W,host});
    const client=uplink.createCommandSender({roster,matchId,mapSize:W,
      sid:${JSON.stringify(guestSid)},retryTicks:2,maxAttempts:4});
    const outbox=delivery.createOutbox({roster,mapSize:W,startFrame:0});
    const replica=sync.createFrameReplica({roster,mapSize:W,
      execute:commands.execute,startFrame:0});
    let steps=0;
    const advance=()=>{step(DT);steps++;return true};
    const receiver=delivery.createReceiver({roster,mapSize:W,replica,advance});
    const clock=delivery.createHostClock({host,outbox,advance,startFrame:0});
    globalThis.TEST_LINK={
      tc:t=>S.bs.find(b=>b.t===t&&b.k==='tc').netId,
      submit:(order,frame)=>client.submit(order,frame),
      send:tick=>client.poll(tick),
      request:(envelope,sid)=>ingress.receive(envelope,sid,clock.state().frame),
      receipt:(message,sid)=>client.acknowledge(message,sid),
      tick:()=>clock.tick(),
      transmit:tick=>outbox.poll(tick),
      receive:(message,sid)=>receiver.receive(message,sid),
      ack:(message,sid)=>outbox.acknowledge(message,sid),
      hash:frame=>sync.worldCheckpoint(S,frame).hash,
      queue:t=>S.bs.find(b=>b.t===t&&b.k==='tc').q.length,
      steps:()=>steps
    };
  `;
  vm.runInNewContext(source+'\n'+networkSource+'\n'+harness,sandbox,{filename:'network-full-command-trip.js'});
  return sandbox.TEST_LINK;
}

