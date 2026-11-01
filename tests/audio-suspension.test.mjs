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
