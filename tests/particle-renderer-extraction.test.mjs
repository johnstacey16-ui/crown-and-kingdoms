import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const effects = readFileSync(new URL('../js/render-effects.js', import.meta.url), 'utf8');

test('particle drawing belongs to the rendering module and keeps single ownership', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./engine.js'));
  assert.match(effects, /const PMAX=\[100,260,520\],PT=\[\]/);
  assert.match(effects, /function drawP\(\)\{for\(const p of PT\)/);
  assert.doesNotMatch(engine, /function drawP\(\)/);
});

test('particle ownership includes emission, lifetime and sprite warm-up, while engine schedules them', () => {
  for (const fn of ['emit','updP','queueWarm','warm']) {
    assert.ok(effects.includes('function '+fn+'('),fn+' must be effects-owned');
    assert.ok(!render.includes('function '+fn+'('),fn+' not duplicated in world render');
    assert.ok(!engine.includes('function '+fn+'('),fn+' must not be duplicated in engine');
  }
  assert.match(effects, /const PMAX=\[100,260,520\],PT=\[\]/);
  assert.match(effects, /let WQ=\[\]/);
  assert.match(render, /updP\(dt\)/);
  assert.match(engine, /queueWarm\(\)/);
  assert.match(render, /warm\(\)/);
  assert.match(render, /drawP\(\);X\.lineWidth=2;for\(const p of S\.pj\)/);
  assert.doesNotMatch(render,/const PMAX=|const PROJECTILE_STYLES=|function drawP\(/);
  assert.match(effects,/function queueWarm\(\)/);
  assert.match(effects,/function warm\(\)/);
});

function runtime(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n;globalThis.run=code=>eval(code);',sandbox);
 return sandbox.run;
}

test('particle cap, expiry and debris gravity preserve renderer lifecycle',()=>{
 const run=runtime();
 run('gq=0;PT.length=0;emit("deb",10,20,105,{l:.5,vz:1,s:0.1,c:"#abc",r:2})');
 assert.equal(run('PT.length'),100,'low graphics caps particles at 100');
 assert.equal(run('PT.every(p=>p.k==="deb"&&p.x===10&&p.y===20&&p.c==="#abc")'),true);
 const before=run('PT[0].vz');
 run('updP(.2)');
 assert.ok(run('PT[0].t')>=.2);
 assert.ok(run('PT[0].vz')<before,'debris loses upward velocity');
 run('updP(.3)');
 assert.equal(run('PT.length'),0,'expired particles are removed without shifting the world');
});

test('sprite warming retains player-civilization filtering and only processes queued textures',()=>{
 const run=runtime();
 run('S={civ:[0,1]};queueWarm()');
 const queued=run('WQ.length');
 assert.ok(queued>0);
 assert.equal(run('WQ.some(q=>q[0]==="tw"||q[0]==="cs"||q[0]==="tca")'),false);
 assert.equal(run('WQ.every(q=>q[1]>=0&&q[1]<=3)'),true);
 run('WQ=[["mil",1,0,0]];globalThis.warmed=[];spr=(key,w,h,paint)=>{warmed.push(key);return {}};performance.now=()=>0;warm()');
 assert.equal(run('WQ.length'),0);
 assert.equal(run('warmed[0]'),'mil|1|0|0');
});


test('warm-up skips ready atlas poses, observes late readiness and retains missing-image fallbacks',()=>{
 const run=runtime();
 run('globalThis.warmed=[];globalThis.probes=[];spr=(key)=>{warmed.push(key);return {}};performance.now=()=>0;hasReadyAssetPose=(k,t,s)=>{probes.push([k,t,s]);return k==="mil"};WQ=[["mil",0,0,0],["arc",1,1,2]];warm()');
 assert.deepEqual(JSON.parse(run('JSON.stringify(warmed)')),['arc|1|1|2']);assert.equal(run('WQ.length'),0);
 run('WQ=[["arc",1,1,2]];hasReadyAssetPose=()=>true;warm()');assert.equal(run('warmed.length'),1,'newly loaded art is observed after queue creation');
 run('WQ=[["arc",1,1,2]];hasReadyAssetPose=()=>false;warm()');assert.equal(run('warmed.length'),2,'missing art can still warm the original fallback');
});
