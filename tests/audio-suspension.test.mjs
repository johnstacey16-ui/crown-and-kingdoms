import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const audio=readFileSync(new URL('../js/audio.js',import.meta.url),'utf8');

function fixture(){
 let clock=1000,requested=0,resolveResume;
 const played=[];
 const AC={state:'suspended',currentTime:12,
  resume(){requested++;return new Promise(resolve=>{resolveResume=resolve})}};
 const document={hidden:false};
 const sandbox={AC,document,snd:1,mus:1,mode:'play',window:{},
  performance:{now:()=>clock},setTimeout:()=>1,played,music:0};
 vm.createContext(sandbox);
 vm.runInContext(audio,sandbox);
 vm.runInContext("aInit=()=>true;AUD.ok=1;AUD.b={ui:{},sf:{},mu:{},am:{}};aVol=()=>{};aAmb=()=>{};aMus=()=>{globalThis.music++};SFX.u_note.f=()=>played.push('notice');SFX.cmd.f=()=>played.push('command');globalThis.trigger=id=>sfx(id);globalThis.tick=()=>aTick();globalThis.status=()=>({queued:AUD.pendingCue?.id??null,at:AUD.resumeAt,step:aT,beat:AUD.nt,vc:AUD.vc});",sandbox);
 return {sandbox,AC,document,played,trigger:id=>sandbox.trigger(id),tick:()=>sandbox.tick(),
  status:()=>sandbox.status(),setTime:t=>{clock=t},resolve:async()=>{
   AC.state='running';resolveResume?.();
   await Promise.resolve();await Promise.resolve();
  },requests:()=>requested,music:()=>sandbox.music};
}

test('suspended 12ms audio ticks do not issue autoplay unlock requests or advance the soundtrack',()=>{
 const h=fixture();
 for(let i=0;i<100;i++)h.tick();
 assert.equal(h.requests(),0);
 assert.equal(h.music(),0);
 assert.equal(h.status().step,0);
});

test('the first audible UI notification is played once on resume',async()=>{
 const h=fixture();
 h.trigger('u_note');
 assert.equal(h.requests(),1);
 assert.equal(h.status().queued,'u_note');
 assert.equal(h.played.length,0);
 h.tick();h.tick();
 assert.equal(h.requests(),1);
 await h.resolve();
 assert.deepEqual(h.played,['notice']);
 assert.equal(h.status().queued,null);
 h.tick();
 assert.equal(h.music(),1,'music scheduling resumes after the AudioContext runs');
 assert.deepEqual(h.played,['notice'],'audio ticks must not replay the queued cue');
});

test('rapid suspended SFX do not call resume on every tick or overwrite the first alert',async()=>{
 const h=fixture();
 h.trigger('u_note');h.trigger('cmd');h.trigger('u_note');
 assert.equal(h.requests(),1);
 assert.equal(h.status().queued,'u_note');
 h.setTime(1499);h.trigger('cmd');assert.equal(h.requests(),1);
 h.setTime(1500);h.trigger('cmd');assert.equal(h.requests(),2,
  'a later explicit request can retry when a browser leaves the first resume pending');
 await h.resolve();
 assert.deepEqual(h.played,['notice']);
});

test('hidden tabs neither resume audio nor play stale notifications on return',async()=>{
 const h=fixture();
 h.document.hidden=true;
 h.trigger('u_note');
 for(let i=0;i<20;i++)h.tick();
 assert.equal(h.requests(),0);
 assert.equal(h.status().queued,null);
 h.document.hidden=false;
 h.trigger('u_note');
 assert.equal(h.requests(),1);
 h.setTime(4001);
 await h.resolve();
 assert.equal(h.played.length,0,'audio unlock must not emit an obsolete old alert');
 h.tick();
 assert.equal(h.music(),1);
});

test('missing and thrown browser resume functions never interrupt game input',()=>{
 const h=fixture();
 h.AC.resume=()=>{throw Error('playback blocked')};
 assert.doesNotThrow(()=>h.trigger('u_note'));
 assert.equal(h.requests(),0);
 assert.equal(h.status().queued,'u_note');
});

function musicFixture(){
 const calls=[],AC={state:'running',currentTime:10},sandbox={AC,snd:1,mus:1,mode:'play',S:{},gt:0,civ:0,calls};
 vm.createContext(sandbox);vm.runInContext(audio+"\nAUD.ok=1;aSt=()=> 'combat';aStep=(at,d,state)=>calls.push({at,d,state,phase:AUD.sp});globalThis.schedule=()=>aMus();globalThis.position=()=>({next:AUD.nt,phase:AUD.sp});",sandbox);
 return {AC,calls,schedule:()=>sandbox.schedule(),position:()=>sandbox.position()};
}
test('music resumes a future beat after a short scheduler stall without replaying overdue beats',()=>{
 const h=musicFixture();h.schedule();const first=h.position(),initial=h.calls.length;h.AC.currentTime+=.7;h.schedule();const resumed=h.calls.slice(initial);
 assert.ok(resumed.length>0&&resumed.length<=2,'only the lookahead window is scheduled');
 assert.ok(resumed.every(c=>c.at>=h.AC.currentTime),'overdue notes must not be sent to WebAudio');
 assert.ok(resumed[0].phase>first.phase,'missed beats advance musical phase instead of forming a burst');
 const duration=60/112/2;for(const c of resumed)assert.ok(Math.abs((c.at-10.1)/duration-c.phase)<1e-9,'resume stays on the original beat grid');
});
test('normal cadence and very long stalls keep music scheduling bounded and phase-consistent',()=>{
 const h=musicFixture();
 for(let i=0;i<100;i++){
  h.AC.currentTime=10+i*.12;const before=h.calls.length;h.schedule();const added=h.calls.slice(before);
  assert.ok(added.every(c=>c.at>=h.AC.currentTime));assert.ok(added.length<=2);
 }
 assert.deepEqual(h.calls.map(c=>c.phase),Array.from({length:h.calls.length},(_,i)=>i),'normal 120ms callbacks do not skip any beats');
 assert.equal(h.calls[0].at,10.1);
 const oldPhase=h.position().phase;h.AC.currentTime+=3600;const before=h.calls.length;h.schedule();const added=h.calls.slice(before);
 assert.ok(added.length<=2);assert.ok(added.every(c=>c.at>=h.AC.currentTime));assert.ok(h.position().phase>oldPhase+10000,'large backlog is skipped arithmetically');
});
